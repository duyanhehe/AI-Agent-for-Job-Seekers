import re


def extract_email(text: str) -> str:
    matches = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    return matches[0] if matches else ""


def extract_phone(text: str) -> str:
    matches = re.findall(r"\+?\d[\d\s\-]{7,15}", text)
    return matches[0] if matches else ""


def extract_basic_info(text: str) -> dict:
    return {
        "email": extract_email(text),
        "phone": extract_phone(text),
    }
