import httpx
import json


class SkillExtractor:
    def __init__(self):
        self.base_url = "http://localhost:11434/api/generate"

    async def extract_skills(self, cv_text):

        prompt = f"""
Extract technical skills from this CV.

Rules:
- Only include technical skills (programming languages, frameworks, tools).
- No soft skills.
- Return lowercase.
- Remove duplicates.

Extract technical skills including:
- programming languages
- frameworks
- libraries
- databases
- tools

Return JSON only:

{{"skills": []}}

CV:
{cv_text}
"""

        payload = {
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(self.base_url, json=payload)

        result = response.json()
        raw = result.get("response", "{}")

        try:
            return json.loads(raw).get("skills", [])
        except:
            return []
