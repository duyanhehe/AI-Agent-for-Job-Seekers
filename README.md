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
├── data/ # ChromaDB + Uploads
│
├── frontend/ # React app
```

---

# Environment Setup

Create a virtual environment and install dependencies.

```bash
python -m venv .venv
source .venv/bin/activate

pip install pip-tools
pip-sync

cd frontend
npm install
npm run dev
```

# Run the server and model

```bash
ollama serve
uvicorn app.main:app --reload
```
