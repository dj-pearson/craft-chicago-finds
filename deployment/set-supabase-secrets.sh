#!/bin/bash
# Set Supabase Edge Function Secrets
# Run on your Contabo server: bash set-supabase-secrets.sh

echo "=========================================="
echo "SUPABASE EDGE FUNCTION SECRETS SETUP"
echo "=========================================="

# Find the Supabase service directory
SUPABASE_DIR=$(find /data/coolify/services -name "docker-compose.yml" -exec grep -l "supabase" {} \; 2>/dev/null | head -1 | xargs dirname)

if [ -z "$SUPABASE_DIR" ]; then
    echo "Could not find Supabase directory automatically."
    echo "Please enter the path to your Supabase service directory:"
    read SUPABASE_DIR
fi

echo "Using Supabase directory: $SUPABASE_DIR"

# Create or update .env file
ENV_FILE="$SUPABASE_DIR/.env"

echo ""
echo "Current .env location: $ENV_FILE"
echo ""

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Backed up existing .env file"
fi

# Function to set or update an env var
set_env_var() {
    local key=$1
    local description=$2
    local current_value=""

    # Check if already set
    if [ -f "$ENV_FILE" ]; then
        current_value=$(grep "^${key}=" "$ENV_FILE" | cut -d= -f2-)
    fi

    if [ -n "$current_value" ]; then
        echo "  $key = [already set: ${current_value:0:20}...]"
    else
        echo "  $key = [NOT SET] - $description"
    fi
}

echo ""
echo "=== CHECKING REQUIRED VARIABLES ==="
echo ""

echo "--- SUPABASE CORE ---"
set_env_var "SUPABASE_URL" "Your Kong gateway URL (e.g., https://api.craftlocal.net)"
set_env_var "SUPABASE_ANON_KEY" "Public anonymous key"
set_env_var "SUPABASE_SERVICE_ROLE_KEY" "Admin service role key"
set_env_var "SUPABASE_JWT_SECRET" "JWT signing secret"

echo ""
echo "--- STRIPE ---"
set_env_var "STRIPE_SECRET_KEY" "Stripe secret key (sk_live_* or sk_test_*)"
set_env_var "STRIPE_WEBHOOK_SECRET" "Stripe webhook signing secret (whsec_*)"

echo ""
echo "--- AI SERVICES ---"
set_env_var "OPENAI_API_KEY" "OpenAI API key"
set_env_var "CLAUDE_API_KEY" "Anthropic Claude API key"
set_env_var "ANTHROPIC_API_KEY" "Anthropic API key (alias)"

echo ""
echo "--- EMAIL ---"
set_env_var "RESEND_API_KEY" "Resend email API key"

echo ""
echo "--- GOOGLE ---"
set_env_var "GOOGLE_CLIENT_SECRET" "Google OAuth client secret"
set_env_var "PAGESPEED_INSIGHTS_API_KEY" "PageSpeed Insights API key"

echo ""
echo "--- SHIPPING ---"
set_env_var "SHIPSTATION_API_KEY" "ShipStation API key"
set_env_var "SHIPSTATION_API_SECRET" "ShipStation API secret"

echo ""
echo "=========================================="
echo "TO SET A VARIABLE, run:"
echo "  echo 'VAR_NAME=value' >> $ENV_FILE"
echo ""
echo "TO EDIT ALL VARIABLES:"
echo "  nano $ENV_FILE"
echo ""
echo "AFTER CHANGES, restart containers:"
echo "  cd $SUPABASE_DIR"
echo "  docker-compose down && docker-compose up -d"
echo "=========================================="
