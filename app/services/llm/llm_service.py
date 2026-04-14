from google import genai
from google.api_core import exceptions
from fastapi import HTTPException
import json
import asyncio
from app.services.cache.cache_service import cache_get, cache_set
from app.utils.cache_hash import make_hash
from app.core.config import GEMINI_API_KEY
from app.models.llm_function_usage import LLMFunctionUsage
from .prompts import (
    build_extract_external_job_info_prompt,
    build_match_cv_to_job_prompt,
    build_extract_profile_prompt,
    build_answer_job_question_prompt,
    build_generate_interview_prompt,
    build_grade_interview_prompt,
    build_cover_letter_prompt,
)
from .llm_guardrails import GuardrailValidator


class LLMService:
    """Uses Google Gemini 2.5 Flash and Gemini 2.5 Flash Lite for CV, job, and interview workflows."""

    def __init__(self, index_manager):
        """Initialize the Gemini client with retry logic and store the shared index_manager."""
        retry_options = genai.types.HttpRetryOptions(
            attempts=5,
            initial_delay=2.0,
            max_delay=60.0,
            exp_base=2.0,
            http_status_codes=[429, 503],
        )
        self.client = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options=genai.types.HttpOptions(retry_options=retry_options),
        )
        self.index_manager = index_manager

    def _get_rag_context(self, query):
        """Build truncated RAG context for a query via the job index."""
        context = self.index_manager.build_rag_context(query)
        return context[:2000]  # Limit context size for LLM input

    async def match_cv_to_job(self, cv, job, user_id, db, rag_context=None):
        """Score and explain fit between CV text and a job record."""
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} {job.get('job_function', '')} skills requirements"
            )
        prompt = build_match_cv_to_job_prompt(cv, job, rag_context)
        return await self._call_llm(
            prompt,
            "Match CV to Job",
            user_id,
            db,
            credits=1,
            job=job,
            rag_context=rag_context,
        )

    async def extract_profile(self, cv_text, user_id, db, basic_info=None):
        """Parse CV text into structured profile JSON (optionally with parser hints)."""
        prompt = build_extract_profile_prompt(cv_text, basic_info)
        return await self._call_llm(prompt, "Extract Profile", user_id, db, credits=1)

    async def answer_job_question(
        self, cv, job, question, user_id, db, rag_context=None
    ):
        """Answer a user question about a job using CV and optional RAG context."""
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} {question}"
            )

        prompt = build_answer_job_question_prompt(cv, job, question, rag_context)
        return await self._call_llm(
            prompt,
            "Answer Job Question",
            user_id,
            db,
            credits=1,
            job=job,
            rag_context=rag_context,
        )

    async def extract_external_job(self, description, user_id, db):
        """Extract structured fields from a free-text job description."""
        prompt = build_extract_external_job_info_prompt(description)
        return await self._call_llm(
            prompt, "Extract External Job", user_id, db, credits=1
        )

    async def generate_interview(self, cv, job, user_id, db, rag_context=None):
        """Generate mock interview questions and meta-evaluation for a job."""
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} interview questions skills"
            )

        prompt = build_generate_interview_prompt(cv, job, rag_context)
        return await self._call_llm(
            prompt, "Generate Interview", user_id, db, credits=3
        )

    async def grade_interview(self, cv, job, answers, user_id, db, rag_context=None):
        """Score and comment on a list of interview answers."""
        if not rag_context:
            rag_context = self._get_rag_context(
                query=f"{job.get('job_role', '')} expected answers skills evaluation"
            )

        prompt = build_grade_interview_prompt(cv, job, answers, rag_context)
        return await self._call_llm(prompt, "Grade Interview", user_id, db, credits=3)

    async def generate_cover_letter(self, cv, job, user_id, db, tone="engineering"):
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
        return await self._call_llm(
            prompt, "Generate Cover Letter", user_id, db, credits=2
        )

    async def _call_llm(
        self,
        prompt,
        function_name,
        user_id,
        db,
        credits=1,
        job=None,
        rag_context=None,
    ):
        """Call Gemini API, parse JSON, and record token usage."""

        cache_key = f"llm_prompt:{make_hash(prompt)}"
        lock_key = f"lock:{cache_key}"
        max_retries = 10
        retry_delay = 1.0  # seconds

        for _attempt in range(max_retries):
            # Check cache first
            cached_result = cache_get(cache_key)
            if cached_result:
                parsed = GuardrailValidator.sanitize(cached_result)

                # Reapply guardrails on cached data based on function_name
                if function_name == "Extract Profile":
                    parsed = GuardrailValidator.validate_profile(parsed)
                elif function_name == "Match CV to Job":
                    parsed = GuardrailValidator.validate_match(parsed, job=job)
                elif function_name == "Answer Job Question":
                    parsed = GuardrailValidator.validate_qa(
                        parsed, rag_context=rag_context
                    )
                    # Force RAG re-check on cache hit
                    if rag_context and parsed.get("answer"):
                        if not GuardrailValidator.validate_rag(
                            parsed["answer"], rag_context
                        ):
                            parsed["reason"] = "rag_hallucination"

                return parsed

            # Try to acquire a simple 'in-flight' lock in Redis
            # nx=True means only set if it doesn't exist
            # ex=60 means the lock expires in 60s (safety timeout)
            from app.core.redis import redis_client

            is_locked = redis_client.set(lock_key, "1", nx=True, ex=60)

            if is_locked:
                # We own the lock, proceed to call Gemini.
                break
            else:
                # Someone else is already calling Gemini for this prompt.
                # Wait a bit and then check the cache again.
                await asyncio.sleep(retry_delay)
        else:
            # If we exhausted retries without getting the lock or cache,
            # something might be wrong with the API or a long-running request.
            # We'll try to break the lock and proceed as a fallback.
            print(f"WARN: Lock timeout for {cache_key}. Breaking lock.")
            redis_client.delete(lock_key)

        try:
            # Try primary model (Gemini 2.5 Flash)
            try:
                response = await self.client.aio.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=genai.types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )
            except exceptions.ResourceExhausted:
                # Fallback to Gemini 2.5 Flash-Lite if 429 occurs
                print("Flash quota hit! Falling back to Flash-Lite...")
                try:
                    response = await self.client.aio.models.generate_content(
                        model="gemini-2.5-flash-lite",
                        contents=prompt,
                        config=genai.types.GenerateContentConfig(
                            response_mime_type="application/json",
                        ),
                    )
                except exceptions.ResourceExhausted:
                    return {"answer": "", "reason": "quota_exhausted"}

            raw_output = response.text

            # -------------------------
            # Record Token Usage
            # -------------------------
            usage = response.usage_metadata
            usage_entry = LLMFunctionUsage(
                user_id=user_id,
                function_name=function_name,
                credits_spent=credits,
                prompt_tokens=usage.prompt_token_count,
                completion_tokens=usage.candidates_token_count,
                total_tokens=usage.total_token_count,
            )
            db.add(usage_entry)
            db.commit()

            # -------------------------
            # Empty response handling
            # -------------------------
            if not raw_output or raw_output.strip() in ["", "null"]:
                return {"answer": "", "reason": "empty_response"}

            # -------------------------
            # Schema-Aware Parsing & Validation
            # -------------------------
            try:
                parsed = json.loads(raw_output)
            except Exception:
                print("LLM PARSE ERROR:", raw_output)
                return {"answer": "", "reason": "invalid_format"}
            if not isinstance(parsed, dict):
                return {"answer": "", "reason": "invalid_format"}

            parsed = GuardrailValidator.sanitize(parsed)

            # Route based on function_name for reliable schema handling
            if function_name == "Extract Profile":
                parsed = GuardrailValidator.validate_profile(parsed)
                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            elif function_name == "Match CV to Job":
                # Ensure structure for matching
                parsed.setdefault("key_skills", [])
                parsed.setdefault("missing_skills", [])
                if not parsed.get("summary"):
                    parsed["summary"] = "No summary could be generated."

                parsed = GuardrailValidator.validate_match(parsed, job=job)
                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            elif function_name == "Answer Job Question":
                # Ensure structure for Q&A
                if "answer" not in parsed:
                    parsed["answer"] = ""
                if "reason" not in parsed:
                    parsed["reason"] = "not_specified"

                parsed = GuardrailValidator.validate_qa(parsed, rag_context=rag_context)

                # FORCE RAG CHECK
                if rag_context and parsed.get("answer"):
                    if not GuardrailValidator.validate_rag(
                        parsed["answer"], rag_context
                    ):
                        parsed["reason"] = "rag_hallucination"

                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            elif function_name == "Extract External Job":
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

            elif function_name == "Generate Interview":
                parsed.setdefault("questions", [])
                parsed.setdefault(
                    "evaluation", {"difficulty": "", "focus_areas": [], "tips": []}
                )
                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            elif function_name == "Grade Interview":
                if not parsed.get("results"):
                    return {
                        "results": [],
                        "overall": {
                            "average_score": 0,
                            "summary": "Evaluation failed due to invalid model output.",
                            "improvements": [],
                        },
                    }
                return parsed

            elif function_name == "Generate Cover Letter":
                parsed.setdefault("cover_letter", "")
                cache_set(cache_key, parsed, ttl=86400)
                return parsed

            # Catch-all for any other schemas (mostly for safety)
            if "answer" in parsed or "reason" in parsed:
                if "answer" not in parsed or "reason" not in parsed:
                    return {"answer": "", "reason": "invalid_format"}
                return parsed

            print("UNKNOWN SCHEMA for function:", function_name, parsed)
            return {"answer": "", "reason": "invalid_format"}

        except (exceptions.ServiceUnavailable, exceptions.DeadlineExceeded):
            # Propagate Gemini 503/504 as a clean HTTP 503 for the frontend
            raise HTTPException(
                status_code=503,
                detail="The AI service is temporarily overloaded. Please try again in few minutes.",
            )
        except Exception as e:
            print("LLM ERROR:", str(e))
            return {"answer": "", "reason": "llm_failure"}
        finally:
            # Releasing the lock so others can try if this one failed
            # or simply finished.
            from app.core.redis import redis_client

            redis_client.delete(lock_key)
