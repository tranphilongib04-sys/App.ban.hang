#!/bin/bash

# Toggle Web Admin Advanced Mode

ENV_FILE=".env.local"
KEY="NEXT_PUBLIC_WEB_ADMIN_ADVANCED"

if [ ! -f "$ENV_FILE" ]; then
    echo "# Auto-generated env file" > "$ENV_FILE"
fi

# Read current value
CURRENT=$(grep "^$KEY=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2)

if [ "$1" == "on" ] || [ "$1" == "true" ]; then
    # Enable advanced mode
    if grep -q "^$KEY=" "$ENV_FILE"; then
        sed -i '' "s/^$KEY=.*/$KEY=true/" "$ENV_FILE"
    else
        echo "$KEY=true" >> "$ENV_FILE"
    fi
    echo "✅ Web Admin Advanced Mode: ENABLED"
    echo "🔄 Please restart dev server: npm run dev"

elif [ "$1" == "off" ] || [ "$1" == "false" ]; then
    # Disable advanced mode
    if grep -q "^$KEY=" "$ENV_FILE"; then
        sed -i '' "s/^$KEY=.*/$KEY=false/" "$ENV_FILE"
    else
        echo "$KEY=false" >> "$ENV_FILE"
    fi
    echo "⚪ Web Admin Advanced Mode: DISABLED (using basic)"
    echo "🔄 Please restart dev server: npm run dev"

else
    # Show status
    if [ "$CURRENT" == "true" ]; then
        echo "📊 Web Admin Advanced Mode: ✅ ENABLED"
    else
        echo "📊 Web Admin Advanced Mode: ⚪ DISABLED (basic mode)"
    fi
    echo ""
    echo "Usage:"
    echo "  ./scripts/toggle-web-admin-advanced.sh on   - Enable advanced mode"
    echo "  ./scripts/toggle-web-admin-advanced.sh off  - Disable (use basic)"
    echo "  ./scripts/toggle-web-admin-advanced.sh      - Show current status"
fi
