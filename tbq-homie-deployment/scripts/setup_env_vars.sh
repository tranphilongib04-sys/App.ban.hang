#!/bin/bash
cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi

echo "📂 Reading .env file..."
# Read .env and set variables
# grep -v '^#' .env | xargs -0  <-- too risky with quotes
# Simple loop approach

while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    if [[ $line =~ ^# ]] || [[ -z $line ]]; then
        continue
    fi
    
    # Extract key and value
    key=$(echo "$line" | cut -d '=' -f 1)
    value=$(echo "$line" | cut -d '=' -f 2-)
    
    # Remove surrounding quotes if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')
    
    if [[ -n "$key" ]]; then
        echo "🔧 Setting $key..."
        netlify env:set "$key" "$value"
    fi
done < .env

echo ""
echo "✅ Environment configuration completed!"
echo "🚀 You can now run 'netlify deploy --prod' to apply changes."
