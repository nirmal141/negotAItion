from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Tuple, Dict, Any
from .negotiation_stage import NegotiationState
from .negotiation_logic import (
    generate_buyer_offers, 
    simulate_seller_response, 
    classify_response, 
    update_state,
    analyze_negotiation_sentiment
)
import uuid
import time
import re

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active negotiations (in production, use a proper database)
negotiations = {}

class NegotiationResponse(BaseModel):
    negotiation_id: str
    history: List[Tuple[str, str]]
    current_offer: Optional[float]
    agreed_price: Optional[float]
    available_offers: List[str]
    progress_score: float
    metrics: Dict[str, Any]
    sentiment: Optional[Dict[str, float]]

class OfferRequest(BaseModel):
    offer_index: int
    strategy: Optional[str] = None
    offer_text: Optional[str] = None
    explicit_price: Optional[float] = None

class NegotiationOptions(BaseModel):
    include_stand_firm: bool = True
    num_offers: int = 4
    initial_price_range: Optional[Tuple[float, float]] = None

@app.post("/negotiations/start")
async def start_negotiation(options: Optional[NegotiationOptions] = None):
    """Start a new negotiation session with optional configuration."""
    # Use default options if none provided
    if options is None:
        options = NegotiationOptions()
    
    state = NegotiationState()
    
    # Set initial price range if provided
    if options.initial_price_range:
        state.min_price = options.initial_price_range[0]
        state.max_price = options.initial_price_range[1]
    
    # Generate initial offers
    offers = generate_buyer_offers(
        state, 
        num_offers=options.num_offers, 
        include_stand_firm=options.include_stand_firm
    )
    
    # Store the state and offers
    negotiation_id = str(uuid.uuid4())
    negotiations[negotiation_id] = {
        "state": state,
        "available_offers": offers,
        "created_at": time.time(),
        "last_updated": time.time()
    }
    
    return NegotiationResponse(
        negotiation_id=negotiation_id,
        history=state.history,
        current_offer=state.current_offer,
        agreed_price=state.agreed_price,
        available_offers=offers,
        progress_score=state.get_negotiation_progress(),
        metrics=state.metrics,
        sentiment=None  # No sentiment yet as negotiation just started
    )

