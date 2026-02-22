# This file is part of the Socratic Mirror hackathon project.

try:
    from google import genai
    from google.genai import types
    print("google.genai.types attributes:")
    for attr in dir(types):
        if "Config" in attr:
            print(f" - {attr}")
except ImportError as e:
    print(f"Import failed: {e}")
except Exception as e:
    print(f"Error: {e}")
