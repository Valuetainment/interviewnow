#!/bin/bash

# This script deploys the generate-position edge function to your Supabase project

# Set your Supabase project reference (get this from your Supabase dashboard)
# Replace with your actual project reference
PROJECT_REF="your-project-ref"

# Deploy the function
echo "Deploying generate-position function..."
supabase functions deploy generate-position --project-ref $PROJECT_REF

# Set secrets for OpenAI API
echo "Setting OpenAI API key..."
# Replace with your actual OpenAI API key or use an environment variable
supabase secrets set OPENAI_POSITION_API_KEY="your-openai-api-key" --project-ref $PROJECT_REF

echo "Deployment complete!"
echo "Remember to update the API key with your actual OpenAI key."
echo "You can also set it via: supabase secrets set OPENAI_POSITION_API_KEY=\"your-key\" --project-ref $PROJECT_REF" 