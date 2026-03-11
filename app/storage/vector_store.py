import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore


class VectorStore:
    def __init__(self, persist_dir: str):
        self.client = chromadb.PersistentClient(path=persist_dir)

        self.jobs_collection = self.client.get_or_create_collection(name="jobs_data")

        self.cv_collection = self.client.get_or_create_collection(name="cv_data")

        self.jobs_vector_store = ChromaVectorStore(
            chroma_collection=self.jobs_collection
        )

        self.cv_vector_store = ChromaVectorStore(chroma_collection=self.cv_collection)
