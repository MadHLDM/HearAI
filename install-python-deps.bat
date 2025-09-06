@echo off
echo Installing Python dependencies for AI Transcription...
echo.

echo Installing basic requirements...
pip install requests

echo.
echo Installing PyTorch (CPU version)...
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

echo.
echo Installing OpenAI Whisper...
pip install openai-whisper

echo.
echo Installing LibreTranslate (optional)...
pip install libretranslate

echo.
echo Installation complete!
echo.
echo To test installation, run:
echo python python/transcribe.py --help
echo.
pause