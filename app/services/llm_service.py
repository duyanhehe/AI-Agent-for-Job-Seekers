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
"match_score": number,
"key_skills": [],
"missing_skills": [],
"summary": ""
}}
"""

        return await self._call_llm(prompt)

    async def answer_job_question(self, cv, job, question):

        prompt = f"""
{SYSTEM_RULES}

Candidate CV:
{cv}

Job:
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
