import pytest
import unittest.mock as mock
from app.services.documents.document_reader import DocumentReader


def test_document_reader_success():
    reader = DocumentReader()

    # Mock llama_index.core.SimpleDirectoryReader
    mock_doc = mock.MagicMock()
    mock_doc.text = "Hello World"

    with mock.patch(
        "app.services.documents.document_reader.SimpleDirectoryReader"
    ) as MockReader:
        MockReader.return_value.load_data.return_value = [mock_doc]

        text = reader.read("test.pdf")
        assert text == "Hello World"


def test_document_reader_empty():
    reader = DocumentReader()

    with mock.patch(
        "app.services.documents.document_reader.SimpleDirectoryReader"
    ) as MockReader:
        MockReader.return_value.load_data.return_value = []

        text = reader.read("empty.pdf")
        assert text == ""
