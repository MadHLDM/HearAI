#!/usr/bin/env python3
"""
Translation script using LibreTranslate or Google Translate API
"""

import sys
import json
import argparse
import requests
from urllib.parse import urljoin

def install_requirements():
    """Check if required packages are available"""
    try:
        import requests
        return True
    except ImportError:
        print("Requests package not found. Please install it:", file=sys.stderr)
        print("Run: pip install requests", file=sys.stderr)
        return False

def translate_with_libretranslate(text, target_lang, source_lang='auto', api_url='http://localhost:5000'):
    """
    Translate text using LibreTranslate API
    
    Args:
        text (str): Text to translate
        target_lang (str): Target language code
        source_lang (str): Source language code (default: 'auto')
        api_url (str): LibreTranslate API URL
    
    Returns:
        dict: Translation result
    """
    try:
        url = urljoin(api_url, '/translate')
        
        data = {
            'q': text,
            'source': source_lang,
            'target': target_lang,
            'format': 'text'
        }
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, json=data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return {
                'success': True,
                'translated_text': result.get('translatedText', ''),
                'source_language': source_lang,
                'target_language': target_lang,
                'service': 'LibreTranslate'
            }
        else:
            return {
                'success': False,
                'error': f'LibreTranslate API error: {response.status_code} - {response.text}',
                'translated_text': '',
                'source_language': source_lang,
                'target_language': target_lang,
                'service': 'LibreTranslate'
            }
            
    except requests.exceptions.ConnectionError:
        return {
            'success': False,
            'error': 'LibreTranslate service not available. Please start LibreTranslate server.',
            'translated_text': '',
            'source_language': source_lang,
            'target_language': target_lang,
            'service': 'LibreTranslate'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'LibreTranslate error: {str(e)}',
            'translated_text': '',
            'source_language': source_lang,
            'target_language': target_lang,
            'service': 'LibreTranslate'
        }

def translate_with_google(text, target_lang, source_lang='auto', api_key=None):
    """
    Translate text using Google Translate API
    
    Args:
        text (str): Text to translate
        target_lang (str): Target language code
        source_lang (str): Source language code (default: 'auto')
        api_key (str): Google Translate API key
    
    Returns:
        dict: Translation result
    """
    try:
        if not api_key:
            return {
                'success': False,
                'error': 'Google Translate API key not provided',
                'translated_text': '',
                'source_language': source_lang,
                'target_language': target_lang,
                'service': 'Google Translate'
            }
        
        url = 'https://translation.googleapis.com/language/translate/v2'
        
        params = {
            'key': api_key,
            'q': text,
            'target': target_lang,
            'format': 'text'
        }
        
        if source_lang != 'auto':
            params['source'] = source_lang
        
        response = requests.post(url, params=params, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            translation = result['data']['translations'][0]
            
            return {
                'success': True,
                'translated_text': translation['translatedText'],
                'source_language': translation.get('detectedSourceLanguage', source_lang),
                'target_language': target_lang,
                'service': 'Google Translate'
            }
        else:
            return {
                'success': False,
                'error': f'Google Translate API error: {response.status_code} - {response.text}',
                'translated_text': '',
                'source_language': source_lang,
                'target_language': target_lang,
                'service': 'Google Translate'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'Google Translate error: {str(e)}',
            'translated_text': '',
            'source_language': source_lang,
            'target_language': target_lang,
            'service': 'Google Translate'
        }

def translate_text(text, target_lang, source_lang='auto', service='libretranslate', **kwargs):
    """
    Translate text using the specified service
    
    Args:
        text (str): Text to translate
        target_lang (str): Target language code
        source_lang (str): Source language code
        service (str): Translation service ('libretranslate' or 'google')
        **kwargs: Additional service-specific parameters
    
    Returns:
        dict: Translation result
    """
    if not text or not text.strip():
        return {
            'success': False,
            'error': 'No text to translate',
            'translated_text': '',
            'source_language': source_lang,
            'target_language': target_lang,
            'service': service
        }
    
    if service.lower() == 'libretranslate':
        return translate_with_libretranslate(
            text, target_lang, source_lang, 
            kwargs.get('api_url', 'http://localhost:5000')
        )
    elif service.lower() == 'google':
        return translate_with_google(
            text, target_lang, source_lang,
            kwargs.get('api_key')
        )
    else:
        return {
            'success': False,
            'error': f'Unknown translation service: {service}',
            'translated_text': '',
            'source_language': source_lang,
            'target_language': target_lang,
            'service': service
        }

def main():
    parser = argparse.ArgumentParser(description='Translate text using LibreTranslate or Google Translate')
    parser.add_argument('--text', '-t', required=True, help='Text to translate')
    parser.add_argument('--target', '-tl', required=True, help='Target language code')
    parser.add_argument('--source', '-sl', default='auto', help='Source language code (default: auto)')
    parser.add_argument('--service', '-s', default='libretranslate', 
                       choices=['libretranslate', 'google'],
                       help='Translation service to use')
    parser.add_argument('--api-key', help='API key for Google Translate')
    parser.add_argument('--api-url', default='http://localhost:5000', 
                       help='LibreTranslate API URL')
    parser.add_argument('--stdin', action='store_true', 
                       help='Read text from stdin')
    
    args = parser.parse_args()
    
    try:
        # Check and install requirements
        if not install_requirements():
            result = {
                'success': False,
                'error': 'Failed to install required packages',
                'translated_text': '',
                'source_language': args.source,
                'target_language': args.target,
                'service': args.service
            }
            print(json.dumps(result))
            return 1
        
        if args.stdin:
            text = sys.stdin.read().strip()
        else:
            text = args.text
        
        # Perform translation
        result = translate_text(
            text, args.target, args.source, args.service,
            api_key=args.api_key, api_url=args.api_url
        )
        
        # Output result as JSON
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result['success'] else 1
        
    except Exception as e:
        result = {
            'success': False,
            'error': str(e),
            'translated_text': '',
            'source_language': args.source,
            'target_language': args.target,
            'service': args.service
        }
        print(json.dumps(result))
        return 1

if __name__ == '__main__':
    sys.exit(main())