from llama_index.core import SimpleDirectoryReader


class DocumentReader:
    def read(self, file_path: str) -> str:
        documents = SimpleDirectoryReader(input_files=[str(file_path)]).load_data()

        return "\n".join(doc.text for doc in documents if doc.text)
