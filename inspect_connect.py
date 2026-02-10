
import inspect
from google import genai

client = genai.Client(api_key="fake")
print(inspect.signature(client.aio.live.connect))
