#!/bin/bash

echo "🚀 Deploying WebRTC Fix..."
echo ""

# Step 1: Deploy the updated edge function
echo "📦 Deploying interview-start edge function..."
supabase functions deploy interview-start

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy edge function. Please check your Supabase configuration."
    exit 1
fi

echo "✅ Edge function deployed successfully!"
echo ""

# Step 2: Check Fly.io app status
echo "🔍 Checking Fly.io app status..."
fly status --app interview-hybrid-template

echo ""
echo "📊 Checking if app needs to be scaled up..."
fly scale show --app interview-hybrid-template

# Step 3: Test the health endpoint
echo ""
echo "🏥 Testing health endpoint..."
curl -s https://interview-hybrid-template.fly.dev/health | jq . || echo "❌ Health check failed"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Open a new terminal and run: fly logs --app interview-hybrid-template -f"
echo "2. Go to your test interview page and try starting an interview"
echo "3. Watch the logs for 'Client connected from:' messages"
echo ""
echo "🧪 To test WebSocket directly, install wscat and run:"
echo "   npm install -g wscat"
echo "   wscat -c wss://interview-hybrid-template.fly.dev" 