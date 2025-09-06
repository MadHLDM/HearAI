console.log('=== RENDERER.JS STARTING ===');

// Secure electronAPI bridge from preload script
const electronAPI = window.electronAPI;

console.log('electronAPI available:', !!electronAPI);

if (!electronAPI) {
    console.error('electronAPI not available - please check preload script');
    alert('electronAPI not available!');
} else {
    console.log('electronAPI is working');
}

// DOM Elements (will be assigned when DOM is ready)
let recordBtn, recordingIndicator, recordingStatus, transcriptionOutput, translationOutput;
let targetLanguage, statusMessage, progressBar, copyTranscription, copyTranslation;
let settingsBtn, pulse;

// State
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Renderer loaded');
    
    // Assign DOM elements after DOM is ready
    recordBtn = document.getElementById('recordBtn');
    recordingIndicator = document.getElementById('recordingIndicator');
    recordingStatus = document.getElementById('recordingStatus');
    transcriptionOutput = document.getElementById('transcriptionOutput');
    translationOutput = document.getElementById('translationOutput');
    targetLanguage = document.getElementById('targetLanguage');
    statusMessage = document.getElementById('statusMessage');
    progressBar = document.querySelector('.progress-fill');
    copyTranscription = document.getElementById('copyTranscription');
    copyTranslation = document.getElementById('copyTranslation');
    settingsBtn = document.getElementById('settingsBtn');
    pulse = document.querySelector('.pulse');
    
    // Test button
    const testBtn = document.getElementById('testBtn');
    
    // Check if all elements were found
    if (!recordBtn || !electronAPI) {
        console.error('Critical DOM elements or electronAPI not found');
        if (!recordBtn) console.error('recordBtn not found');
        if (!electronAPI) console.error('electronAPI not found');
        return;
    }
    
    updateUI();
    setupEventListeners();
    checkAudioPermissions();
});

// Check if audio permissions are available
async function checkAudioPermissions() {
    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            updateStatus('Ready to record - click Start Recording or press Ctrl+Alt+R');
        } else {
            updateStatus('Warning: Audio recording may not be supported in this browser');
        }
    } catch (error) {
        console.error('Audio permission check failed:', error);
        updateStatus('Warning: Audio permissions may be required');
    }
}

// Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    recordBtn.addEventListener('click', (event) => {
        console.log('Record button clicked!');
        event.preventDefault();
        toggleRecording();
    });
    
    copyTranscription.addEventListener('click', () => {
        console.log('Copy transcription clicked!');
        copyToClipboard(transcriptionOutput.textContent);
    });
    
    copyTranslation.addEventListener('click', () => {
        console.log('Copy translation clicked!');
        copyToClipboard(translationOutput.textContent);
    });
    
    settingsBtn.addEventListener('click', (event) => {
        console.log('Settings button clicked!');
        event.preventDefault();
        openSettings();
    });
    
    // Test button event listener
    testBtn.addEventListener('click', () => {
        console.log('TEST BUTTON CLICKED! JavaScript is working!');
        alert('Test button works! JavaScript is functioning.');
    });
    
    // Listen for global shortcut events from main process
    electronAPI.onStartRecording(() => {
        if (!isRecording) {
            startRecording();
        }
    });
    
    electronAPI.onStopRecording(() => {
        if (isRecording) {
            stopRecording();
        }
    });
    
    electronAPI.onRecordingStarted(() => {
        console.log('Recording started notification received');
    });
    
    electronAPI.onRecordingStopped(() => {
        console.log('Recording stopped notification received');
    });
}

// Recording Functions
async function toggleRecording() {
    console.log('toggleRecording called, isRecording:', isRecording);
    if (!isRecording) {
        console.log('Starting recording...');
        await startRecording();
    } else {
        console.log('Stopping recording...');
        stopRecording();
    }
}

