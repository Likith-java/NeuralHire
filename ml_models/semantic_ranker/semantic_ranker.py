from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')
print("Semantic ranker loaded.")

def rank_answer(ideal_answer, candidate_answer):
    ideal_embedding     = model.encode(ideal_answer,     convert_to_tensor=True)
    candidate_embedding = model.encode(candidate_answer, convert_to_tensor=True)

    score = float(util.cos_sim(ideal_embedding, candidate_embedding))
    score = round(score, 3)

    if score >= 0.8:
        label = "strong match"
    elif score >= 0.6:
        label = "good match"
    elif score >= 0.4:
        label = "partial match"
    else:
        label = "poor match"

    return {
        "semantic_score" : score,
        "label"          : label
    }

if __name__ == "__main__":
    ideal     = "Idempotency means performing the same HTTP operation multiple times produces the same result. GET and PUT are idempotent, POST is not."
    strong    = "An idempotent operation gives the same result no matter how many times you call it. GET requests are idempotent since they only read data."
    weak      = "Idempotency is something related to APIs I think. Not sure exactly how it works."

    print("Strong answer:", rank_answer(ideal, strong))
    print("Weak answer  :", rank_answer(ideal, weak))