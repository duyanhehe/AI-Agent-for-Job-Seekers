import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore
from app.core.config import CHROMA_HOST, CHROMA_PORT


class VectorStore:
    def __init__(self, persist_dir: str):
        if CHROMA_HOST:
            # Use standalone ChromaDB service
            self.client = chromadb.HttpClient(host=CHROMA_HOST, port=int(CHROMA_PORT))
        else:
            # Fallback to local persistence (only for development/single instance)
            self.client = chromadb.PersistentClient(path=persist_dir)

        self.jobs_collection = self.client.get_or_create_collection(name="jobs_data")
        self.cv_collection = self.client.get_or_create_collection(name="cv_data")

        self.jobs_vector_store = ChromaVectorStore(chroma_collection=self.jobs_collection)
        self.cv_vector_store = ChromaVectorStore(chroma_collection=self.cv_collection)
