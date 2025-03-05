import random
from .negotiation_logic import extract_price_from_text

class NegotiationState:
    """Represents the state of a negotiation session, including history and current offer."""
    
    def __init__(self):
        """Initialize a new negotiation state."""
        self.history = []  # List of (speaker, message) tuples
        self.price_history = []  # List of (speaker, price) tuples
        self.current_offer = None  # The current offer price
        self.agreed_price = None  # The agreed-upon price (if any)
        self.min_price = 18000  # Minimum seller price
        self.max_price = 30000  # Maximum initial asking price
        self.initial_price = random.uniform(self.min_price * 1.15, self.max_price)  # Initial asking price
        self.target_price = self.min_price * 1.1  # Seller's target price
        self.flexibility = random.uniform(0.05, 0.15)  # Seller's price flexibility (5-15%)
        self.strategies_used = []  # List of strategies used in this negotiation
        
        # Initialize metrics dictionary
        self.metrics = {
            'rounds': 0,
            'concessions_made': 0,
            'average_concession': 0,
            'strategy_effectiveness': {}
        }
        
        # Add initial greeting from the seller
        self.add_initial_greeting()
    
    def add_initial_greeting(self):
        """Add the initial seller greeting to the history."""
        greeting = f"Welcome! I'm selling a 2019 Honda Accord in excellent condition. It has low mileage, a clean history, and has been well-maintained. I'm asking ${self.initial_price:,.2f} for it, which is competitive for this model in this condition."
        self.add_to_history("Seller", greeting)
        self.current_offer = self.initial_price
        self.price_history.append(("Seller", self.initial_price))
    
    def add_to_history(self, speaker, message):
        """Add a message to the conversation history."""
        self.history.append((speaker, message))
        
        # If this is a buyer or seller message (not system), extract price and add to price history
        if speaker in ["Buyer", "Seller"]:
            price = extract_price_from_text(message)
            if price is not None:
                self.price_history.append((speaker, price))
                print(f"Added price to history: {speaker} - ${price}")
    
    def get_last_buyer_price(self):
        """Get the last price offered by the buyer."""
        for speaker, price in reversed(self.price_history):
            if speaker == "Buyer":
                return price
        return None
    
    def get_last_seller_price(self):
        """Get the last price offered by the seller."""
        for speaker, price in reversed(self.price_history):
            if speaker == "Seller":
                return price
        return None
    
    def update_offer(self, price):
        """Update the current offer price."""
        self.current_offer = price
    
    def set_agreed_price(self, price):
        """Set the agreed-upon price, finalizing the negotiation."""
        self.agreed_price = price
    
    def is_terminal(self):
        """Check if the negotiation has reached a terminal state."""
        return self.agreed_price is not None
    
    def record_strategy(self, strategy_name, was_effective=None):
        """Record a negotiation strategy that was used and track its effectiveness."""
        if not strategy_name:
            return
        
        # Add to list of strategies used
        self.strategies_used.append(strategy_name)
        
        # If we don't know if it was effective yet, just record usage
        if was_effective is None:
            return
        
        # Initialize strategy_effectiveness in metrics if needed
        if not hasattr(self, 'metrics'):
            self.metrics = {
                'rounds': 0,
                'concessions_made': 0,
                'average_concession': 0,
                'strategy_effectiveness': {}
            }
        
        # Ensure strategy_effectiveness exists in metrics
        if 'strategy_effectiveness' not in self.metrics:
            self.metrics['strategy_effectiveness'] = {}
        
        # Initialize this strategy if first time seeing it
        if strategy_name not in self.metrics['strategy_effectiveness']:
            self.metrics['strategy_effectiveness'][strategy_name] = {
                'used': 0,
                'effective': 0
            }
        
        self.metrics['strategy_effectiveness'][strategy_name]['used'] += 1
        if was_effective:
            self.metrics['strategy_effectiveness'][strategy_name]['effective'] += 1
        
        print(f"Strategy recorded: {strategy_name}, Effective: {was_effective}")
        print(f"Strategy stats: {self.metrics['strategy_effectiveness'][strategy_name]}")
    
    def get_effective_strategies(self):
        """Return a list of strategies sorted by effectiveness."""
        strategies = []
        
        for strategy, data in self.metrics['strategy_effectiveness'].items():
            effectiveness = data['effective'] / data['used'] if data['used'] > 0 else 0
            strategies.append((strategy, effectiveness))
        
        # Sort by effectiveness (descending)
        return sorted(strategies, key=lambda x: x[1], reverse=True)
    
    def get_negotiation_progress(self):
        """Calculate the negotiation progress as a percentage."""
        # Simple implementation: progress is based on number of rounds
        return min(100, self.metrics['rounds'] * 20)
    
    def __str__(self):
        """String representation of the negotiation state."""
        return f"NegotiationState(current_offer={self.current_offer}, agreed_price={self.agreed_price}, rounds={self.metrics['rounds']})"