console.log('=== NEW RENDERER.JS STARTING ===');

// Get electronAPI from window using a different variable name to avoid conflicts
let electronBridge;
try {
    electronBridge = window.electronAPI;
    console.log('electronBridge loaded:', !!electronBridge);
} catch (error) {
    console.error('Error loading electronBridge:', error);
}

// State variables
let isRecording = false;

// DOM elements (will be assigned when ready)
let recordBtn, recordingIndicator, recordingStatus, transcriptionOutput, translationOutput;
let targetLanguage, statusMessage, progressBar, copyTranscription, copyTranslation;
let settingsBtn, pulse, testBtn;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, initializing...');
    
    // Get DOM elements
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
    
    console.log('Elements found:');
    console.log('recordBtn:', !!recordBtn);
    console.log('settingsBtn:', !!settingsBtn);
    
    if (!recordBtn) {
        console.error('Record button not found!');
        return;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI
    updateUI();
    updateStatus('Ready to record - click Start Recording or press Ctrl+F9');
});

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    
    // Record button
    if (recordBtn) {
        recordBtn.onclick = function() {
            console.log('Record button clicked');
            toggleRecording();
        };
    }
    
    // Settings button
    if (settingsBtn) {
        settingsBtn.onclick = function() {
            console.log('Settings button clicked');
            openSettings();
        };
    }
    
    // Copy button
    if (copyTranscription) {
        copyTranscription.onclick = function() {
            console.log('Copy transcription clicked!');
            copyToClipboard(transcriptionOutput ? transcriptionOutput.textContent : '');
        };
    }
}

function toggleRecording() {
    console.log('toggleRecording called, isRecording:', isRecording);
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    try {
        console.log('Starting audio recording...');
        updateStatus('Starting audio recording...');
        
        let stream;
        let recordingMethod = 'unknown';
        
        // First try: Modern getDisplayMedia with main process brokered access
        try {
            console.log('Attempting modern getDisplayMedia for desktop audio...');
            
            // Use the modern getDisplayMedia API - main process handles the request via setDisplayMediaRequestHandler
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: 1,
                    height: 1
                },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            
            console.log('Display media stream acquired');
            
            // Extract audio tracks from the display capture
            const audioTracks = stream.getAudioTracks();
            const videoTracks = stream.getVideoTracks();
            
            console.log('Audio tracks:', audioTracks.length);
            console.log('Video tracks:', videoTracks.length);
            
            if (audioTracks.length > 0) {
                // Stop video tracks to save resources - we only want audio
                videoTracks.forEach(track => track.stop());
                
                // Create new stream with only audio
                stream = new MediaStream(audioTracks);
                recordingMethod = 'display-audio';
                console.log('Desktop audio capture successful via getDisplayMedia');
            } else {
                throw new Error('No audio track found in display media stream');
            }
            
        } catch (displayError) {
            console.log('getDisplayMedia failed, trying fallback:', displayError.message);
            
            // Second try: Enhanced audio constraints for system audio
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        sampleRate: 44100,
                        channelCount: 2
                    },
                    video: false
                });
                recordingMethod = 'system-audio';
                console.log('System audio capture successful');
                
            } catch (systemError) {
                console.log('System audio failed, falling back to microphone:', systemError.message);
                
                // Final fallback: Regular microphone
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                });
                recordingMethod = 'microphone';
                console.log('Microphone capture successful');
            }
        }
        
        // Setup MediaRecorder for recording
        window.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
        });
        
        window.audioChunks = [];
        
        // Add audio level monitoring
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Monitor audio levels
        const checkAudioLevel = () => {
            if (isRecording) {
                analyser.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                const average = sum / bufferLength;
                console.log('Audio level:', average.toFixed(2));
                setTimeout(checkAudioLevel, 1000);
            }
        };
        checkAudioLevel();
        
        window.mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                window.audioChunks.push(event.data);
                console.log('Audio chunk received, size:', event.data.size);
            }
        };
        
        window.mediaRecorder.onstop = function() {
            console.log('MediaRecorder stopped, processing audio...');
            processRecordedAudio();
        };
        
        // Start recording
        window.mediaRecorder.start();
        isRecording = true;
        
        // Update UI based on recording method
        const methodText = {
            'display-audio': 'Recording desktop audio via getDisplayMedia',
            'system-audio': 'Recording system audio', 
            'microphone': 'Recording microphone (enable Stereo Mix for desktop audio)'
        };
        
        updateStatus(methodText[recordingMethod] || 'Recording audio');
        updateUI();
        
        // Start a timer to show recording duration
        let recordingTime = 0;
        const recordingTimer = setInterval(function() {
            recordingTime++;
            updateStatus(`${methodText[recordingMethod]}... ${recordingTime}s (Press Ctrl+F9 or click Stop)`);
        }, 1000);
        
        // Store timer reference for cleanup
        window.recordingTimer = recordingTimer;
        
    } catch (error) {
        console.error('Error starting recording:', error);
        updateStatus(`Error: ${error.message}`);
        isRecording = false;
        updateUI();
    }
}

