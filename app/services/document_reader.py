from unstructured.partition.pdf import partition_pdf
from unstructured.partition.docx import partition_docx


class DocumentReader:
    def readPDF(self, file_path: str) -> str:
        elements = partition_pdf(file_path)
        return self._extractText(elements)

    def readDocx(self, file_path: str) -> str:
        elements = partition_docx(file_path)
        return self._extractText(elements)

    def _extractText(self, elements) -> str:
        return "\n".join(el.text for el in elements if el.text)
