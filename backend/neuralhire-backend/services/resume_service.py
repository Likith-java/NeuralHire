import fitz
from loguru import logger

TECH_KEYWORDS = [
    "Python", "FastAPI", "React", "SQL", "REST", "Docker",
    "AWS", "Redis", "Node.js", "TypeScript", "MongoDB",
    "PostgreSQL", "Kubernetes", "CI/CD", "Git", "Linux",
    "Flask", "Django", "Vue", "Angular", "Spring", "Java",
    "C++", "Go", "Rust", "GraphQL", "gRPC", "Kafka",
    "TensorFlow", "PyTorch", "Machine Learning", "AI",
    "Azure", "GCP", "Microservices", "DevOps", "Agile"
]


def parse_resume(pdf_bytes: bytes) -> dict:
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = " ".join([page.get_text() for page in doc])
        doc.close()
        
        found = [k for k in TECH_KEYWORDS if k.lower() in text.lower()]
        
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        name = None
        for line in lines[:5]:
            words = line.split()
            if 2 <= len(words) <= 4 and all(w[0].isupper() for w in words if w.isalpha()):
                name = line
                break
        
        logger.info(f"Resume parsed: {len(found)} skills found")
        return {
            "skills": found,
            "name": name,
            "raw_text_preview": text[:500]
        }
    except Exception as e:
        logger.error(f"Resume parsing failed: {e}")
        return {"skills": [], "name": None, "raw_text_preview": ""}
