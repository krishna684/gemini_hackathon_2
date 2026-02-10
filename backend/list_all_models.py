
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

try:
    genai.configure(api_key=api_key)
    print("Full list of Gemini models:")
    for m in genai.list_models():
        if 'gemini' in m.name:
            print(m.name)
except Exception as e:
    print(f"Error: {e}")
