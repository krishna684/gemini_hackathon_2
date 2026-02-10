
from google import genai
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

try:
    print("Listing models...")
    for model in client.models.list():
        print(f"{model.name} (DisplayName: {model.display_name})")
        # print(model) # Detailed info
except Exception as e:
    print(f"Error listing models: {e}")
