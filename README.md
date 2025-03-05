# NegotAItion - AI-Powered Price Negotiation System

An intelligent negotiation system that simulates realistic car price negotiations between buyers and sellers, powered by AI. The system features a modern React frontend and a FastAPI backend with advanced negotiation strategies and real-time sentiment analysis.

## Features

- 🤖 AI-powered negotiation simulation
- 💬 Dynamic response generation based on negotiation context
- 📊 Real-time sentiment analysis of responses
- 🎯 Multiple negotiation strategies:
  - Increase Offer
  - Stand Firm
  - Split the Difference
  - Final Offer
  - Walk Away
- 📈 Progress tracking and negotiation metrics
- 🎨 Modern, responsive UI with dynamic animations
- 🔄 State management and negotiation history tracking

## Tech Stack

### Frontend
- React
- Axios for API communication
- Modern UI with dynamic animations
- Responsive design with CSS

### Backend
- FastAPI
- Anthropic's API for AI-powered responses
- Pydantic for data validation
- Python-dotenv for environment management

## Setup

1. Clone the repository:
```bash
git clone https://github.com/nirmal141/negotAItion.git
cd negotAItion
```

2. Set up the Python environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```
ANTHROPIC_API_KEY=your_api_key_here
```

4. Install frontend dependencies:
```bash
cd frontend
npm install
```

5. Start the backend server:
```bash
uvicorn src.api:app --reload
```

6. Start the frontend development server:
```bash
cd frontend
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:5173` (or the port shown in your frontend console)
2. Click "Start Negotiation" to begin a new negotiation session
3. Choose from available offers or select a negotiation strategy
4. Monitor the negotiation progress and sentiment analysis
5. Continue negotiating until a deal is reached or you decide to end the session

## API Endpoints

- `POST /negotiations/start` - Start a new negotiation session
- `POST /negotiations/{negotiation_id}/make_offer` - Make an offer in an existing negotiation
- `GET /negotiations/{negotiation_id}` - Get the current state of a negotiation
- `GET /negotiations` - List all active negotiations
- `DELETE /negotiations/{negotiation_id}` - Delete a negotiation session

## Features in Detail

### Negotiation State Management
- Tracks conversation history
- Maintains price history
- Monitors negotiation progress
- Records strategy effectiveness

### Sentiment Analysis
- Analyzes response positivity
- Measures negotiation openness
- Evaluates firmness of position
- Assesses flexibility in negotiations

### Dynamic Offer Generation
- Context-aware offer suggestions
- Price-conscious recommendations
- Strategy-based response generation
- Minimum price constraint handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
