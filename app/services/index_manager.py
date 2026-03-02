import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import VectorStoreIndex, Settings, StorageContext
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.schema import Document
from llama_index.core.node_parser import SentenceSplitter
from app.config import CHROMA_DIR


class IndexManager:
    def __init__(self):
        Settings.embed_model = HuggingFaceEmbedding(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
        # Add Chunking
        self.splitter = SentenceSplitter(
            chunk_size=500,
            chunk_overlap=100,
        )
        self.chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        self.collection = self.chroma_client.get_or_create_collection("cv_data")
        self.vector_store = ChromaVectorStore(chroma_collection=self.collection)
        self.documents = []
        self.storage_context = StorageContext.from_defaults(
            vector_store=self.vector_store
        )
        self.index = VectorStoreIndex.from_vector_store(self.vector_store)

    def createEmbeddings(self, text: str):
        doc = Document(text=text)

        # Split into chunks
        nodes = self.splitter.get_nodes_from_documents([doc])

        self.documents.extend(nodes)

    def buildIndex(self):
        if self.documents:
            # Add new documents to persistent store
            self.index = VectorStoreIndex(
                self.documents, storage_context=self.storage_context
            )
            self.documents = []  # Clear memory after storing
        else:
            # Load existing index from persistent store
            self.index = VectorStoreIndex.from_vector_store(self.vector_store)

    def retrieveContext(self, query: str):
        if not self.index:
            return ""

        retriever = self.index.as_retriever(similarity_top_k=2)
        nodes = retriever.retrieve(query)

        context = "\n\n".join([node.node.text for node in nodes])

        # Limit context size
        return context[:3000]
