const Store = require('electron-store');

class Settings {
    constructor() {
        this.store = new Store({
            defaults: {
                // Audio settings
                audioDevice: 'default',
                audioQuality: 'base', // tiny, base, small, medium, large
                audioFormat: 'wav',
                maxRecordingTime: 300, // seconds
                
                // Translation settings
                defaultTargetLanguage: 'en',
                translationService: 'libretranslate',
                libretranslateUrl: 'http://localhost:5000',
                googleTranslateApiKey: '',
                
                // UI settings
                theme: 'light',
                windowPosition: { x: 100, y: 100 },
                windowSize: { width: 800, height: 600 },
                
                // Behavior settings
                autoTranslate: true,
                showNotifications: true,
                startWithSystem: false,
                minimizeToTray: false,
                
                // Hotkeys
                recordingHotkey: 'CommandOrControl+F9',
                
                // Advanced settings
                whisperModel: 'base',
                enableGpu: false,
                audioThreshold: 0.01
            }
        });
    }
    
    // General getters and setters
    get(key) {
        return this.store.get(key);
    }
    
    set(key, value) {
        this.store.set(key, value);
    }
    
    getAll() {
        return this.store.store;
    }
    
    reset() {
        this.store.clear();
    }
    
    // Audio settings
    getAudioSettings() {
        return {
            device: this.get('audioDevice'),
            quality: this.get('audioQuality'),
            format: this.get('audioFormat'),
            maxTime: this.get('maxRecordingTime'),
            whisperModel: this.get('whisperModel'),
            enableGpu: this.get('enableGpu'),
            threshold: this.get('audioThreshold')
        };
    }
    
    setAudioSettings(settings) {
        if (settings.device) this.set('audioDevice', settings.device);
        if (settings.quality) this.set('audioQuality', settings.quality);
        if (settings.format) this.set('audioFormat', settings.format);
        if (settings.maxTime) this.set('maxRecordingTime', settings.maxTime);
        if (settings.whisperModel) this.set('whisperModel', settings.whisperModel);
        if (settings.enableGpu !== undefined) this.set('enableGpu', settings.enableGpu);
        if (settings.threshold) this.set('audioThreshold', settings.threshold);
    }
    
    // Translation settings
    getTranslationSettings() {
        return {
            defaultLanguage: this.get('defaultTargetLanguage'),
            service: this.get('translationService'),
            libretranslateUrl: this.get('libretranslateUrl'),
            googleApiKey: this.get('googleTranslateApiKey'),
            autoTranslate: this.get('autoTranslate')
        };
    }
    
    setTranslationSettings(settings) {
        if (settings.defaultLanguage) this.set('defaultTargetLanguage', settings.defaultLanguage);
        if (settings.service) this.set('translationService', settings.service);
        if (settings.libretranslateUrl) this.set('libretranslateUrl', settings.libretranslateUrl);
        if (settings.googleApiKey) this.set('googleTranslateApiKey', settings.googleApiKey);
        if (settings.autoTranslate !== undefined) this.set('autoTranslate', settings.autoTranslate);
    }
    
    // UI settings
    getUISettings() {
        return {
            theme: this.get('theme'),
            position: this.get('windowPosition'),
            size: this.get('windowSize'),
            notifications: this.get('showNotifications'),
            minimizeToTray: this.get('minimizeToTray')
        };
    }
    
    setUISettings(settings) {
        if (settings.theme) this.set('theme', settings.theme);
        if (settings.position) this.set('windowPosition', settings.position);
        if (settings.size) this.set('windowSize', settings.size);
        if (settings.notifications !== undefined) this.set('showNotifications', settings.notifications);
        if (settings.minimizeToTray !== undefined) this.set('minimizeToTray', settings.minimizeToTray);
    }
    
    // System settings
    getSystemSettings() {
        return {
            startWithSystem: this.get('startWithSystem'),
            hotkey: this.get('recordingHotkey')
        };
    }
    
    setSystemSettings(settings) {
        if (settings.startWithSystem !== undefined) this.set('startWithSystem', settings.startWithSystem);
        if (settings.hotkey) this.set('recordingHotkey', settings.hotkey);
    }
    
    // Export/Import
    exportSettings() {
        return JSON.stringify(this.getAll(), null, 2);
    }
    
    importSettings(jsonString) {
        try {
            const settings = JSON.parse(jsonString);
            Object.keys(settings).forEach(key => {
                this.set(key, settings[key]);
            });
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}

module.exports = Settings;
