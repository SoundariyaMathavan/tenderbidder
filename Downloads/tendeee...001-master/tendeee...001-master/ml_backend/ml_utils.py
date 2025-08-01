from sentence_transformers import SentenceTransformer, util
import numpy as np

model = SentenceTransformer('all-MiniLM-L6-v2')

def analyze_documents(tender_text, bidder_texts):
    tender_emb = model.encode(tender_text)
    results = {"rankings": [], "winner": None}
    for idx, text in enumerate(bidder_texts):
        emb = model.encode(text)
        semantic = float(util.cos_sim(tender_emb, emb)[0][0]) * 100
        keywords = min(len(set(tender_text.split()) & set(text.split())) / max(1, len(set(tender_text.split()))), 1) * 100
        technical = np.random.randint(10, 80)  # Placeholder for technical coverage
        quality = np.random.randint(50, 100)  # Placeholder for document quality
        score = round(semantic * 0.35 + keywords * 0.25 + technical * 0.25 + quality * 0.15, 1)
        confidence = round(np.random.uniform(60, 90), 1)
        results["rankings"].append({
            "name": f"BID{idx+1}",
            "semantic": round(semantic, 1),
            "keywords": round(keywords, 1),
            "technical": technical,
            "quality": quality,
            "score": score,
            "confidence": confidence
        })
    winner = max(results["rankings"], key=lambda x: x["score"])
    results["winner"] = winner
    return results