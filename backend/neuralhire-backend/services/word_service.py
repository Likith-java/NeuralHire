from loguru import logger

WORDS = [
    "REST", "API", "SQL", "HTML", "CSS", "HTTP", "JSON", "XML",
    "TCP", "IP", "DNS", "SSH", "AWS", "GIT", "REACT", "REDIS",
    "DOCKER", "LINUX", "NGINX", "PYTHON", "FLASK", "DJANGO",
    "FASTAPI", "NODEJS", "MONGODB", "POSTGRES", "SQLITE",
    "FIREBASE", "KUBERNETES", "ALGORITHM", "DATABASE", "FUNCTION",
    "VARIABLE", "RECURSION", "POINTER", "MEMORY", "CACHE",
    "SERVER", "CLIENT", "NETWORK", "SECURITY", "ENCRYPTION",
    "TOKEN", "SESSION", "COOKIE", "HEADER", "REQUEST", "RESPONSE",
    "ENDPOINT", "BACKEND", "FRONTEND", "FULLSTACK", "SYSTEM",
    "DESIGN", "PATTERN", "OBJECT", "CLASS", "METHOD", "INTERFACE",
    "LIBRARY", "FRAMEWORK", "RUNTIME", "COMPILE", "DEPLOY",
    "PIPELINE", "MICROSERVICE", "CONTAINER", "TESTING", "DEBUG",
    "PERFORMANCE", "SCALABLE", "OPTIMIZE", "EXPLAIN", "DESCRIBE",
    "PROBLEM", "SOLUTION", "EXAMPLE", "BECAUSE", "APPROACH",
    "IMPLEMENT", "MANAGE", "BUILD", "CREATE", "HANDLE", "REDUCE",
    "IMPROVE", "INCREASE", "YES", "NO", "AND", "BUT", "NOT",
    "WITH", "USED", "HAVE", "WORK", "GOOD", "FAST", "SLOW",
]


def get_suggestions(prefix: str) -> list:
    prefix = prefix.upper().strip()
    if not prefix:
        return []
    matches = [w for w in WORDS if w.startswith(prefix)]
    matches.sort(key=lambda w: (w != prefix, len(w)))
    return matches[:6]
