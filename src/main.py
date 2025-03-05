from negotiation_stage import NegotiationState
from negotiation_logic import generate_buyer_offers, simulate_seller_response, classify_response, update_state

def main():
    state = NegotiationState()
    print("Starting Negotiation...")
    offers = generate_buyer_offers(state)
    chosen_offer = offers[0]  # Simple choice for now
    print(f"Buyer says: {chosen_offer}")
    seller_response = simulate_seller_response(state, chosen_offer)
    print(f"Seller says: {seller_response}")
    classification = classify_response(seller_response)
    print(f"Response Type: {classification}")
    update_state(state, chosen_offer, seller_response, classification)
    print("Updated State:", state)

if __name__ == "__main__":
    main()