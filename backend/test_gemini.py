import os

# Suppress noisy gRPC and ALTS logging - MUST BE SET BEFORE OTHER IMPORTS
os.environ["GRPC_VERBOSITY"] = "NONE"
os.environ["GLOG_minloglevel"] = "3"

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Key loaded: {'Yes' if api_key else 'No'}")

try:
    genai.configure(api_key=api_key)
    print("Listing models...")
    found = False
    for m in genai.list_models():
        if 'gemini' in m.name:
            print(f"- {m.name}")
            found = True
    
    if not found:
        print("No gemini models found! (API Key permission issue?)")

except Exception as e:
    print(f"Error listing models: {e}")
