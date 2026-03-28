from loguru import logger


def calculate_score(events: dict) -> float:
    score = 100.0
    score -= events.get("looking_away", 0) * 2
    score -= events.get("reading_suspicion", 0) * 3
    score -= events.get("multiple_faces", 0) * 10
    score -= events.get("tab_switch", 0) * 1
    return max(0.0, score)


def get_status(score: float) -> str:
    if score >= 90:
        return "verified"
    if score >= 70:
        return "caution"
    return "review_required"


def get_badge(status: str) -> str:
    return {"verified": "green", "caution": "amber", "review_required": "red"}.get(status, "red")


def get_severity(event_type: str) -> str:
    return {
        "multiple_faces": "critical",
        "reading_suspicion": "medium",
        "looking_away": "medium",
        "tab_switch": "low"
    }.get(event_type, "low")
