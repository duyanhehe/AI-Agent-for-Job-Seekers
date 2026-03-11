import httpx
import json


class LLMService:
    def __init__(self):
        self.base_url = "http://localhost:11434/api/generate"

    async def match_cv_to_job(self, cv, job):

        prompt = f"""
You are an AI career advisor.

Evaluate how well the candidate matches the job.

Return STRICT JSON.

CV:
{cv}

Job:
{job}

JSON format:
{{
"key_skills": [],
"missing_skills": [],
"summary": ""
}}
"""

        return await self._call_llm(prompt)

    async def answer_job_question(self, cv, job, question):

        prompt = f"""
You are a career assistant.

Candidate CV:
{cv}

Job Description:
{job}

Question:
{question}

Return JSON:

{{
"answer": "",
"reason": ""
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

        try:
            return json.loads(raw_output)

        except Exception:
            return {
                "error": "Failed to parse LLM response",
                "raw_output": raw_output,
            }
