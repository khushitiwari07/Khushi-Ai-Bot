from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from backend.app.utils.file_handler import save_upload_file, delete_file
from backend.app.services.transcriber import transcriber
from backend.app.services.summarizer import summarize_transcript

app = FastAPI(title="Khushi AI - Meeting Summarizer")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/process-audio")
async def process_audio(file: UploadFile = File(...), target_language: str = Form("English")):
    """
    Endpoint to receive an audio/video file, transcribe it, and summarize it.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    # Only allow certain extensions
    allowed_extensions = [".mp3", ".wav", ".m4a", ".mp4", ".webm", ".ogg"]
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")

    file_path = None
    try:
        # 1. Save the file temporarily
        file_path = await save_upload_file(file)

        # 2. Transcribe using Faster-Whisper
        transcript = transcriber.transcribe(file_path)
        
        if not transcript:
            raise HTTPException(status_code=400, detail="Transcription resulted in empty text.")

        # 3. Summarize and Translate using Gemini
        summary_result = summarize_transcript(transcript, target_language)

        # 4. Return the combined result
        return {
            "transcript": summary_result.translated_transcript,
            "executive_summary": summary_result.executive_summary,
            "key_topics": summary_result.key_topics,
            "action_items": [item.model_dump() for item in summary_result.action_items]
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Clean up temporary file
        if file_path:
            delete_file(file_path)

# Serve the frontend statically
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