@app.post("/negotiations/{negotiation_id}/make_offer")
async def make_offer(negotiation_id: str, offer_request: OfferRequest):
    """Make an offer and get the seller's response."""
    if negotiation_id not in negotiations:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    
    negotiation = negotiations[negotiation_id]
    state = negotiation["state"]
    offers = negotiation["available_offers"]
    
    if offer_request.offer_index < 0 or offer_request.offer_index >= len(offers):
        raise HTTPException(status_code=400, detail="Invalid offer index")
    
    # Record the chosen strategy if provided
    strategy_name = None
    if offer_request.strategy:
        strategy_name = offer_request.strategy
        print(f"Strategy selected: {strategy_name}")  # Debug print
        state.record_strategy(strategy_name)
    
    # Use explicit offer text if provided, otherwise use the offer from available offers
    chosen_offer = offer_request.offer_text if offer_request.offer_text else offers[offer_request.offer_index]
    print(f"Chosen offer: {chosen_offer}")  # Debug print
    
    # If explicit price is provided from the frontend, use it
    if offer_request.explicit_price is not None:
        print(f"Using explicit price: ${offer_request.explicit_price}")  # Debug print
        
        # For stand_firm strategy, we need to ensure we're using the correct price
        if strategy_name == "stand_firm":
            # Find the buyer's last offered price
            buyer_last_price = state.get_last_buyer_price()
            
            if buyer_last_price is not None:
                print(f"Standing firm at buyer's last price: ${buyer_last_price}")
                # Use the buyer's last price
                state.current_offer = buyer_last_price
                # Update the offer text to reflect the correct price
                chosen_offer = re.sub(
                    r'\$[0-9,]+(?:\.[0-9]+)?', 
                    f"${buyer_last_price:,.2f}", 
                    chosen_offer
                )
            else:
                # If no previous buyer price, use the explicit price
                state.current_offer = offer_request.explicit_price
        else:
            # For other strategies, use the explicit price from the offer
            state.current_offer = offer_request.explicit_price
    
    # Add the buyer's message to history BEFORE generating the seller's response
    state.add_to_history("Buyer", chosen_offer)
    
    # Generate the seller's response based on the updated state
    seller_response = simulate_seller_response(state, chosen_offer)
    
    # Analyze the response
    classification = classify_response(seller_response, chosen_offer)
    print(f"Response classification: {classification}")  # Debug print
    
    # Update the state with the new information (but don't add the buyer's message again)
    # We'll modify update_state to avoid adding the buyer's message twice
    update_state(state, None, seller_response, classification)
    
    # Evaluate if the strategy was effective
    if strategy_name:
        # A strategy is effective if:
        # 1. The seller accepted the offer
        # 2. The seller made a counter-offer that's better than previous
        # 3. The sentiment improved
        was_effective = False
        
        if classification == "accept":
            was_effective = True
        elif classification == "counter-offer" and state.current_offer:
            # Check if this counter-offer is better than previous
            previous_offers = [price for speaker, price in state.price_history if speaker == "Seller"]
            if previous_offers and len(previous_offers) >= 2:
                if previous_offers[-1] < previous_offers[-2]:
                    was_effective = True
        
        # Update strategy effectiveness
        state.record_strategy(strategy_name, was_effective)
        print(f"Strategy {strategy_name} effectiveness: {was_effective}")  # Debug print
    
    # Generate new offers if negotiation is still ongoing
    new_offers = []
    if not state.agreed_price:
        include_stand_firm = True
        
        # If the seller rejected with a minimum price, make sure we generate offers accordingly
        if classification == "reject" and hasattr(state, 'seller_minimum_price'):
            print(f"Generating offers considering seller's minimum price: ${state.seller_minimum_price}")
            # If the minimum price is higher than the current offer, generate offers accordingly
            if state.current_offer < state.seller_minimum_price:
                # Add an information message about the seller's minimum price
                seller_minimum_note = f"The seller has indicated they cannot go below ${state.seller_minimum_price:,.2f}."
                state.add_to_history("System", seller_minimum_note)
        
        # Generate new offers
        new_offers = generate_buyer_offers(state, include_stand_firm=include_stand_firm)
    
    # Update negotiation with new offers
    negotiation["available_offers"] = new_offers
    
    # Prepare response
    response = NegotiationResponse(
        negotiation_id=negotiation_id,
        history=state.history,
        current_offer=state.current_offer,
        agreed_price=state.agreed_price,
        available_offers=new_offers,
        progress_score=state.get_negotiation_progress(),
        metrics=state.metrics,
        sentiment=analyze_negotiation_sentiment(seller_response) if seller_response else None
    )
    
    return response

@app.get("/negotiations/{negotiation_id}")
async def get_negotiation(negotiation_id: str):
    """Get the current state of a negotiation."""
    if negotiation_id not in negotiations:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    
    negotiation = negotiations[negotiation_id]
    state = negotiation["state"]
    
    # Get the latest sentiment if available
    latest_sentiment = None
    if state.metrics['sentiment_history']:
        latest_sentiment = state.metrics['sentiment_history'][-1]
    
    return NegotiationResponse(
        negotiation_id=negotiation_id,
        history=state.history,
        current_offer=state.current_offer,
        agreed_price=state.agreed_price,
        available_offers=negotiation["available_offers"],
        progress_score=state.get_negotiation_progress(),
        metrics=state.metrics,
        sentiment=latest_sentiment
    )

@app.get("/negotiations")
async def list_negotiations():
    """List all active negotiations."""
    result = []
    for negotiation_id, negotiation in negotiations.items():
        state = negotiation["state"]
        result.append({
            "negotiation_id": negotiation_id,
            "created_at": negotiation["created_at"],
            "last_updated": negotiation["last_updated"],
            "message_count": len(state.history),
            "is_complete": state.is_terminal(),
            "progress_score": state.get_negotiation_progress()
        })
    return result

@app.delete("/negotiations/{negotiation_id}")
async def delete_negotiation(negotiation_id: str):
    """Delete a negotiation."""
    if negotiation_id not in negotiations:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    
    del negotiations[negotiation_id]
    return {"status": "success", "message": f"Negotiation {negotiation_id} deleted"} 