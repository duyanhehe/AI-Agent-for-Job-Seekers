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
    def __init__(self, index_manager):
        self.base_url = "http://localhost:11434/api/generate"
        self.index_manager = index_manager

    def _get_rag_context(self, query):
        context = self.index_manager.build_rag_context(query)
        return context[:2000]  # Limit context size for LLM input

    # --------------------------------------------------
    # Match CV to job
    # --------------------------------------------------
    async def match_cv_to_job(self, cv, job, rag_context=None):
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} {job.get('job_function', '')} skills requirements"
            )
        prompt = f"""
{SYSTEM_RULES}

Evaluate how well the candidate matches the job.

Use the provided MARKET CONTEXT to improve accuracy.
- Do not hallucinate
- Base reasoning on real-world expectations

CV:
{cv}

Job:
{job}

Market Context:
{rag_context}

Return JSON:

{{
"key_skills": [],
"missing_skills": [],
"summary": ""
}}
"""
        return await self._call_llm(prompt)

    # --------------------------------------------------
    # Extracting structured profile from CV
    # --------------------------------------------------
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

    # --------------------------------------------------
    # Answering job-related questions
    # --------------------------------------------------
    async def answer_job_question(self, cv, job, question, rag_context=None):
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} {question}"
            )

        prompt = f"""
{SYSTEM_RULES}
You MUST return valid JSON only.

Use MARKET CONTEXT if helpful to answer.

Candidate CV:
{cv}

Job:
{job}

Market Context:
{rag_context}

Question:
{question}

Return EXACTLY this format:

{{
"answer": "string",
"reason": "string"
}}
"""
        return await self._call_llm(prompt)

    # --------------------------------------------------
    # Job extraction from description
    # --------------------------------------------------
    async def extract_external_job(self, description: str):
        prompt = f"""
Extract structured job information from this job description.

STRICT RULES:
- Do NOT guess missing information
- Only extract if explicitly mentioned
- If not found → return "" or [] or false
- Skills must be technical only (programming, tools, frameworks, databases)
- Return skills in lowercase
- Remove duplicates

Fields to extract:

- job_role (exact role mentioned, e.g. frontend developer)
- job_type (full-time, part-time, contract, internship)
- salary (as written, do not normalize)
- work_from_home (true if remote/hybrid mentioned, else false)

For skills:
- Extract flat "skills" list
- Also group into "type_skills":
    - programming_languages
    - frameworks
    - tools
    - databases
    - others

Return JSON:

{{
"job_role": "",
"job_type": "",
"salary": "",
"work_from_home": false,
"skills": [],
"type_skills": {{
    "programming_languages": [],
    "frameworks": [],
    "tools": [],
    "databases": [],
    "others": []
}}
}}

Job Description:
{description}
"""
        return await self._call_llm(prompt)

    # --------------------------------------------------
    # Interview generation
    # --------------------------------------------------
    async def generate_interview(self, cv, job, rag_context=None):
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} interview questions skills"
            )

        prompt = f"""
{SYSTEM_RULES}

You are simulating a job interview.

STRICT RULES:
- Only generate interview-related content
- Do NOT include explanations outside JSON
- Do NOT guess missing information
- Use MARKET CONTEXT for realistic questions

TASK:
1. Generate 5-8 interview questions
2. Mix types:
   - technical
   - behavioral
   - situational
3. Tailor questions to candidate's experience + job requirements

4. Provide evaluation:
   - overall difficulty
   - key focus areas
   - tips to succeed

Candidate CV:
{cv}

Job:
{job}

Market Context:
{rag_context}

Return JSON:

{{
  "questions": [
    {{
      "question": "",
      "type": "technical | behavioral | situational",
      "expected_focus": ""
    }}
  ],
  "evaluation": {{
    "difficulty": "",
    "focus_areas": [],
    "tips": []
  }}
}}
"""
        return await self._call_llm(prompt)

    # --------------------------------------------------
    # Interview grading
    # --------------------------------------------------
    async def grade_interview(self, cv, job, answers, rag_context=None):
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} expected answers skills evaluation"
            )

        prompt = f"""
{SYSTEM_RULES}

You are evaluating a candidate's interview answers.

STRICT RULES:
- Evaluate each answer
- Be realistic and critical
- No hallucination
- Use MARKET CONTEXT to benchmark answers

Candidate CV:
{cv}

Job:
{job}

Market Context:
{rag_context}

Answers:
{answers}

Return JSON:

{{
  "results": [
    {{
      "question": "",
      "score": 0,
      "feedback": ""
    }}
  ],
  "overall": {{
    "average_score": 0,
    "summary": "",
    "improvements": []
  }}
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
