import os
import httpx
from dotenv import load_dotenv

load_dotenv()

timeout = httpx.Timeout(
    timeout=60.0,  # total timeout
    connect=10.0,  # connection timeout
    read=60.0,  # read timeout
    write=10.0,  # write timeout
)


class LLMService:
    def __init__(self):
        self.api_key = os.getenv("API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    async def generateResponse(self, context: str, query: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "openai/gpt-oss-120b:free",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an AI assistant helping with CV and job description matching.",
                },
                {
                    "role": "user",
                    "content": f"Context:\n{context}\n\nQuestion:\n{query}",
                },
            ],
        }

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(self.base_url, headers=headers, json=payload)

        result = response.json()

        if "choices" not in result:
            raise Exception(f"OpenRouter error: {result}")

        return result["choices"][0]["message"]["content"]
