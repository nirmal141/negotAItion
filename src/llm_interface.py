import os
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not found in environment variables")

# Initialize Anthropic client
client = Anthropic()

def get_llm_response(prompt, max_tokens=1000):
    """Get a response from the LLM."""
    message = client.messages.create(
        model="claude-3-7-sonnet-20250219",
        max_tokens=max_tokens,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )
    return message.content[0].text