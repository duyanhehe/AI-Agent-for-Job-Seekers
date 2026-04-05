from llama_index.core import SimpleDirectoryReader


class DocumentReader:
    """Loads CV files via LlamaIndex and returns plain text."""

    def read(self, file_path: str) -> str:
        """Read a single file and concatenate document text segments."""
        documents = SimpleDirectoryReader(input_files=[str(file_path)]).load_data()

        return "\n".join(doc.text for doc in documents if doc.text)
