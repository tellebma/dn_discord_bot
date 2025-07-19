#!/bin/sh

echo "🚀 Starting Discord Bot..."

# Check if AUTO_DEPLOY_COMMANDS is set to true
if [ "$AUTO_DEPLOY_COMMANDS" = "true" ]; then
    echo "📋 Auto-deploying commands (AUTO_DEPLOY_COMMANDS=true)..."
    node dist/deploy-commands.js
    
    if [ $? -eq 0 ]; then
        echo "✅ Commands deployed successfully"
    else
        echo "❌ Command deployment failed"
        exit 1
    fi
else
    echo "⏭️ Skipping command deployment (AUTO_DEPLOY_COMMANDS not set to 'true')"
fi

echo "🤖 Starting bot..."
node dist/app.js