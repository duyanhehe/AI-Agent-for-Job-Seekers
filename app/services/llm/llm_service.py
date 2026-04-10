import httpx
import json
from app.services.cache.cache_service import cache_get, cache_set
from app.utils.cache_hash import make_hash
from .prompts import (
    build_extract_external_job_info_prompt,
    build_match_cv_to_job_prompt,
    build_extract_profile_prompt,
    build_answer_job_question_prompt,
    build_generate_interview_prompt,
    build_grade_interview_prompt,
    build_cover_letter_prompt,
)


class LLMService:
    """Calls a local Ollama-compatible API for CV, job, and interview workflows."""

    def __init__(self, index_manager):
        """Store the shared ``index_manager`` used for optional RAG context."""
        self.base_url = "http://localhost:11434/api/generate"
        self.index_manager = index_manager

    def _get_rag_context(self, query):
        """Build truncated RAG context for a query via the job index."""
        context = self.index_manager.build_rag_context(query)
        return context[:2000]  # Limit context size for LLM input

    async def match_cv_to_job(self, cv, job, rag_context=None):
        """Score and explain fit between CV text and a job record."""
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} {job.get('job_function', '')} skills requirements"
            )
        prompt = build_match_cv_to_job_prompt(cv, job, rag_context)
        return await self._call_llm(prompt)

    async def extract_profile(self, cv_text, basic_info=None):
        """Parse CV text into structured profile JSON (optionally with parser hints)."""
        prompt = build_extract_profile_prompt(cv_text, basic_info)
        return await self._call_llm(prompt)

    async def answer_job_question(self, cv, job, question, rag_context=None):
        """Answer a user question about a job using CV and optional RAG context."""
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} {question}"
            )

        prompt = build_answer_job_question_prompt(cv, job, question, rag_context)
        return await self._call_llm(prompt)

    async def extract_external_job(self, description: str):
        """Extract structured fields from a free-text job description."""
        prompt = build_extract_external_job_info_prompt(description)
        return await self._call_llm(prompt)

    async def generate_interview(self, cv, job, rag_context=None):
        """Generate mock interview questions and meta-evaluation for a job."""
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} interview questions skills"
            )

        prompt = build_generate_interview_prompt(cv, job, rag_context)
        return await self._call_llm(prompt)

    async def grade_interview(self, cv, job, answers, rag_context=None):
        """Score and comment on a list of interview answers."""
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} expected answers skills evaluation"
            )

        prompt = build_grade_interview_prompt(cv, job, answers, rag_context)
        return await self._call_llm(prompt)

    async def generate_cover_letter(self, cv, job, tone="engineering"):
        """Generate a customized cover letter based on CV, job, and tone."""
        tone_guidance = ""
        if tone == "engineering":
            tone_guidance = (
                "Focus on technical skills, specific tools/frameworks, and problem-solving. "
                "Keep it professional, concise, and direct."
            )
        elif tone == "sales":
            tone_guidance = (
                "Focus on achievements, metrics, communication, and persuasive skills. "
                "Make it outcome-oriented and energetic."
            )
        else:
            tone_guidance = "Keep it balanced and professional."

        prompt = build_cover_letter_prompt(cv, job, tone, tone_guidance)
        return await self._call_llm(prompt)

    async def _call_llm(self, prompt):
        """POST JSON prompt to Ollama and parse + validate JSON response."""

        model_name = "llama3.2:3b"

        # -------------------------
        # Cache check
        # -------------------------
        cache_key = f"llm_prompt:{make_hash(prompt)}"
        cached_result = cache_get(cache_key)
        if cached_result:
            return cached_result

        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        }

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(self.base_url, json=payload)

            result = response.json()
            raw_output = result.get("response", "")

            # -------------------------
            # Empty response handling
            # -------------------------
            if not raw_output or raw_output.strip() in ["", "null"]:
                return {"answer": "", "reason": "empty_response"}

            # -------------------------
            # Parse JSON
            # -------------------------
            try:
                parsed = json.loads(raw_output)
            except Exception:
                print("LLM PARSE ERROR:", raw_output)
                return {"answer": "", "reason": "invalid_format"}

            if not isinstance(parsed, dict):
                return {"answer": "", "reason": "invalid_format"}

            # -------------------------
            # Schema Detection + Validation
            # -------------------------

            # ---- Q&A format ----
            if "answer" in parsed or "reason" in parsed:
                if "answer" not in parsed or "reason" not in parsed:
                    return {"answer": "", "reason": "invalid_format"}

                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            # ---- Match CV → Job ----
            if all(k in parsed for k in ["key_skills", "missing_skills", "summary"]):
                parsed.setdefault("key_skills", [])
                parsed.setdefault("missing_skills", [])
                if not parsed.get("summary"):
                    parsed["summary"] = (
                        "No summary could be generated based on the provided CV and job."
                    )

                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            # ---- Extract Profile ----
            if "skills" in parsed and "work_experience" in parsed:
                parsed.setdefault("name", "")
                parsed.setdefault("email", "")
                parsed.setdefault("phone", "")
                parsed.setdefault("location", "")
                parsed.setdefault("education", [])
                parsed.setdefault("work_experience", [])
                parsed.setdefault("skills", [])
                parsed.setdefault("projects", [])
                parsed.setdefault("activities", [])

                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            # ---- Extract Job ----
            if "job_role" in parsed and "type_skills" in parsed:
                parsed.setdefault("job_role", "")
                parsed.setdefault("job_type", "")
                parsed.setdefault("salary", "")
                parsed.setdefault("work_from_home", False)
                parsed.setdefault("skills", [])
                parsed.setdefault(
                    "type_skills",
                    {
                        "programming_languages": [],
                        "frameworks": [],
                        "tools": [],
                        "databases": [],
                        "others": [],
                    },
                )

                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            # ---- Interview Generation ----
            if "questions" in parsed and "evaluation" in parsed:
                parsed.setdefault("questions", [])
                parsed.setdefault(
                    "evaluation", {"difficulty": "", "focus_areas": [], "tips": []}
                )

                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            # ---- Grade Interview ----
            if "results" in parsed and "overall" in parsed:
                if not parsed["results"]:
                    return {
                        "results": [],
                        "overall": {
                            "average_score": 0,
                            "summary": "Evaluation failed due to invalid model output.",
                            "improvements": [],
                        },
                    }
                return parsed

            # ---- Cover Letter ----
            if "cover_letter" in parsed:
                parsed.setdefault("cover_letter", "")

                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            # -------------------------
            # Unknown schema fallback
            # -------------------------
            print("UNKNOWN SCHEMA:", parsed)
            return {"answer": "", "reason": "invalid_format"}

        except Exception as e:
            print("LLM ERROR:", str(e))
            return {"answer": "", "reason": "llm_failure"}
