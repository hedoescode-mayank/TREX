import io
from pypdf import PdfReader
import re

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF bytes using pypdf"""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {str(e)}")

def normalize_text(text: str) -> str:
    """Enhanced text cleanup for professional resume parsing."""
    # 1. Normalize line endings and whitespace
    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    
    # 2. Fix broken line joins (e.g. "Soft-\nware" -> "Software")
    text = re.sub(r'(\w+)-\n\s*(\w+)', r'\1\2', text)
    
    # 3. Normalize bullet points
    text = re.sub(r'^[ \t]*[•●○▪■-][ \t]*', '- ', text, flags=re.MULTILINE)
    
    # 4. Remove excessive empty lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()

def extract_entities(text: str) -> dict:
    """Extract basic entities from resume text using robust regex."""
    entities = {
        "email": None,
        "phone": None,
        "links": [],
        "name_candidate": None
    }
    
    # Email
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        entities["email"] = email_match.group(0)
        
    # Phone (handles various formats)
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    if phone_match:
        entities["phone"] = phone_match.group(0)
        
    # Links (LinkedIn, GitHub, Portfolios)
    links = re.findall(r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)', text)
    entities["links"] = list(set(links))
    
    # Name Heuristic: Often the first line or near the top
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    if lines:
        # Simple heuristic: First non-empty line that isn't just a label
        for line in lines[:3]:
            if len(line.split()) >= 2 and not any(kw in line.lower() for kw in ["resume", "curriculum", "contact", "email"]):
                entities["name_candidate"] = line
                break
                
    return entities
