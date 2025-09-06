# HearAI

A free, open-source desktop application that captures system audio, transcribes it using AI (OpenAI Whisper), and translates the text to your desired language using LibreTranslate.

## Features

- **Global Hotkey**: Press `Ctrl+O` to start/stop recording from anywhere
- **Desktop Audio Capture**: Records system audio (what you hear) 
- **AI Transcription**: Uses OpenAI Whisper for accurate speech-to-text
- **Free Translation**: Powered by LibreTranslate (100+ languages)
- **Privacy-First**: All processing happens locally on your machine
- **Modern UI**: Clean, intuitive interface with real-time feedback
- **Customizable**: Extensive settings for audio quality, languages, and behavior

## Quick Start

### Prerequisites

- **Node.js** 16.x or higher
- **Python** 3.8+ 
- **Windows 10/11** (primary support)

### Installation

1. **Clone or download this repository**
   ```bash
   git clone https://github.com/MadHLDM/HearAI.git
   cd HearAI
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r python/requirements.txt
   ```

4. **Start the application**
   ```bash
   npm start
   ```

### First Run Setup

1. **Install Whisper AI** (if not already installed):
   - The application will attempt to install OpenAI Whisper automatically
   - If manual installation is needed: `pip install openai-whisper`

2. **Setup Translation Service** (optional):
   - For **LibreTranslate**: `pip install libretranslate && libretranslate --host 127.0.0.1 --port 5000`
   - For **Google Translate**: Get an API key and add it in Settings

## How to Use

1. **Launch the application**
2. **Press `Ctrl+F9`** anywhere on your system to start recording
3. **Speak or play audio** - the app captures system audio (what you hear)
4. **Press `Ctrl+F9` again** to stop recording
5. **View results** in the transcription and translation panels
6. **Copy text** using the copy buttons
7. **Configure settings** via the ⚙️ Settings button

## Configuration

### Audio Settings
- **AI Model Quality**: Choose from tiny, base, small, medium, large
- **Recording Time Limit**: Set maximum recording duration
- **Audio Sensitivity**: Adjust audio detection threshold
- **GPU Acceleration**: Enable if you have CUDA-compatible GPU

### Translation Settings
- **Service**: LibreTranslate (free) or Google Translate (API key required)
- **Default Language**: Set your preferred translation target
- **Auto-translate**: Automatically translate after transcription
- **LibreTranslate URL**: Configure local or remote LibreTranslate server

### Interface Settings
- **Theme**: Light, dark, or system
- **Notifications**: Enable/disable system notifications
- **Window Behavior**: Minimize to tray options

## Development

### Project Structure
```
hearai/
├── main.js                 # Main Electron process
├── preload.js              # Secure IPC bridge
├── renderer.js             # Renderer process logic
├── index.html              # Main UI
├── styles.css              # Application styles
├── settings.js             # Settings management
├── settings-window.html    # Settings UI
├── python/
│   ├── transcribe.py       # Whisper integration
│   ├── translate.py        # Translation service
│   └── requirements.txt    # Python dependencies
├── install.bat             # Windows installer
├── assets/                 # Icons and resources
└── dist/                   # Build output
```

### Available Scripts

- `npm start` - Start the application
- `npm run dev` - Start in development mode with DevTools
- `npm run build` - Build for all platforms
- `npm run build-win` - Build for Windows only

### Building for Distribution

```bash
# Build for Windows
npm run build-win

# Build for all platforms
npm run build
```

Built applications will be in the `dist/` folder.

## Technical Details

### AI Transcription
- **Engine**: OpenAI Whisper (open source)
- **Models**: tiny, base, small, medium, large (configurable)
- **Languages**: 100+ supported languages with auto-detection
- **Quality**: High accuracy for clear audio, good performance on noisy audio

### Translation Service
- **Primary**: LibreTranslate (free, self-hosted, privacy-focused)
- **Fallback**: Google Translate API (requires API key)
- **Languages**: 100+ language pairs supported
- **Offline**: LibreTranslate can run completely offline

### Audio Processing
- **Source**: Desktop audio capture (system audio)
- **Format**: WebM/WAV conversion for Whisper compatibility
- **Quality**: 16kHz, 16-bit for optimal Whisper performance
- **Limitations**: Cannot capture audio from DRM-protected sources

## Privacy & Security

- **Local Processing**: All AI transcription happens on your machine
- **No Cloud Dependencies**: Works completely offline (except Google Translate API if used)
- **No Data Storage**: Audio and transcriptions are not permanently stored
- **Open Source**: Full source code available for security review

## Troubleshooting

### Common Issues

**"No desktop sources available"**
- Ensure you have audio playing when starting recording
- Check Windows audio permissions for the application
- Try running as administrator if needed

**"Python process failed"**
- Install Python dependencies: `pip install -r python/requirements.txt`
- Ensure Python is in your system PATH
- Check that Whisper installed correctly: `python -c "import whisper"`

**"Translation service not available"**
- For LibreTranslate: `pip install libretranslate && libretranslate --host 127.0.0.1 --port 5000`
- For Google Translate: Add your API key in Settings
- Check network connectivity for online services

**Global shortcut not working**
- Close other applications that might use Ctrl+O
- Run the application as administrator
- Try changing the hotkey in Settings (future feature)

### Performance Optimization

- **Use smaller Whisper models** (tiny/base) for faster processing
- **Enable GPU acceleration** if you have compatible hardware
- **Close unnecessary applications** during transcription for better performance
- **Adjust audio sensitivity** to reduce background noise processing
