# AI Agent Job App

AI Agent Job App is a **CV screening system powered by a Large Language Model (LLM)**.  
It uses a **FastAPI backend**, a **frontend interface**, and custom **training scripts** for preparing and fine-tuning the CV analysis model.

The system processes CVs and assists with automated candidate screening.

---

# Project Structure

```
AI_AGENT_JOB_APP
│
├── app/ # FastAPI backend
│
├── training/ # model training scripts
│ ├── dataset/
│ │ └── generate_dataset.py
│ │
│ ├── fine_tune.py
│ ├── prepare_dataset.py
│ └── quantize_model.py
│
├── models/ # trained models
│ └── cv_screening_llm
│
├── frontend/ # UI
│
└── data/
```

---

# Environment Setup

Create a virtual environment and install dependencies.

```bash
python -m venv .venv
source .venv/bin/activate

pip install pip-tools
pip-sync
```

# Run the server and model

```bash
ollama serve
uvicorn app.main:app --reload
```
