# This file is part of the Socratic Mirror hackathon project.

import inspect
from google import genai

client = genai.Client(api_key="fake")
print(inspect.signature(client.aio.live.connect))
