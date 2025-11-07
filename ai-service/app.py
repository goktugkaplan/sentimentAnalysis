import gradio as gr
from fastapi import FastAPI, Request
from transformers import pipeline

# --- Modeller ---
pipe_tr = pipeline("sentiment-analysis", model="savasy/bert-base-turkish-sentiment-cased", top_k=None)
pipe_en = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest", top_k=None)

LABELS_TR = {"negative": "negatif", "neutral": "nötr", "positive": "pozitif"}

# --- Analiz Fonksiyonu ---
def analyze(text: str, lang: str = "tr"):
    if not text or not text.strip():
        return {"error": "Boş giriş"}, "boş", "EMPTY"

    pipe = pipe_tr if lang.lower() == "tr" else pipe_en
    results = pipe(text)

    # Eğer model [[...]] şeklinde dönerse düzleştir
    if isinstance(results[0], list):
        results = results[0]

    probs = {"negative": 0.0, "neutral": 0.0, "positive": 0.0}
    for r in results:
        label = r["label"].lower()
        if "pos" in label:
            probs["positive"] = r["score"]
        elif "neg" in label:
            probs["negative"] = r["score"]
        elif "neu" in label:
            probs["neutral"] = r["score"]

    # En yüksek skoru bul
    max_label = max(probs, key=probs.get)
    max_score = probs[max_label]
    second = sorted(probs.values(), reverse=True)[1]
    if abs(max_score - second) < 0.15:
        max_label = "neutral"

    return probs, LABELS_TR.get(max_label, max_label), f"{max_label.upper()} ({lang.upper()})"

    if not text or not text.strip():
        return {"error": "Boş giriş"}, "boş", "EMPTY"

    pipe = pipe_tr if lang.lower() == "tr" else pipe_en
    results = pipe(text)

    probs = {"negative": 0.0, "neutral": 0.0, "positive": 0.0}
    for r in results:
        label = r["label"].lower()
        if "pos" in label:
            probs["positive"] = r["score"]
        elif "neg" in label:
            probs["negative"] = r["score"]
        elif "neu" in label:
            probs["neutral"] = r["score"]

    max_label = max(probs, key=probs.get)
    max_score = probs[max_label]
    second = sorted(probs.values(), reverse=True)[1]
    if abs(max_score - second) < 0.15:
        max_label = "neutral"

    return probs, LABELS_TR.get(max_label, max_label), f"{max_label.upper()} ({lang.upper()})"

# --- Gradio + FastAPI entegrasyonu ---
app = FastAPI()

@app.post("/api/predict")
async def predict(request: Request):
    data = await request.json()
    text = data.get("text", "")
    lang = data.get("lang", "tr")
    probs, label_tr, label_en = analyze(text, lang)
    return {"probs": probs, "label_tr": label_tr, "label_en": label_en}

# --- Gradio arayüzü (isteğe bağlı) ---
iface = gr.Interface(
    fn=analyze,
    inputs=[gr.Textbox(label="Metin"), gr.Dropdown(choices=["tr", "en"], value="tr", label="Dil")],
    outputs=[
        gr.Label(label="Olasılıklar"),
        gr.Textbox(label="Tahmin (Türkçe)"),
        gr.Textbox(label="Etiket (EN + Dil)")
    ],
    title="Duygu Analizi API",
    description="POST /api/predict endpoint'i ile kullanılabilir."
)

app = gr.mount_gradio_app(app, iface, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
