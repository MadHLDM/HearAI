from gtts import gTTS

text = "Quanto foi gasto na educação?"
tts = gTTS(text, lang='pt-br')
tts.save("test_audio.wav")
print("Test audio 'test_audio.wav' generado com sucesso.")