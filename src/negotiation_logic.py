from .llm_interface import get_llm_response
import re
from typing import List, Dict, Any, Tuple
import numpy as np
from functools import lru_cache

# Cache for expensive LLM operations
@lru_cache(maxsize=128)
def cached_llm_response(prompt_key, max_tokens=1000):
    """Cached version of LLM response to avoid duplicate calls."""
    return get_llm_response(prompt_key, max_tokens)

def extract_price_from_text(text: str) -> float:
    """Extract price from text using regex pattern matching."""
    # Look for dollar amounts in the text
    price_matches = re.findall(r'\$([0-9,]+(?:\.[0-9]+)?)', text)
    if price_matches:
        # Convert the first match to a float
        return float(price_matches[0].replace(',', ''))
    return None

def analyze_negotiation_sentiment(text: str) -> Dict[str, float]:
    """
    Analyze the sentiment of a negotiation message.
    Returns a dictionary with sentiment scores.
    """
    prompt = f"""
    Analyze the following negotiation message for sentiment and intent:
    "{text}"
    
    Rate each of these aspects on a scale of 0-10:
    - Positivity (how positive the tone is)
    - Openness (willingness to continue negotiating)
    - Firmness (how firm they are on their position)
    - Flexibility (willingness to compromise)
    
    Return only a JSON object with these ratings, like:
    {{
      "positivity": 7,
      "openness": 6,
      "firmness": 8,
      "flexibility": 4
    }}
    """
    
    response = get_llm_response(prompt, max_tokens=200)
    
    # Extract JSON from response
    try:
        import json
        # Find anything that looks like a JSON object
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            sentiment_data = json.loads(json_match.group(0))
            return sentiment_data
        else:
            # Fallback values if parsing fails
            return {
                "positivity": 5,
                "openness": 5,
                "firmness": 5,
                "flexibility": 5
            }
    except Exception as e:
        print(f"Error parsing sentiment: {e}")
        return {
            "positivity": 5,
            "openness": 5,
            "firmness": 5,
            "flexibility": 5
        }

def generate_buyer_offers(state, num_offers=4, include_stand_firm=True):
    """
    Generate possible offers from the buyer using the LLM.
    Now includes awareness of seller's minimum price constraints.
    """
    history_str = "\n".join([f"{speaker}: {msg}" for speaker, msg in state.history])
    
    # Determine the last buyer offer price if any
    last_buyer_price = None
    for speaker, msg in reversed(state.history):
        if speaker == "Buyer":
            extracted_price = extract_price_from_text(msg)
            if extracted_price:
                last_buyer_price = extracted_price
                break
    
    # Analyze seller's sentiment if there's history
    seller_sentiment = None
    if state.history:
        for speaker, msg in reversed(state.history):
            if speaker == "Seller":
                seller_sentiment = analyze_negotiation_sentiment(msg)
                break
    
    # Check if seller has indicated a minimum price
    seller_minimum = getattr(state, 'seller_minimum_price', None)
    
    # Construct a more sophisticated prompt based on negotiation state
    prompt = f"""
    You are an expert negotiator helping a buyer purchase a car. The current negotiation history is:
    {history_str}
    
    """
    
    if seller_sentiment:
        prompt += f"""
    Analysis of the seller's last response:
    - Positivity: {seller_sentiment['positivity']}/10
    - Openness to negotiation: {seller_sentiment['openness']}/10
    - Firmness on position: {seller_sentiment['firmness']}/10
    - Flexibility: {seller_sentiment['flexibility']}/10
    
    """
    
    if seller_minimum:
        prompt += f"""
    IMPORTANT: The seller has clearly stated they cannot go below ${seller_minimum:,.2f}.
    Your generated offers should acknowledge this constraint.
    
    """
    
    prompt += f"""
    Generate exactly {num_offers} possible strategic offers the buyer can make next.
    
    """
    
    if include_stand_firm and last_buyer_price:
        prompt += f"""
    IMPORTANT: One of the options MUST be to stand firm on the previous offer of ${last_buyer_price:,.2f}.
    
    """
    
    if seller_minimum and last_buyer_price and last_buyer_price < seller_minimum:
        prompt += f"""
    IMPORTANT: Since the seller won't go below ${seller_minimum:,.2f} and the buyer's last offer was ${last_buyer_price:,.2f}, 
    include at least one option that acknowledges this price gap and tries to meet the seller's minimum or 
    find a creative compromise (such as asking for additional features, warranty, etc. at the higher price).
    
    """
    
    prompt += f"""
    Each offer should:
    1. Include a specific price in dollars
    2. Be a natural, persuasive sentence
    3. Use a different negotiation tactic
    4. Consider the seller's previous responses
    
    Format your response exactly like this:
    
    1. [First offer with specific price]
    2. [Second offer with specific price]
    3. [Third offer with specific price]
    4. [Fourth offer with specific price]
    
    Make sure each offer includes a specific dollar amount.
    """
    
    response = get_llm_response(prompt)
    
    # Split by newlines and filter for lines that start with a number followed by a period
    offers = [line.split(". ", 1)[1].strip() for line in response.split("\n") 
              if line.strip() and line.strip()[0].isdigit() and ". " in line]
    
    if not offers:
        # Fallback offers if parsing fails
        offers = ["I would like to offer $20,000 for the car."]
        if include_stand_firm and last_buyer_price:
            offers.append(f"I'm standing firm at my offer of ${last_buyer_price:,.2f}.")
    
    return offers[:num_offers]

