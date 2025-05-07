#!/bin/bash

# Exit on any errors
set -e

echo "===== Fly.io Interview POC Deployment Script ====="
echo "This script will deploy the interview POC to Fly.io as an isolated app."

# Check for flyctl
if ! command -v flyctl &> /dev/null; then
    echo "Error: flyctl is not installed."
    echo "Please install it using: brew install flyctl"
    echo "Or: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file is missing."
    echo "Please create it with the required environment variables."
    exit 1
fi

# Check if OPENAI_API_KEY is set
if ! grep -q "OPENAI_API_KEY=" .env || grep -q "OPENAI_API_KEY=your_openai_api_key_here" .env; then
    echo "Error: OPENAI_API_KEY is not set in .env."
    echo "Please update your .env file with a valid OPENAI_API_KEY."
    exit 1
fi

# Extract OpenAI API key
OPENAI_API_KEY=$(grep "OPENAI_API_KEY" .env | cut -d= -f2)

# Check login status
echo "Checking Fly.io authentication status..."
if ! flyctl auth whoami &> /dev/null; then
    echo "You are not logged in to Fly.io."
    echo "Please run 'flyctl auth login' first."
    exit 1
fi

echo "Authentication verified. You are logged in to Fly.io."

# Create a new Fly.io app (if not already created)
echo "Creating a new Fly.io app called interview-poc-isolated-test..."
if ! flyctl apps list | grep -q "interview-poc-isolated-test"; then
    flyctl launch --name interview-poc-isolated-test --no-deploy --region ord
else
    echo "App 'interview-poc-isolated-test' already exists."
fi

# Set secrets
echo "Setting required secrets..."
flyctl secrets set OPENAI_API_KEY="$OPENAI_API_KEY" ISOLATED_TEST_MODE=true --app interview-poc-isolated-test

# Deploy the app
echo "Deploying the app to Fly.io..."
flyctl deploy --app interview-poc-isolated-test

echo ""
echo "===== Deployment Complete ====="
echo "Your app should now be available at: https://interview-poc-isolated-test.fly.dev"
echo "To check logs: flyctl logs --app interview-poc-isolated-test"
echo "To monitor: flyctl status --app interview-poc-isolated-test"
echo ""
echo "Remember: This is an isolated test instance. It won't affect your main application."
