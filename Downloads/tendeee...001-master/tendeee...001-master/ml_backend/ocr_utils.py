import pytesseract
import pdfplumber

def extract_text(filepath):
    if filepath.lower().endswith(".pdf"):
        with pdfplumber.open(filepath) as pdf:
            return "\n".join(page.extract_text() or "" for page in pdf.pages)
    else:
        return pytesseract.image_to_string(filepath)