async function startRecording() {
    try {
        console.log('Starting recording...');
        updateStatus('Requesting microphone access...');
        
        // Try different audio sources
        let stream = null;
        
        // First, try to get system audio (desktop capture)
        try {
            console.log('Attempting desktop audio capture...');
            const sources = await electronAPI.getDesktopSources();
            console.log('Available sources:', sources);
            
            if (sources.length > 0) {
                const screenSource = sources[0];
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: screenSource.id
                        }
                    },
                    video: false
                });
                console.log('Got desktop audio stream:', stream);
                updateStatus('Recording desktop audio...');
            }
        } catch (desktopError) {
            console.log('Desktop audio capture failed:', desktopError.message);
        }
        
        // Fallback to microphone if desktop capture fails
        if (!stream) {
            console.log('Falling back to microphone...');
            updateStatus('Using microphone...');
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 16000,
                    channelCount: 1
                },
                video: false
            });
            console.log('Got microphone stream:', stream);
        }
        
        if (!stream) {
            throw new Error('Could not access audio - please check permissions');
        }
        
        // Setup media recorder
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorder.ondataavailable = (event) => {
            console.log('Data available:', event.data.size, 'bytes');
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            console.log('MediaRecorder stopped, processing audio...');
            await processRecording();
        };
        
        // Start recording
        mediaRecorder.start(1000); // Collect data every second
        isRecording = true;
        
        updateStatus('Recording... Press Ctrl+Alt+R or click Stop to end');
        updateUI();
        
        // Start a timer to show recording duration
        let recordingTime = 0;
        const recordingTimer = setInterval(() => {
            recordingTime++;
            updateStatus(`Recording... ${recordingTime}s (Press Ctrl+Alt+R or click Stop)`);
        }, 1000);
        
        // Store timer reference for cleanup
        mediaRecorder.recordingTimer = recordingTimer;
        
        // Notify main process
        await electronAPI.startRecording();
        
    } catch (error) {
        console.error('Error starting recording:', error);
        updateStatus(`Error: ${error.message}`);
        isRecording = false;
        updateUI();
    }
}

function stopRecording() {
    console.log('Stopping recording...');
    
    if (mediaRecorder && isRecording) {
        // Clear the recording timer
        if (mediaRecorder.recordingTimer) {
            clearInterval(mediaRecorder.recordingTimer);
            mediaRecorder.recordingTimer = null;
        }
        
        mediaRecorder.stop();
        
        // Stop all tracks
        if (mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped audio track:', track.kind);
            });
        }
    }
    
    isRecording = false;
    updateStatus('Processing recording...');
    updateUI();
    
    // Notify main process
    electronAPI.stopRecording();
}

async function processRecording() {
    try {
        console.log('Processing', audioChunks.length, 'audio chunks');
        
        if (audioChunks.length === 0) {
            throw new Error('No audio data recorded');
        }
        
        // Create blob from chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        console.log('Created audio blob:', audioBlob.size, 'bytes');
        
        // Convert to array buffer for processing
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioData = new Uint8Array(arrayBuffer);
        
        updateStatus('Transcribing audio...');
        showProgress(30);
        
        // Send to main process for transcription
        const transcription = await electronAPI.transcribeAudio(audioData);
        console.log('Transcription result:', transcription);
        
        // Display transcription
        transcriptionOutput.textContent = transcription;
        showProgress(60);
        
        // Translate if target language is selected
        const targetLang = targetLanguage.value;
        if (targetLang && targetLang !== 'none') {
            updateStatus('Translating text...');
            showProgress(80);
            
            const translation = await electronAPI.translateText(transcription, targetLang);
            console.log('Translation result:', translation);
            
            translationOutput.textContent = translation;
        } else {
            translationOutput.textContent = 'No translation requested';
        }
        
        showProgress(100);
        updateStatus('Complete! Ready for next recording');
        
        // Clear progress after a delay
        setTimeout(() => {
            showProgress(0);
            updateStatus('Ready');
        }, 3000);
        
    } catch (error) {
        console.error('Error processing recording:', error);
        updateStatus(`Processing error: ${error.message}`);
        showProgress(0);
    }
}

// UI Functions
function updateUI() {
    if (isRecording) {
        recordBtn.innerHTML = '<span>⏹️</span> Stop Recording';
        recordBtn.classList.add('recording');
        recordingStatus.textContent = 'Recording...';
        pulse.classList.add('recording');
    } else {
        recordBtn.innerHTML = '<span>🎙️</span> Start Recording';
        recordBtn.classList.remove('recording');
        recordingStatus.textContent = 'Ready to Record';
        pulse.classList.remove('recording');
    }
}

function updateStatus(message) {
    statusMessage.textContent = message;
    console.log('Status:', message);
}

function showProgress(percent) {
    progressBar.style.width = `${percent}%`;
}

function copyToClipboard(text) {
    if (!text || text.trim() === '') {
        updateStatus('Nothing to copy');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        updateStatus('Copied to clipboard!');
        setTimeout(() => updateStatus('Ready'), 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        updateStatus('Copy failed');
    });
}

// Error handling
window.addEventListener('error', (event) => {
    console.error('Renderer error:', event.error);
    updateStatus(`Error: ${event.error.message}`);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    updateStatus(`Error: ${event.reason.message || event.reason}`);
});

// Settings function
async function openSettings() {
    try {
        await electronAPI.openSettings();
    } catch (error) {
        console.error('Error opening settings:', error);
        updateStatus('Failed to open settings');
    }
}