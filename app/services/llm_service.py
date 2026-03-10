import httpx
import json
import re


class LLMService:
    def __init__(self):
        self.base_url = "http://localhost:11434/api/generate"
        self.cache = {}

    async def generateResponse(self, context: str, query: str) -> dict:

        if not context:
            return {
                "suitability_score": 0,
                "key_skills": [],
                "missing_skills": [],
                "summary": "No relevant CV information found.",
            }

        cache_key = context + query
        if cache_key in self.cache:
            return self.cache[cache_key]

        prompt = f"""
You are a professional AI recruitment assistant.

Using ONLY the provided CV context, evaluate the candidate.

Return STRICTLY valid JSON in this format:

{{
"suitability_score": number from 0-100,
"key_skills": ["skill1","skill2"],
"missing_skills": ["skill1","skill2"],
"summary": "2-3 sentence explanation of why the candidate fits or does not fit the job"
}}


Rules:
- Only return JSON
- No markdown
- No explanation outside JSON
- Do not omit any fields
- Do not add extra text
- summary must not be empty

CV Context:
{context}

Job Question:
{query}
"""

        payload = {
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(self.base_url, json=payload)

        result = response.json()
        raw_output = result["response"]

        try:
            json_match = re.search(r"\{.*\}", raw_output, re.DOTALL)

            if json_match:
                parsed = json.loads(json_match.group())
                self.cache[cache_key] = parsed
                return parsed

            raise ValueError("No JSON found")

        except Exception:
            fallback = {
                "suitability_score": 0,
                "key_skills": [],
                "missing_skills": [],
                "summary": raw_output,
            }

            self.cache[cache_key] = fallback
            return fallback
