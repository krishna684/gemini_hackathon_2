# This file is part of the Socratic Mirror hackathon project.

try:
    from google.genai import types
    print("LiveConnectConfig fields:")
    import inspect
    print(inspect.signature(types.LiveConnectConfig))
    
    # Also check if response_modalities is a valid field
    conf = types.LiveConnectConfig(response_modalities=["AUDIO"])
    print("Successfully created LiveConnectConfig with response_modalities")
except Exception as e:
    print(f"Error: {e}")
