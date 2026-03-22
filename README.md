# AI Agent Job App

AI Agent Job App is a **CV screening system powered by a Large Language Model (LLM)**.  
It uses a **FastAPI backend**, a **frontend interface**, and custom **training scripts** for preparing and fine-tuning the CV analysis model.

The system processes CVs and assists with automated candidate screening.

---

## Project Structure

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

## Environment Setup

Create a virtual environment and install dependencies.

```bash
python -m venv .venv
source .venv/bin/activate

pip install pip-tools
pip-sync

cd frontend
npm install
```

## Run the server and model

```bash
ollama serve
redis-server
uvicorn app.main:app --reload
npm run dev
```

---

# RAG (Retrieval-Augmented Generation) Architecture

## What is RAG?

RAG is a technique that combines **retrieval** and **generation** to produce more accurate, context-aware responses from Large Language Models (LLMs). Instead of relying solely on an LLM's training data, RAG systems retrieve relevant external information first, then use that context to generate better responses.

---

## Core Components

### 1. **Retrieval Phase**

- Takes a user query or input
- Searches a knowledge base (vector database) for relevant documents
- Returns the most similar/relevant results based on semantic similarity

### 2. **Generation Phase**

- Takes the retrieved documents + original query
- Passes them to an LLM
- LLM generates a response informed by the retrieved context

---

## Architecture Flow

User Input \
↓ \
[Embedding] → Convert to vector representation \
↓ \
[Vector Search] → Query vector database \
↓ \
[Retrieved Docs] → Fetch relevant context \
↓ \
[Context + Prompt] → Build enhanced prompt \
↓ \
[LLM] → Generate response using context \
↓ \
Output

---

## Benefits of RAG

- **Accuracy** - LLM responses are grounded in actual data
- **Currency** - Can use up-to-date documents, not just training data
- **Fact-Checking** - Sources are traceable and verifiable
- **Reduced Hallucination** - LLM has factual context to reference
- **Domain-Specific** - Works with custom/private knowledge bases

---

## How AI Agent Job App Uses RAG

The application implements a RAG system for job matching:

### **Knowledge Base (Retrieval Component)**

- **Vector Store**: ChromaDB stores job listings with embeddings
- **Embedding Model**: `sentence-transformers/all-MiniLM-L6-v2` converts jobs into vector space
- **Data**: 5,000 jobs from the `lukebarousse/data_jobs` dataset
- **Flow**: \
  Jobs Dataset \
  ↓ \
  [Extract Features] → job_function, skills, location, etc. \
  ↓ \
  [Embed] → sentence-transformers creates vectors \
  ↓ \
  [Store] → ChromaDB persists vectors + metadata

### **Retrieval Process** (`index_manager.py`)

1. CV text + extracted skills → semantic query
2. Vector search retrieves top 100 similar jobs
3. Filter by country (if specified)
4. Rank by skill overlap + job function + job type + location
5. Return top 10 jobs

### **Generation Process** (`llm_service.py`)

Once a job is selected:

1. CV text + Job details → sent to LLM
2. LLM analyzes fit using the context
3. Returns: match_score, key_skills, missing_skills, summary

---

## Technology Stack

| Component           | Technology                        |
| ------------------- | --------------------------------- |
| **Vector DB**       | ChromaDB                          |
| **Embedding Model** | HuggingFace sentence-transformers |
| **Retrieval**       | LlamaIndex (VectorStoreIndex)     |
| **LLM**             | Ollama + Llama3.2:3b              |
| **Indexing**        | LlamaIndex                        |

## Workflow

### Upload CV → Get Job Matches (Retrieval Only, No LLM)

1. User uploads CV + selects preferences
2. `DocumentReader` extracts CV text
3. `SkillExtractor` uses LLM to identify technical skills
4. CV skills + text → vector search query
5. `IndexManager` retrieves similar jobs from ChromaDB
6. Jobs ranked by skill overlap + filters
7. Fast response (10 jobs) returned to frontend

### Analyze Job Match (RAG - Retrieval + Generation)

1. User clicks "Analyze" on a job
2. Retrieve that specific job from index
3. Send CV text + Job details to LLM
4. LLM generates analysis grounded in both documents
5. Return detailed match analysis

### Ask Question About Job (RAG - Retrieval + Generation)

1. User asks question about the job
2. Retrieve CV + Job context
3. Send to LLM with question + context
4. LLM answers based on CV + Job specifics
5. Return question-specific answer

## Key RAG Concepts

#### **Semantic Search** (`index_manager.py:retrieve_similar_jobs`)

- Uses vector similarity instead of keyword matching
- Finds conceptually similar jobs even if exact skills don't match
- More human-like understanding of relationships

### **Ranking/Scoring** (`index_manager.py:matchJobs`)

- Beyond retrieval: implements custom ranking
- Weighs factors: skill overlap (3x), function (2x), type (1x), location (2x)
- Ensures most relevant jobs appear first

### **Prompt Engineering** (`llm_service.py`)

- System rules constrain LLM to job-analysis domain
- Context (CV + Job) provided to LLM for grounding
- JSON format enforcement for structured output

---

## Why RAG for Job Matching?

- **Relevance** - Find jobs matching CV without manual filters
- **Ranking** - Most suitable jobs float to top through scoring
- **Details** - LLM can reason about why a job fits
- **Answers** - Candidates get personalized job insights
- **Fast Initial Results** - Vector search is quick; LLM only for deep analysis

---
