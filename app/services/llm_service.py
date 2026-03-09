import os
import httpx
import json
import re
import asyncio
from dotenv import load_dotenv

load_dotenv()

timeout = httpx.Timeout(
    timeout=60.0,
    connect=10.0,
    read=60.0,
    write=10.0,
)


class LLMService:
    def __init__(self):
        self.api_key = os.getenv("API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.cache = {}

        if not self.api_key:
            raise ValueError("API_KEY not found in environment variables.")

    async def generateResponse(self, context: str, query: str) -> dict:
        if not context:
            return {
                "suitability_score": 0,
                "key_skills": [],
                "missing_skills": [],
                "summary": "No relevant CV information found.",
            }

        # Cache
        cache_key = context + query
        if cache_key in self.cache:
            return self.cache[cache_key]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        prompt = f"""
You are a professional AI recruitment assistant.

Using ONLY the provided CV context, evaluate the candidate.

Return STRICTLY valid JSON in this exact format:

{{
  "suitability_score": number (0-100),
  "key_skills": [list of relevant skills found in CV],
  "missing_skills": [list of important skills not found],
  "summary": "short professional explanation"
}}

Rules:
- suitability_score must be an integer.
- Do NOT include extra text outside JSON.
- Do NOT use markdown.
- Only return valid JSON.

CV Context:
{context}

Job Question:
{query}
"""

        payload = {
            "model": "openrouter/free",
            "messages": [
                {"role": "system", "content": "You are a recruitment AI."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 400,
        }

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(self.base_url, headers=headers, json=payload)

        result = response.json()

        if "choices" not in result:
            raise Exception(f"OpenRouter error: {result}")

        raw_output = result["choices"][0]["message"]["content"]

        # Extract JSON safely
        try:
            json_match = re.search(r"\{.*\}", raw_output, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                self.cache[cache_key] = parsed
                return parsed
            else:
                raise ValueError("No JSON found in model response")

        except Exception:
            # Fallback if model misbehaves
            fallback = {
                "suitability_score": 0,
                "key_skills": [],
                "missing_skills": [],
                "summary": raw_output,
            }
            self.cache[cache_key] = fallback
            return fallback
