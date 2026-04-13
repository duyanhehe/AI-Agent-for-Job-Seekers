class GuardrailValidator:
    """Validates and sanitizes LLM outputs."""

    @staticmethod
    def sanitize(parsed):
        if not isinstance(parsed, dict):
            return parsed

        blocked_keys = {"__proto__", "__class__", "__bases__"}

        return {k: v for k, v in parsed.items() if k not in blocked_keys}

    @staticmethod
    def validate_qa(parsed, rag_context=None):
        if not rag_context:
            return parsed

        answer = parsed.get("answer", "").lower()
        context = rag_context.lower()

        if not answer:
            return parsed

        # Extract meaningful tokens (ignore stopwords)
        answer_words = set(answer.split())
        context_words = set(context.split())

        # Remove very common weak tokens
        weak_tokens = {"the", "is", "and", "a", "an", "to", "of", "in", "on", "for"}
        answer_words = {w for w in answer_words if w not in weak_tokens}

        # STRICT check: at least 1 strong overlap required
        if not answer_words.intersection(context_words):
            parsed["reason"] = "rag_hallucination"

        return parsed

    @staticmethod
    def validate_match(parsed, job=None):
        if not job:
            return parsed

        allowed_skills = set(s.lower() for s in job.get("skills", []))

        def filter_skills(skills):
            if not allowed_skills:
                # If no skills expected in job, everything extracted is "extra"
                # but we'll allow it unless specified otherwise.
                # However, our current logic is to stick to allowed.
                return []
            return [s for s in skills if s.lower() in allowed_skills]

        parsed["key_skills"] = filter_skills(parsed.get("key_skills", []))
        parsed["missing_skills"] = filter_skills(parsed.get("missing_skills", []))

        return parsed

    @staticmethod
    def validate_profile(parsed):
        """Ensures profile has all required fields for frontend rendering."""
        if not isinstance(parsed, dict):
            return {}

        parsed.setdefault("name", "")
        parsed.setdefault("email", "")
        parsed.setdefault("phone", "")
        parsed.setdefault("location", "")
        parsed.setdefault("education", [])
        parsed.setdefault("work_experience", [])
        parsed.setdefault("skills", [])
        parsed.setdefault("projects", [])
        parsed.setdefault("activities", [])

        # Ensure lists are actually lists
        for key in ["education", "work_experience", "skills", "projects", "activities"]:
            if not isinstance(parsed[key], list):
                parsed[key] = []

        return parsed

    @staticmethod
    def validate_rag(answer: str, rag_context: str):
        if not rag_context:
            return True

        # naive check: answer should reference context terms
        context_words = set(rag_context.lower().split())

        if not any(word in context_words for word in answer.lower().split()):
            return False

        return True
