# Khushi AI

Khushi AI is a full-stack, production-ready web application for AI-Based Meeting Transcription, Summarization, & Action Item Extraction. It uses **Faster-Whisper** for GPU-accelerated transcription and the **Google Gemini API** for intelligent summarization.

## Features

- **Audio/Video Uploads:** Drag and drop meeting files.
- **Live Recording:** Record your voice directly from the browser.
- **GPU Transcription:** Uses `faster-whisper` for blazingly fast transcription (auto-detects CUDA).
- **Gemini AI Summarization:** Generates an Executive Summary, Key Topics, and structured Action Items.
- **Modern UI:** Built with HTML, Tailwind CSS, and vanilla JavaScript (No heavy frontend frameworks needed).
- **Exports:** Download results in TXT, Markdown, or JSON.

---

## Prerequisites

- **Python 3.10+**
- **NVIDIA GPU (Optional but highly recommended)** with CUDA installed for faster transcription.
- **Google Gemini API Key:** Get it from [Google AI Studio](https://aistudio.google.com/).

---

## How to Run in VS Code

Follow these simple steps to run the project directly from VS Code.

### 1. Open the Project
Open VS Code, go to `File > Open Folder...`, and select the `Khushi AI` folder.

### 2. Set Up the Virtual Environment
Open the VS Code Integrated Terminal (`Ctrl + ` ` or `View > Terminal`) and run:
```powershell
# Create a virtual environment
python -m venv venv

# Activate the virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
```
*(If you get a script execution error, run `Set-ExecutionPolicy Unrestricted -Scope CurrentUser` as Administrator).*

### 3. Install Dependencies
With the virtual environment activated, install the required packages:
```powershell
pip install -r backend/requirements.txt
```

### 4. Configure Environment Variables
1. In the project root, copy `.env.example` to `.env`:
  ```powershell
  Copy-Item .env.example .env
  ```
2. Open the root `.env` file and paste your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 5. Start the Server
Run the application using the root launcher script:
```powershell
python run.py
```

### 6. View the Application
Once the server starts, it will say `Uvicorn running on http://0.0.0.0:8000`.
Open your browser and navigate to:
**[http://localhost:8000](http://localhost:8000)**

---

## Troubleshooting

- **CUDA / GPU Not Detected:** If transcription is slow, ensure you have PyTorch installed with CUDA support. You can reinstall PyTorch for CUDA by running: 
  `pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118` (Adjust the cu118 version based on your installed CUDA toolkit).
- **Microphone Not Working:** Your browser requires the app to be served over `localhost` or `https` for the microphone permission prompt to appear. `http://localhost:8000` is perfectly fine.
- **Upload Errors:** The app accepts MP3, WAV, M4A, MP4, and WEBM formats up to 100MB (limit can be changed in FastAPI configuration).
