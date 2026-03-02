import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import StorageContext


class VectorStore:
    def __init__(self, persist_dir: str):
        self.client = chromadb.PersistentClient(path=persist_dir)

        self.collection = self.client.get_or_create_collection(name="cv_documents")

        self.vector_store = ChromaVectorStore(chroma_collection=self.collection)

        self.storage_context = StorageContext.from_defaults(
            vector_store=self.vector_store
        )
