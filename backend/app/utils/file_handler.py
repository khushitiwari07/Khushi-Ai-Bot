import os
import aiofiles
from fastapi import UploadFile
import uuid

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Saves an uploaded file to the local disk asynchronously.
    Returns the absolute path to the saved file.
    """
    try:
        # Generate a unique filename to prevent collisions
        file_extension = os.path.splitext(upload_file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await upload_file.read()
            await out_file.write(content)

        return file_path
    except Exception as e:
        raise Exception(f"Failed to save file: {e}")

def delete_file(file_path: str):
    """
    Deletes a file from the local disk.
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error deleting file {file_path}: {e}")
