#!/bin/bash

echo "🚀 Deploying WebRTC Ephemeral Token Fix..."
echo ""

# Step 1: Deploy to Fly.io
echo "📦 Deploying fly-interview-hybrid to Fly.io..."
cd fly-interview-hybrid

# Deploy the application
fly deploy --app interview-hybrid-template

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy to Fly.io. Please check your configuration."
    exit 1
fi

cd ..
echo "✅ Fly.io deployment successful!"
echo ""

# Step 2: Check app status
echo "🔍 Checking Fly.io app status..."
fly status --app interview-hybrid-template

echo ""
echo "📊 Checking app instances..."
fly scale show --app interview-hybrid-template

# Step 3: Test the new ephemeral token endpoint
echo ""
echo "🧪 Testing ephemeral token endpoint..."
echo "Making request to: https://interview-hybrid-template.fly.dev/api/realtime/sessions"

curl -X POST https://interview-hybrid-template.fly.dev/api/realtime/sessions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-realtime-preview", "voice": "alloy"}' \
  -w "\nHTTP Status: %{http_code}\n" | jq . || echo "Note: Install jq for prettier JSON output"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Monitor logs: fly logs --app interview-hybrid-template"
echo "2. Update frontend to use the new ephemeral token flow"
echo "3. Test WebRTC connection with ephemeral tokens"
echo ""
echo "⚠️  Note: The old WebRTC proxy handlers are still in place for backward compatibility."
echo "    They can be removed once the new flow is confirmed working." 