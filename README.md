# AI Agent Job App

An intelligent job application assistant that uses LLM and RAG to help job seekers find matching positions, analyze job fit, practice interviews, and generate customized cover letters. The system extracts CV information, performs semantic search across a job database, and provides AI-powered insights about job compatibility.

**Key Features:**
- Upload and parse CVs automatically
- AI-powered job matching using semantic search
- Analyze job fit with detailed recommendations
- Practice mock interviews with AI feedback
- Generate customized cover letters
- Extract job requirements from descriptions
- Real-time job recommendations based on skills

---

## Project Structure

```
AI_Agent_Job_App/
├── app/                        # FastAPI backend
│   ├── main.py                # Application entry point
│   ├── api/                   # API routes
│   │   ├── router.py          # Main router
│   │   └── routes/            # Route modules
│   ├── core/                  # Core functionality
│   ├── models/                # SQLAlchemy ORM models
│   ├── schemas/               # Pydantic schemas
│   ├── services/              # Business logic
│   │   ├── auth/              # Auth service
│   │   ├── cache/             # Cache service
│   │   ├── documents/         # Document processing
│   │   ├── jobs/              # Job matching
│   │   ├── llm/               # LLM integration
│   │   └── reference/         # Reference services
│   ├── storage/               # Vector database
│   └── utils/                 # Utilities
├── frontend/                  # React application
│   ├── index.html             # HTML entry point
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── src/                   # React source code
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── assets/            # Static assets
│   │   └── index.css
│   ├── public/                # Public assets
│   └── dist/                  # Built frontend (npm run build)
├── data/                      # Data storage
│   ├── uploads/               # User uploaded CVs
│   └── chroma_db/             # Vector database persistence
├── nginx/                     # Reverse proxy configuration
│   ├── nginx.conf             # Main configuration
│   ├── certs/                 # SSL certificates
│   │   ├── server.crt
│   │   └── server.key
│   └── logs/                  # Access logs
├── documents/                 # Documentation files
├── docker-compose.yml         # Multi-container orchestration
├── Dockerfile                 # FastAPI container image
├── requirements.txt           # Python dependencies
├── requirements.in            # Pip-tools input
├── .env                       # Environment variables (git ignored)
├── .env.example               # Environment template
└── README.md                  # This file
```

### About frontend/dist/

The `frontend/dist/` directory is **generated automatically** when you run `npm run build`. It contains the compiled and optimized React application ready for production:

```bash
cd frontend
npm run build  # Generates frontend/dist/
```

This directory contains:
- `index.html` - Main HTML file
- `assets/` - Minified JavaScript, CSS, and other assets
- Static files optimized for deployment

In Docker setup, nginx serves files from this directory as static content.

## Manual Installation

1. Create Python environment:
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install pip-tools
pip-sync
```

2. Setup frontend:
```bash
cd frontend
npm install
```

3. Create `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_agent_job_db
DB_USER=postgres
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
SESSION_EXPIRE_SECONDS=86400
```

4. Start services:
```bash
# Terminal 1: Backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Redis
redis-server

# Terminal 4: Ollama (LLM)
ollama serve
```

Access: http://localhost:5173 (frontend) and http://localhost:8000 (API)

## Docker Installation

1. Build frontend:
```bash
cd frontend
npm install
npm run build
cd ..
```

2. Setup SSL certificates:
```bash
mkdir -p nginx/certs
openssl req -x509 -newkey rsa:4096 -nodes \
  -out nginx/certs/server.crt \
  -keyout nginx/certs/server.key \
  -days 365 -subj "/CN=localhost"
```

3. Create `.env` file (see above)

4. Start services:
```bash
docker-compose up -d
docker-compose logs -f
```

Access: https://localhost

## How It Works

### RAG Pipeline (Retrieval-Augmented Generation)

The system uses a **semantic search + market context** RAG approach:

**Stage 1: Retrieval (Semantic Search)**
- CV text and skills are converted to embeddings using `sentence-transformers/all-MiniLM-L6-v2`
- Query the ChromaDB vector database for 100 semantically similar jobs
- Rank results by: skill overlap (50%), job function (15%), job type (10%), location (15%), remote option (5%)
- Keep top 5-10 jobs as "market context"

**Stage 2: Context Building**
- Format retrieved jobs as structured market context (role, company, location, skills, salary)
- This context is truncated to 2000 tokens to fit within LLM input limits
- Market context grounds the LLM in realistic job market data

**Stage 3: Generation (LLM Analysis)**
- Send to Ollama (Llama3.2:3b):
  - CV text
  - Job details
  - Market context (similar jobs)
  - User query/task
- LLM generates JSON response constrained by system rules
- Always responds strictly to job analysis domain (no hallucinations)

**Detailed Workflow:**

1. **CV Upload** → Extract text and technical skills
2. **Job Search** → Semantic search retrieves 100 similar jobs
3. **Ranking** → Custom scoring (skills, function, type, location, remote)
4. **Market Context** → Top 5 jobs formatted as context
5. **LLM Call** → Send CV + Job + Market Context to Ollama
6. **Structured Output** → LLM returns JSON with analysis

**Why This RAG?**
- **Grounding**: Market context prevents LLM hallucinations about job requirements
- **Accuracy**: LLM answers based on actual job market data, not just training
- **Speed**: Quick semantic search (vector similarity) + specific LLM reasoning
- **Control**: System rules enforce job-analysis-only mode

**LLM Features Using RAG:**
- Match CV to job → scored fit with missing skills
- Extract CV profile → structured work experience and skills
- Job question answering → contextual answers using market data
- Interview generation → questions tailored to similar roles
- Interview grading → evaluation benchmarked against typical requirements
- Cover letter → customized to job and market expectations

---

### Technical Details

```
Client → nginx (:443)
    ├→ / → frontend (static files)
    ├→ /api/* → FastAPI (3 instances, load balanced)
    └→ /ws → WebSocket
```

## Key Technologies

- Backend: FastAPI, SQLAlchemy, PostgreSQL
- Frontend: React, Vite
- Cache: Redis
- Vector DB: ChromaDB
- LLM: Ollama Llama3.2
- Embeddings: sentence-transformers
- Reverse Proxy: nginx (3 FastAPI instances)

## Configuration Notes

- Frontend built to `frontend/dist/`, served via nginx as static files
- API requests proxied from `/api/*` to FastAPI backend
- Load balancing uses least connections method
- SSL enabled with TLS 1.2+
- Gzip compression enabled

## Scaling

Add more FastAPI instances:

1. In `docker-compose.yml`: Add `fastapi4`, `fastapi5`, etc.
2. In `nginx/nginx.conf`: Add instances to upstream block

```nginx
upstream fastapi_backend {
    least_conn;
    server fastapi1:8001;
    server fastapi2:8002;
    server fastapi3:8003;
    server fastapi4:8004;
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Frontend not loading | Run `npm run build` in frontend/ |
| 502 Bad Gateway | Check FastAPI running: `docker-compose logs fastapi1` |
| Port in use | `docker-compose down -v` |
| SSL cert error | Regenerate: `rm nginx/certs/*` and rerun openssl command |
| DB connection error | Verify PostgreSQL running and .env is correct |

## Health Check

```bash
curl -k https://localhost/health    # Docker
curl http://localhost:8000/health   # Local
```

## Production

Use Let's Encrypt for SSL:
```bash
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/{fullchain,privkey}.pem \
   nginx/certs/{server.crt,server.key}
```

Update domain in `nginx/nginx.conf` and set strong passwords in `.env`.
