import httpx
import json


class LLMService:
    def __init__(self):
        self.base_url = "http://localhost:11434/api/generate"
        self.cache = {}

    def detect_query_type(self, query: str) -> str:
        q = query.lower()

        # Job recommendation queries
        job_keywords = [
            "what job",
            "which job",
            "recommend job",
            "what role",
            "what position",
            "jobs suitable",
        ]

        # CV screening queries
        screening_keywords = [
            "suitable",
            "fit",
            "qualified",
            "good candidate",
            "match",
            "right for",
        ]

        if any(k in q for k in job_keywords):
            return "job_recommendation"

        if any(k in q for k in screening_keywords):
            return "screening"

        return "qa"

    def build_screening_prompt(self, context: str, query: str) -> str:
        return f"""
You are a professional AI recruitment assistant.

Using ONLY the provided CV context, evaluate the candidate for the job.

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
- summary must not be empty

CV Context:
{context}

Job Description / Question:
{query}
"""

    def build_qa_prompt(self, context: str, query: str) -> str:
        return f"""
You are an AI assistant that answers questions about a candidate's CV.

Use ONLY the provided CV context.

Return JSON in this format:

{{
"answer": "clear answer",
"evidence": ["exact sentence from the CV"]
}}

Rules:
- Only return JSON
- Do not include extra text

CV Context:
{context}

Question:
{query}
"""

    def build_job_recommendation_prompt(self, context: str, query: str) -> str:
        return f"""
You are an AI career assistant.

Based on the CV below, recommend suitable job roles.

Return JSON in this format:

{{
"recommended_jobs":[
{{"title":"job title","reason":"short explanation"}}
]
}}

Rules:
- Only return JSON
- No extra text
- Recommend 3-5 job roles

CV Context:
{context}

User Question:
{query}
"""

    async def generateResponse(self, context: str, query: str) -> dict:

        if not context:
            return {"error": "No relevant CV information found."}

        cache_key = context + query

        if cache_key in self.cache:
            return self.cache[cache_key]

        query_type = self.detect_query_type(query)

        if query_type == "screening":
            prompt = self.build_screening_prompt(context, query)

        elif query_type == "job_recommendation":
            prompt = self.build_job_recommendation_prompt(context, query)

        else:
            prompt = self.build_qa_prompt(context, query)

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
            parsed = json.loads(raw_output)
            self.cache[cache_key] = parsed
            return parsed

        except Exception:
            fallback = {
                "error": "Failed to parse LLM response",
                "raw_output": raw_output,
            }

            self.cache[cache_key] = fallback
            return fallback
