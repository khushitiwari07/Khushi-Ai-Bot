import logging
from faster_whisper import WhisperModel
import torch

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AudioTranscriber:
    def __init__(self, model_size="base"):
        # Auto-detect device
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"
        
        logger.info(f"Initializing WhisperModel ('{model_size}') on device: {self.device} with compute type: {self.compute_type}")
        
        try:
            self.model = WhisperModel(model_size, device=self.device, compute_type=self.compute_type)
            logger.info("WhisperModel initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize WhisperModel: {e}")
            raise Exception(f"Model initialization error: {e}")

    def transcribe(self, audio_path: str) -> str:
        """
        Transcribes the given audio file and returns the full text.
        """
        logger.info(f"Starting transcription for {audio_path}")
        try:
            segments, info = self.model.transcribe(audio_path, beam_size=5)
            
            logger.info(f"Detected language '{info.language}' with probability {info.language_probability}")
            
            full_text = ""
            for segment in segments:
                # E.g., [0.00s -> 5.00s] Hello world.
                # Here we just concatenate the text for simplicity, 
                # but you could format it with timestamps if desired.
                full_text += segment.text + " "
                
            return full_text.strip()
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise Exception(f"Transcription error: {e}")

# Create a singleton instance to load the model only once at startup
# You can change model_size to 'small', 'medium', or 'large-v3' depending on VRAM
transcriber = AudioTranscriber(model_size="small")
