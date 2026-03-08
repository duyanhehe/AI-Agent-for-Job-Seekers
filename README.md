uvicorn app.main:app --reload

python -m venv .venv
source venv/bin/activate
pip install pip-tools
pip-sync
