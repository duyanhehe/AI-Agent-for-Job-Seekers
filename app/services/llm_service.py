import httpx
import json

SYSTEM_RULES = """
You are an AI career assistant.

You ONLY help with:

1. Evaluating CV vs job match
2. Explaining why the candidate fits
3. Identifying missing skills
4. Answering questions about the job

You MUST NOT:
- Give unrelated advice
- Answer general knowledge
- Discuss politics or unrelated topics
- Generate content outside job analysis

Always respond strictly in JSON.
"""


class LLMService:
    def __init__(self):
        self.base_url = "http://localhost:11434/api/generate"

    async def match_cv_to_job(self, cv, job):

        prompt = f"""
{SYSTEM_RULES}

Evaluate how well the candidate matches the job.

CV:
{cv}

Job:
{job}

Return JSON:

{{
"key_skills": [],
"missing_skills": [],
"summary": ""
}}
"""

        return await self._call_llm(prompt)

    async def extract_profile(self, cv_text, basic_info=None):
        prompt = f"""
Extract structured user profile from this CV.

STRICT RULES:
- Do not guess missing information
- Only extract if explicitly present in the CV
- If not found, return empty string "" or empty list []
- Do NOT infer or assume anything

You are allowed to use these pre-extracted hints:
{basic_info}

For "skills":
- Only include technical skills (programming, tools, frameworks, databases)
- Exclude soft skills
- Return lowercase
- Remove duplicates

Return JSON:

{{
"name": "",
"email": "",
"phone": "",
"location": "",
"education": [
{{
    "school": "",
    "degree": "",
    "year": ""
}}
],
"work_experience": [
{{
    "company": "",
    "role": "",
    "duration": "",
    "description": ""
}}
],
"skills": [],
"projects": [],
"activities": []
}}

CV:
{cv_text}
"""
        return await self._call_llm(prompt)

    async def answer_job_question(self, cv, job, question):
        prompt = f"""
{SYSTEM_RULES}
You MUST return valid JSON only.
DO NOT include any explanation outside JSON.

Candidate CV:
{cv}

Job:
{job}

Question:
{question}

Return EXACTLY this format:

{{
"answer": "string",
"reason": "string"
}}
"""

        return await self._call_llm(prompt)

    async def _call_llm(self, prompt):
        payload = {
            "model": "llama3.2:3b",
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(self.base_url, json=payload)

        result = response.json()
        raw_output = result.get("response", "")

        # print("RAW LLM OUTPUT:", raw_output)

        if not raw_output or raw_output.strip() in ["", "null"]:
            return {"error": "Empty response from LLM", "answer": ""}

        try:
            parsed = json.loads(raw_output)

            # handle case where JSON is null
            if parsed is None:
                return {"error": "LLM returned null", "answer": ""}

            return parsed

        except Exception:
            return {
                "error": "Failed to parse LLM response",
                "answer": raw_output.strip(),  # fallback
            }
