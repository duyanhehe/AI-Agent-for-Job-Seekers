from pathlib import Path

# Project root (AI_AGENT_JOB_APP/)
BASE_DIR = Path(__file__).resolve().parent.parent

# Data folder
DATA_DIR = BASE_DIR / "data"

# Upload directory
UPLOAD_DIR = DATA_DIR / "uploads"

# Chroma persistence directory
CHROMA_DIR = DATA_DIR / "chroma_db"

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
CHROMA_DIR.mkdir(parents=True, exist_ok=True)
