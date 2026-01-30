import chromadb


class VectorStore:
    def __init__(self, persist_dir: str):
        self.client = chromadb.Client()
        self.collection = self.client.get_or_create_collection("documents")

    def storeEmbedding(self, vector, metadata):
        self.collection.add(
            embeddings=[vector], metadatas=[metadata], ids=[metadata.get("id")]
        )

    def searchSimilar(self, query_vector, k=5):
        return self.collection.query(query_embeddings=[query_vector], n_results=k)

    def persistIndex(self):
        self.client.persist()
