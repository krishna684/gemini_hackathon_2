
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

try:
    genai.configure(api_key=api_key)
    with open('models_list.txt', 'w') as f:
        for m in genai.list_models():
            if 'gemini' in m.name:
                f.write(f"{m.name}\n")
    print("Models written to models_list.txt")
except Exception as e:
    print(f"Error: {e}")
