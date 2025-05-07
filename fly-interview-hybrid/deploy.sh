#!/bin/bash
# Deploy script for AI Interview Platform SDP Proxy

# Ensure the script stops on first error
set -e

# Check if API key is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "ERROR: OPENAI_API_KEY environment variable is required"
  echo "Please set it before running this script with:"
  echo "export OPENAI_API_KEY=your_key_here"
  exit 1
fi

# Define the app name (should match fly.toml)
APP_NAME="interview-sdp-proxy"

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
  echo "Error: fly CLI is not installed or not in PATH"
  echo "Please install it first: https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

# Check if logged in
echo "Verifying Fly.io authentication..."
fly auth whoami || {
  echo "Please log in to Fly.io first with: fly auth login"
  exit 1
}

# Check if app exists, create if not
echo "Checking if app $APP_NAME exists..."
fly apps list | grep "$APP_NAME" || {
  echo "Creating app $APP_NAME..."
  fly apps create "$APP_NAME"
}

# Set secrets
echo "Setting secrets..."
fly secrets set OPENAI_API_KEY="$OPENAI_API_KEY" -a "$APP_NAME"

# Optionally set other secrets
if [ ! -z "$LOG_LEVEL" ]; then
  fly secrets set LOG_LEVEL="$LOG_LEVEL" -a "$APP_NAME"
fi

if [ ! -z "$OPENAI_MODEL" ]; then
  fly secrets set OPENAI_MODEL="$OPENAI_MODEL" -a "$APP_NAME"
fi

# Create a volume for persistent data if it doesn't exist
echo "Checking if volume exists..."
fly volumes list -a "$APP_NAME" | grep "interview_app_data" || {
  echo "Creating volume..."
  fly volumes create interview_app_data --size 1 -a "$APP_NAME"
}

# Deploy the app
echo "Deploying app..."
fly deploy -a "$APP_NAME"

# Show app status
echo "Deployment complete! App status:"
fly status -a "$APP_NAME"

echo "SDP proxy has been deployed to Fly.io"
echo "You can access it at: https://$APP_NAME.fly.dev"
echo "For logs run: fly logs -a $APP_NAME" 