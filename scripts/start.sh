#!/bin/sh

echo "🚀 Starting Discord Bot..."

# Check if AUTO_DEPLOY_COMMANDS is set to true
if [ "$AUTO_DEPLOY_COMMANDS" = "true" ]; then
    echo "📋 Auto-deploying commands (AUTO_DEPLOY_COMMANDS=true)..."
    cd /app && node -r tsconfig-paths/register dist/deploy-commands.js
    
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
cd /app && node -r tsconfig-paths/register dist/app.js