def score_answer(answer):
    answer_lower = answer.lower()
    words = answer_lower.split()
    word_count = len(words)

    confidence = 7
    clarity = 7
    depth = 7

    # ---------- 1. Hesitation / Weak Language ----------
    hesitation_phrases = [
        "i think", "maybe", "not sure", "kind of",
        "sort of", "i guess", "probably", "i feel"
    ]

    if any(phrase in answer_lower for phrase in hesitation_phrases):
        confidence -= 2

    # ---------- 2. Filler words ----------
    fillers = ["um", "uh", "like", "you know", "basically", "actually"]
    filler_count = sum(answer_lower.count(f) for f in fillers)

    if filler_count > 3:
        confidence -= 2
        clarity -= 1
    elif filler_count > 1:
        confidence -= 1

    # ---------- 3. Technical depth ----------
    tech_words = [
        "api", "http", "database", "algorithm", "server",
        "client", "latency", "scalability", "optimization",
        "complexity", "o(n)", "json", "rest", "microservices"
    ]

    tech_count = sum(word in answer_lower for word in tech_words)

    if tech_count >= 3:
        depth += 2
    elif tech_count >= 1:
        depth += 1

    # ---------- 4. Clarity (sentence structure) ----------
    sentences = answer.split(".")
    avg_sentence_length = word_count / max(1, len(sentences))

    if avg_sentence_length < 6:
        clarity -= 2
    elif avg_sentence_length > 15:
        clarity += 1

    # ---------- 5. Length check ----------
    if word_count < 15:
        clarity -= 2
        depth -= 1
    elif word_count > 60:
        clarity += 1
        depth += 1

    # ---------- 6. Repetition detection ----------
    unique_words = len(set(words))
    repetition_ratio = unique_words / max(1, word_count)

    if repetition_ratio < 0.5:
        clarity -= 2

    # ---------- 7. Strong structured answers ----------
    if "first" in answer_lower or "second" in answer_lower or "finally" in answer_lower:
        clarity += 1
        depth += 1

    # ---------- Clamp values ----------
    confidence = max(0, min(10, confidence))
    clarity = max(0, min(10, clarity))
    depth = max(0, min(10, depth))

    overall = (confidence + clarity + depth) / 3

    return {
        "confidence_score": confidence,
        "clarity_score": clarity,
        "depth_score": depth,
        "overall": round(overall, 2),
        "filler_count": filler_count,
        "word_count": word_count
    }
