from google import genai
from pydantic import BaseModel, Field
from backend.app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize GenAI Client
# It will use GEMINI_API_KEY from environment/settings if set.
try:
    if settings.gemini_api_key:
        client = genai.Client(api_key=settings.gemini_api_key)
    else:
        client = genai.Client() # Assumes env var GEMINI_API_KEY is set
except Exception as e:
    logger.warning(f"Could not initialize GenAI client. Error: {e}")
    client = None

class ActionItem(BaseModel):
    task: str = Field(description="The task description")
    owner: str = Field(description="The person responsible for the task")
    priority: str = Field(description="Priority of the task, e.g., High, Medium, Low")

class MeetingSummaryResult(BaseModel):
    translated_transcript: str = Field(description="The full transcript translated into the requested target language.")
    executive_summary: list[str] = Field(description="3 to 5 bullet points summarizing the meeting in the requested target language.")
    key_topics: list[str] = Field(description="List of key discussion topics categorized in the requested target language.")
    action_items: list[ActionItem] = Field(description="List of action items extracted from the meeting in the requested target language.")

def summarize_transcript(transcript: str, target_language: str = "English") -> MeetingSummaryResult:
    """
    Calls Gemini to translate and summarize the transcript and extract action items.
    """
    if not client:
        raise Exception("Google GenAI client is not initialized. Please check GEMINI_API_KEY.")

    if not transcript or len(transcript.strip()) < 10:
        raise ValueError("Transcript is too short to summarize.")

    prompt = (
        f"You are an AI meeting assistant. Please analyze the following meeting transcript.\n"
        f"Your task is to translate and summarize the meeting into the following target language: {target_language}.\n\n"
        "Provide:\n"
        "1. A translated version of the full transcript.\n"
        "2. An executive summary (3-5 bullet points).\n"
        "3. Key discussion topics.\n"
        "4. Action items with Task, Owner, and Priority.\n\n"
        "Ensure ALL output (including the transcript, summary, topics, and action items) is strictly in the requested target language.\n\n"
        f"Original Transcript:\n{transcript}"
    )

    try:
        logger.info("Sending transcript to Gemini for summarization...")
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': MeetingSummaryResult,
            },
        )
        
        # The response is validated against the Pydantic schema
        return response.parsed
    except Exception as e:
        logger.error(f"Failed to summarize transcript: {e}")
        raise Exception(f"Summarization error: {e}")
