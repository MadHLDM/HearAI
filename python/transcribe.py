#!/usr/bin/env python3
"""
Whisper-based audio transcription script for the Electron app
"""

import sys
import os
import tempfile
import argparse
import json
from pathlib import Path

def install_requirements():
    """Check if required packages are available"""
    try:
        import whisper
        return True
    except ImportError:
        print("OpenAI Whisper not found. Please install it:", file=sys.stderr)
        print("Run: pip install openai-whisper", file=sys.stderr)
        print("Or use the install-python-deps.bat file", file=sys.stderr)
        return False

def transcribe_audio(audio_file_path, model_name="base", language=None):
    """
    Transcribe audio file using OpenAI Whisper
    
    Args:
        audio_file_path (str): Path to the audio file
        model_name (str): Whisper model to use ('tiny', 'base', 'small', 'medium', 'large')
        language (str): Language code (optional, auto-detect if None)
    
    Returns:
        dict: Transcription result
    """
    try:
        print(f"Starting transcription with model: {model_name}", file=sys.stderr)
        import whisper
        
        # Load the model
        print(f"Loading Whisper model: {model_name}", file=sys.stderr)
        model = whisper.load_model(model_name)
        
        # Transcribe
        options = {}
        if language:
            options['language'] = language
        
        print(f"Transcribing file: {audio_file_path}", file=sys.stderr)
        result = model.transcribe(audio_file_path, **options)
        print(f"Transcription completed. Text length: {len(result['text'])}", file=sys.stderr)
        
        return {
            'success': True,
            'text': result['text'].strip(),
            'language': result.get('language', 'unknown'),
            'segments': [
                {
                    'start': seg['start'],
                    'end': seg['end'],
                    'text': seg['text'].strip()
                }
                for seg in result.get('segments', [])
            ]
        }
        
    except Exception as e:
        print(f"Transcription error: {e}", file=sys.stderr)
        return {
            'success': False,
            'error': str(e),
            'text': '',
            'language': 'unknown',
            'segments': []
        }

def convert_webm_to_wav(webm_data, output_path):
    """
    Convert WebM audio data to WAV format for Whisper
    
    Args:
        webm_data (bytes): Raw WebM audio data
        output_path (str): Output WAV file path
    
    Returns:
        bool: Success status
    """
    try:
        import subprocess
        
        # Write WebM data to temporary file
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp_webm:
            tmp_webm.write(webm_data)
            tmp_webm_path = tmp_webm.name
        
        try:
            # Check if FFmpeg is available
            result = subprocess.run(['ffmpeg', '-version'], 
                                  capture_output=True, text=True)
            
            # Convert WebM to WAV using FFmpeg
            cmd = [
                'ffmpeg', '-i', tmp_webm_path,
                '-vn',  # No video
                '-acodec', 'pcm_s16le',  # 16-bit PCM
                '-ar', '16000',  # 16kHz sample rate
                '-ac', '1',  # Mono
                '-y',  # Overwrite output
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return True
            
        except (subprocess.CalledProcessError, FileNotFoundError):
            # FFmpeg not available, try alternative approach
            print("FFmpeg not found, trying alternative conversion...", file=sys.stderr)
            
            # For now, just copy the file and let Whisper handle it
            # Whisper can handle various formats including WebM
            import shutil
            shutil.copy2(tmp_webm_path, output_path)
            return True
            
        finally:
            # Cleanup temporary WebM file
            try:
                os.unlink(tmp_webm_path)
            except:
                pass
                
    except Exception as e:
        print(f"Conversion error: {e}", file=sys.stderr)
        return False

def main():
    parser = argparse.ArgumentParser(description='Transcribe audio using OpenAI Whisper')
    parser.add_argument('--input', '-i', help='Input audio file path')
    parser.add_argument('--model', '-m', default='base', 
                       choices=['tiny', 'base', 'small', 'medium', 'large'],
                       help='Whisper model size')
    parser.add_argument('--language', '-l', help='Language code (optional)')
    parser.add_argument('--stdin', action='store_true', 
                       help='Read audio data from stdin')
    
    args = parser.parse_args()
    
    # Validate arguments
    if not args.stdin and not args.input:
        parser.error('Either --input or --stdin must be specified')
    
    try:
        # Check and install requirements
        if not install_requirements():
            result = {
                'success': False,
                'error': 'Failed to install required packages',
                'text': '',
                'language': 'unknown'
            }
            print(json.dumps(result))
            return 1
        
        if args.stdin:
            # Read binary data from stdin
            audio_data = sys.stdin.buffer.read()
            
            # Create temporary file for processing
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                temp_path = tmp_file.name
            
            try:
                # Convert WebM data to WAV
                if not convert_webm_to_wav(audio_data, temp_path):
                    raise Exception("Failed to convert audio format")
                
                # Transcribe
                result = transcribe_audio(temp_path, args.model, args.language)
                
            finally:
                # Cleanup
                try:
                    os.unlink(temp_path)
                except:
                    pass
                    
        else:
            # Process file directly
            if not os.path.exists(args.input):
                result = {
                    'success': False,
                    'error': f'Input file not found: {args.input}',
                    'text': '',
                    'language': 'unknown'
                }
            else:
                result = transcribe_audio(args.input, args.model, args.language)
        
        # Output result as JSON to stdout, ensuring it's the only thing there
        print(json.dumps(result, ensure_ascii=False, indent=2), flush=True)
        
        # Return 0 if transcription was successful, 1 only if it truly failed
        if result.get('success', False):
            return 0
        else:
            return 1
        
    except Exception as e:
        result = {
            'success': False,
            'error': str(e),
            'text': '',
            'language': 'unknown'
        }
        print(json.dumps(result))
        return 1

if __name__ == '__main__':
    sys.exit(main())