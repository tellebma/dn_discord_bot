#!/bin/sh

echo "🚀 Starting Discord Bot..."

# Load environment variables from /app/env directory
if [ -d "/app/env" ]; then
    echo "📁 Loading environment variables from /app/env..."
    for env_file in /app/env/.env*; do
        if [ -f "$env_file" ]; then
            echo "  📄 Loading $(basename $env_file)"
            export $(cat "$env_file" | grep -v '^#' | xargs)
        fi
    done
else
    echo "⚠️  No /app/env directory found, using system environment variables"
fi

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