async function stopRecording() {
    console.log('Stopping desktop audio recording...');
    
    // Clear the recording timer
    if (window.recordingTimer) {
        clearInterval(window.recordingTimer);
        window.recordingTimer = null;
    }
    
    isRecording = false;
    updateStatus('Stopping recording and processing...');
    updateUI();
    
    // Stop the MediaRecorder
    if (window.mediaRecorder && window.mediaRecorder.state !== 'inactive') {
        window.mediaRecorder.stop();
        
        // Stop all tracks in the stream
        if (window.mediaRecorder.stream) {
            window.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    } else {
        // If MediaRecorder is not available, process immediately
        processRecordedAudio();
    }
}

async function processRecordedAudio() {
    try {
        if (!window.audioChunks || window.audioChunks.length === 0) {
            updateStatus('No audio recorded');
            return;
        }
        
        updateStatus('Processing audio with AI...');
        showProgress(30);
        
        // Convert recorded chunks to blob
        const audioBlob = new Blob(window.audioChunks, { type: 'audio/webm' });
        console.log('Audio blob size:', audioBlob.size);
        
        if (audioBlob.size === 0) {
            updateStatus('No audio captured');
            return;
        }
        
        // Convert blob to array buffer for transcription
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioData = new Uint8Array(arrayBuffer);
        
        showProgress(50);
        
        // Send to main process for transcription
        const transcription = await electronBridge.transcribeAudio(audioData);
        
        if (transcription && transcription.trim()) {
            if (transcriptionOutput) {
                transcriptionOutput.textContent = transcription;
            }
            showProgress(100);
            updateStatus('Transcription complete! Ready for next recording');
            
            // Clear progress after a delay
            setTimeout(function() {
                showProgress(0);
                updateStatus('Ready');
            }, 3000);
        } else {
            updateStatus('No speech detected in recording');
        }
        
        // Clean up
        window.audioChunks = [];
        
    } catch (error) {
        console.error('Error processing audio:', error);
        updateStatus(`Error: ${error.message}`);
        showProgress(0);
    }
}


function showProgress(percent) {
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
}

function updateUI() {
    if (!recordBtn) return;
    
    if (isRecording) {
        recordBtn.innerHTML = '<span>⏹️</span> Stop Recording';
        recordBtn.style.background = 'linear-gradient(135deg, #f56565, #e53e3e)';
        if (recordingStatus) recordingStatus.textContent = 'Recording...';
        if (pulse) pulse.classList.add('recording');
    } else {
        recordBtn.innerHTML = '<span>🎙️</span> Start Recording';
        recordBtn.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
        if (recordingStatus) recordingStatus.textContent = 'Ready to Record';
        if (pulse) pulse.classList.remove('recording');
    }
}

function updateStatus(message) {
    if (statusMessage) {
        statusMessage.textContent = message;
    }
    console.log('Status:', message);
}

function copyToClipboard(text) {
    if (!text || text.trim() === '') {
        updateStatus('Nothing to copy');
        return;
    }
    
    navigator.clipboard.writeText(text).then(function() {
        updateStatus('Copied to clipboard!');
        setTimeout(function() { updateStatus('Ready'); }, 2000);
    }).catch(function(err) {
        console.error('Copy failed:', err);
        updateStatus('Copy failed');
    });
}

function openSettings() {
    if (electronBridge && electronBridge.openSettings) {
        electronBridge.openSettings().catch(function(error) {
            console.error('Error opening settings:', error);
            updateStatus('Failed to open settings');
        });
    } else {
        alert('Settings functionality not available (electronBridge missing)');
    }
}

console.log('=== NEW RENDERER.JS LOADED ===');