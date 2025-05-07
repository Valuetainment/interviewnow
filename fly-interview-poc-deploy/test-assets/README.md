# Test Assets

This directory is for test assets used in the isolated testing environment.

## Required Files for Testing

### 1. test-audio.mp3

You need to add a `test-audio.mp3` file in this directory for OpenAI Whisper API integration testing.

Requirements:
- File name: `test-audio.mp3`
- Format: MP3
- Content: A short audio clip (5-10 seconds) with clear speech
- Language: English (or your target language)
- Size: Keep under 10MB
- Quality: Clear with minimal background noise

You can create this file by:
1. Recording a short clip using your computer's microphone
2. Converting to MP3 format
3. Placing it in this directory
4. Updating the path in `test-openai-integration.js` if needed

Example test phrase: "This is a test recording for the interview transcription system."

## Running the OpenAI Integration Test

After adding the test audio file, run:

```bash
npm run test-openai
``` 