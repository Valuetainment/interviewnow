#!/bin/bash

echo "🔑 Setting OpenAI API Key for Fly.io"
echo ""
echo "Please enter your OpenAI API key (it should start with 'sk-'):"
read -s OPENAI_KEY
echo ""

if [[ ! "$OPENAI_KEY" =~ ^sk- ]]; then
    echo "❌ Error: The API key should start with 'sk-'"
    exit 1
fi

echo "📤 Setting the API key on Fly.io..."
fly secrets set OPENAI_API_KEY="$OPENAI_KEY" --app interview-hybrid-template

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! The API key has been set."
    echo "⏳ The app is restarting. Wait about 30 seconds before testing."
    echo ""
    echo "📝 Next steps:"
    echo "1. Wait for the app to restart (30 seconds)"
    echo "2. Go back to your interview page"
    echo "3. Click 'Start Interview' again"
    echo "4. You should now get a direct WebRTC connection to OpenAI!"
else
    echo "❌ Failed to set the API key. Please check your Fly.io authentication."
fi 