def simulate_seller_response(state, buyer_offer):
    """
    Simulate the seller's response to the buyer's offer using the LLM.
    Enhanced with memory of negotiation patterns and more realistic behavior.
    """
    history_str = "\n".join([f"{speaker}: {msg}" for speaker, msg in state.history])
    
    # Extract price from buyer's offer
    buyer_price = extract_price_from_text(buyer_offer)
    
    # Determine if this is a "stand firm" offer
    is_standing_firm = False
    last_buyer_price = None
    
    if len(state.price_history) >= 2:
        buyer_prices = [price for speaker, price in state.price_history if speaker == "Buyer"]
        if len(buyer_prices) >= 2:
            last_buyer_price = buyer_prices[-2]  # Get the previous buyer price
            if buyer_price and last_buyer_price and abs(buyer_price - last_buyer_price) < 0.01:
                is_standing_firm = True
                print(f"Detected buyer standing firm at ${buyer_price}")
    
    # Calculate negotiation statistics
    buyer_offers = [price for speaker, price in state.price_history if speaker == "Buyer"]
    seller_offers = [price for speaker, price in state.price_history if speaker == "Seller"]
    
    # Calculate trends
    buyer_trend = "unknown"
    if len(buyer_offers) >= 2:
        if buyer_offers[-1] > buyer_offers[0]:
            buyer_trend = "increasing"
        elif buyer_offers[-1] < buyer_offers[0]:
            buyer_trend = "decreasing"
        else:
            buyer_trend = "stable"
    
    # Check if seller has a minimum price constraint
    seller_minimum = getattr(state, 'seller_minimum_price', state.min_price)
    
    # Construct a more sophisticated prompt
    prompt = f"""
    You are an experienced car seller in a negotiation. The current negotiation history is:
    {history_str}
    
    The buyer just said: '{buyer_offer}'
    """
    
    if buyer_price:
        prompt += f"\nThe buyer's current offer is: ${buyer_price:,.2f}\n"
    
    if is_standing_firm:
        prompt += "\nNote: The buyer is standing firm on their previous offer.\n"
    
    if seller_minimum and buyer_price and buyer_price < seller_minimum:
        prompt += f"\nIMPORTANT: Your minimum acceptable price is ${seller_minimum:,.2f}. You cannot accept anything lower than this.\n"
    
    if buyer_offers:
        prompt += f"""
    Negotiation statistics:
    - Buyer's first offer: ${buyer_offers[0]:,.2f}
    - Buyer's latest offer: ${buyer_offers[-1]:,.2f}
    - Buyer's price trend: {buyer_trend}
    - Number of offers exchanged: {len(state.history) // 2}
    """
    
    prompt += """
    Generate a realistic response as the seller. Your response should:
    1. Be a single paragraph
    2. Consider the negotiation history and buyer's behavior
    3. Include a specific counter-offer price if you're not accepting
    4. Be firm but professional
    
    If the buyer is standing firm below your minimum acceptable price, clearly communicate your minimum price.
    If the buyer's offer is good (at or above your minimum), consider accepting it.
    If you're making a counter-offer, include a specific dollar amount.
    If you have already stated a minimum price and the buyer is still below it, be firm but polite in rejecting.
    """
    
    return get_llm_response(prompt)

