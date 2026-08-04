import whisper
import os

# Which Whisper model to load. Set WHISPER_MODEL in your .env (tiny/base/small/medium/large).
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "small")

# Cache the model so we only load it into memory once.
_model = None


def load_model():
    global _model
    if _model is None:
        _model = whisper.load_model(WHISPER_MODEL)
    return _model


def transcribe_chunk(chunk_path: str, translate: bool = False) -> str:
    model = load_model()

    # task="translate" makes Whisper output English regardless of the source language.
    # task="transcribe" keeps the original spoken language.
    task = "translate" if translate else "transcribe"

    result = model.transcribe(chunk_path, task=task)
    return result["text"]


def transcribe_all(chunks: list, translate: bool = False) -> str:
    full_transcription = ""

    for i, chunk in enumerate(chunks):
        print(f"Transcribing chunk {i + 1}/{len(chunks)}: {chunk}")
        transcription = transcribe_chunk(chunk, translate)
        full_transcription += transcription + "\n"

    print("Transcription complete")
    return full_transcription
