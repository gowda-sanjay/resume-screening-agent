from app.main import is_allowed_file
from app.parser import parse_document


def test_parse_document_txt():
    text = "Experienced Python developer with AI and data science skills."
    result = parse_document("resume.txt", text.encode("utf-8"))
    assert result == text


def test_parse_document_unsupported_format():
    try:
        parse_document("resume.exe", b"binary data")
        assert False, "parse_document should raise ValueError for unsupported formats"
    except ValueError as exc:
        assert "Unsupported file format" in str(exc)


def test_is_allowed_file_valid_extensions():
    assert is_allowed_file("candidate.pdf", ["pdf", "txt"]) is True
    assert is_allowed_file("jd.TXT", ["pdf", "txt"]) is True


def test_is_allowed_file_invalid_extension():
    assert is_allowed_file("photo.jpg", ["pdf", "txt"]) is False
