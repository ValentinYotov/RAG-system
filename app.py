import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Pizza Review Assistant")
app.mount("/static", StaticFiles(directory="static"), name="static")


class ChatRequest(BaseModel):
    message: str


@app.get("/")
async def index():
    return FileResponse("static/index.html")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat(request: ChatRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        from rag import ask

        return await asyncio.to_thread(ask, message)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Could not generate an answer. Make sure Ollama is running "
                f"with llama3.2 and mxbai-embed-large. ({exc})"
            ),
        ) from exc
