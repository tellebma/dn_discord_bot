#!/bin/sh

echo "🚀 Starting Discord Bot..."
echo "📋 Deploying commands..."

# Deploy commands first
node dist/deploy-commands.js

# Check if command deployment was successful
if [ $? -eq 0 ]; then
    echo "✅ Commands deployed successfully"
    echo "🤖 Starting bot..."
    node dist/app.js
else
    echo "❌ Command deployment failed"
    exit 1
fi