def classify_response(response, buyer_offer):
    """
    Classify the seller's response as accept, counter-offer, or reject.
    Enhanced with more sophisticated analysis.
    """
    # Extract prices
    seller_price = extract_price_from_text(response)
    buyer_price = extract_price_from_text(buyer_offer)
    
    # Look for acceptance phrases
    acceptance_phrases = [
        "accept", "agreed", "deal", "sold", "you got it", 
        "we have a deal", "i'll take it", "that works"
    ]
    
    # Look for explicit rejection phrases
    rejection_phrases = [
        "cannot go below", "can't go below", "can't go any lower", 
        "won't go below", "won't accept less than", "minimum is",
        "lowest I can go", "bottom line is", "absolute bottom line",
        "can't accept", "cannot accept", "won't accept", "don't accept",
        "reject", "decline", "not acceptable", "too low",
        "can't do that", "cannot do that", "won't do that"
    ]
    
    has_acceptance = any(phrase in response.lower() for phrase in acceptance_phrases)
    has_rejection = any(phrase in response.lower() for phrase in rejection_phrases)
    
    # If there are conflicting signals (both acceptance and rejection phrases),
    # we need to analyze more carefully
    if has_acceptance and has_rejection:
        has_acceptance = False  # Give preference to rejection in this case
    
    # Check for price constraint rejection
    has_price_constraint = False
    constraint_price = None
    
    for phrase in rejection_phrases:
        if phrase in response.lower():
            # Extract the constraint price mentioned after the phrase
            constraint_index = response.lower().find(phrase) + len(phrase)
            constraint_text = response[constraint_index:constraint_index + 50]  # Look ahead 50 chars
            constraint_match = re.search(r'\$([0-9,]+(?:\.[0-9]+)?)', constraint_text)
            
            if constraint_match:
                constraint_price = float(constraint_match.group(1).replace(',', ''))
                has_price_constraint = True
                print(f"Found price constraint: ${constraint_price}")
                break
    
    # Absolute rejection rules:
    
    # 1. If seller explicitly states a minimum price and it's higher than buyer's offer
    if has_price_constraint and buyer_price and constraint_price > buyer_price:
        print(f"Rejecting because constraint price ${constraint_price} > buyer price ${buyer_price}")
        return "reject"
    
    # 2. If there are explicit rejection phrases and no acceptance phrases
    if has_rejection and not has_acceptance:
        print("Rejecting because found rejection phrase without acceptance phrase")
        return "reject"
    
    # 3. If there are explicit acceptance phrases
    if has_acceptance and not has_rejection:
        print("Accepting because found acceptance phrase without rejection phrase")
        return "accept"
    
    # 4. If seller provides a counter-offer (a specific price)
    if seller_price and not has_price_constraint and not has_acceptance:
        print(f"Counter-offering with ${seller_price}")
        return "counter-offer"
    
    # 5. For ambiguous cases, use the LLM to classify
    print("Using LLM to classify ambiguous response")
    prompt = f"""
    Given the buyer's offer: '{buyer_offer}'
    And the seller's response: '{response}'
    
    IMPORTANT: Pay careful attention to any language indicating the seller won't go below a certain price.
    
    Classify the seller's response as exactly one of these:
    - 'accept' (seller agrees to the buyer's price)
    - 'counter-offer' (seller proposes a different price)
    - 'reject' (seller rejects without a specific counter-offer or states they can't go below a price higher than the buyer's offer)
    
    If the seller states they cannot go below a certain price that is HIGHER than what the buyer offered, this should be classified as 'reject'.
    If there's language like "I can't go below $X" and X is higher than the buyer's offer, this is a rejection.
    
    Return only the classification word.
    """
    classification = get_llm_response(prompt, max_tokens=20).strip().lower()
    print(f"LLM classification: {classification}")
    return classification

