import hashlib


def make_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def normalize(text: str) -> str:
    return text.strip().lower()
