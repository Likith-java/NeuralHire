def evaluate_answer(answer):
    answer = answer.lower()

    confidence = 7
    clarity = 7
    depth = 7

    # ---------- Confidence ----------
    if any(word in answer for word in ["i think", "maybe", "not sure"]):
        confidence -= 2

    # ---------- Technical Depth ----------
    tech_words = ["api", "database", "algorithm", "server", "client"]
    if any(word in answer for word in tech_words):
        depth += 2

    # ---------- Clarity ----------
    if len(answer.split()) > 10:
        clarity += 2

    # ---------- Feedback ----------
    if depth > 8:
        feedback = "Strong technical answer"
    elif confidence < 5:
        feedback = "Try to be more confident"
    else:
        feedback = "Good answer"

    return {
        "confidence": max(0, min(10, confidence)),
        "clarity": max(0, min(10, clarity)),
        "depth": max(0, min(10, depth)),
        "feedback": feedback
    }