def update_state(state, buyer_offer, seller_response, classification):
    """
    Update the negotiation state based on the offer and response.
    Enhanced with better price extraction and state management.
    """
    # Only add buyer offer to history if provided (not None)
    if buyer_offer is not None:
        state.add_to_history("Buyer", buyer_offer)
    
    # Always add seller response to history
    state.add_to_history("Seller", seller_response)
    
    # Extract prices
    buyer_price = None
    if buyer_offer:
        buyer_price = extract_price_from_text(buyer_offer)
    else:
        # If buyer_offer is None, get the last buyer price from history
        buyer_price = state.get_last_buyer_price()
    
    seller_price = extract_price_from_text(seller_response)
    
    if classification == "accept":
        # If seller accepts, use the buyer's price
        if buyer_price:
            state.set_agreed_price(buyer_price)
        # If no buyer price found but seller mentions a price, use that
        elif seller_price:
            state.set_agreed_price(seller_price)
        # Fallback to current offer if available
        elif state.current_offer:
            state.set_agreed_price(state.current_offer)
    elif classification == "counter-offer" and seller_price:
        state.update_offer(seller_price)
    elif classification == "reject":
        # Generate new offers that take into account the rejection
        # We don't update the price here, but we can add a note to the next offers
        print("Seller rejected the offer without a specific counter-offer.")
        
        # Check for minimum price mentioned in the rejection
        minimum_price = None
        minimum_phrases = [
            "cannot go below", "can't go below", "can't go any lower", 
            "won't go below", "won't accept less than", "minimum is",
            "lowest I can go", "bottom line is", "absolute bottom line"
        ]
        
        for phrase in minimum_phrases:
            if phrase in seller_response.lower():
                # Extract the constraint price mentioned after the phrase
                constraint_index = seller_response.lower().find(phrase) + len(phrase)
                constraint_text = seller_response[constraint_index:constraint_index + 50]
                constraint_match = re.search(r'\$([0-9,]+(?:\.[0-9]+)?)', constraint_text)
                
                if constraint_match:
                    minimum_price = float(constraint_match.group(1).replace(',', ''))
                    break
        
        if minimum_price:
            print(f"Seller indicated they won't go below ${minimum_price}.")
            # Store this information in the state for generating future offers
            state.seller_minimum_price = minimum_price
    
    # Update negotiation metrics
    update_negotiation_metrics(state, buyer_offer or "", seller_response, classification)
    
    return state

def update_negotiation_metrics(state, buyer_offer, seller_response, classification):
    """
    Update negotiation metrics to track progress and strategy effectiveness.
    """
    if not hasattr(state, 'metrics'):
        state.metrics = {
            'rounds': 0,
            'concessions_made': 0,
            'average_concession': 0,
            'strategy_effectiveness': {}
        }
    
    # Increment rounds
    state.metrics['rounds'] += 1
    
    # Track price changes using price_history instead of parsing messages again
    buyer_prices = [price for speaker, price in state.price_history if speaker == "Buyer"]
    seller_prices = [price for speaker, price in state.price_history if speaker == "Seller"]
    
    # Check for buyer concessions
    if len(buyer_prices) >= 2:
        # Check if buyer offered more
        if buyer_prices[-1] > buyer_prices[-2]:
            state.metrics['concessions_made'] += 1
            concession_amount = buyer_prices[-1] - buyer_prices[-2]
            
            # Update average concession
            current_avg = state.metrics.get('average_concession', 0)
            concessions_count = state.metrics.get('concessions_made', 1)
            state.metrics['average_concession'] = (current_avg * (concessions_count - 1) + concession_amount) / concessions_count
    
    if classification == "accept":
        print(f"Negotiation successful! Accepted price: {buyer_prices[-1] if buyer_prices else 'unknown'}")
    
    # Add sentiment analysis to the metrics
    sentiment = analyze_negotiation_sentiment(seller_response)
    if sentiment:
        # Ensure the sentiment_history list exists
        if 'sentiment_history' not in state.metrics:
            state.metrics['sentiment_history'] = []
        state.metrics['sentiment_history'].append(sentiment)
        
    return state