#!/bin/bash

# ============================================
# Deploy to Google Cloud Run
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 TBQ Manage - Cloud Run Deployment${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found!${NC}"
    echo "Please install it first: brew install google-cloud-sdk"
    exit 1
fi

# Check if logged in
ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -z "$ACCOUNT" ]; then
    echo -e "${YELLOW}📝 Please login to Google Cloud...${NC}"
    gcloud auth login
fi

echo -e "${GREEN}✓ Logged in as: $ACCOUNT${NC}"

# Set project
PROJECT_ID=${1:-tbq-manage}
echo -e "${YELLOW}📂 Using project: $PROJECT_ID${NC}"

# Check if project exists, if not create it
if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
    echo -e "${YELLOW}Creating new project: $PROJECT_ID${NC}"
    gcloud projects create $PROJECT_ID --name="TBQ Manage"
fi

gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling Cloud Run API...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Get environment variables
echo ""
echo -e "${GREEN}📋 Reading environment variables from .env${NC}"

# Read from .env file
if [ -f .env ]; then
    TURSO_DATABASE_URL=$(grep TURSO_DATABASE_URL .env | cut -d '=' -f2-)
    TURSO_AUTH_TOKEN=$(grep TURSO_AUTH_TOKEN .env | cut -d '=' -f2-)
else
    echo -e "${RED}❌ .env file not found!${NC}"
    exit 1
fi

# Deploy to Cloud Run
echo ""
echo -e "${GREEN}🚀 Deploying to Cloud Run...${NC}"
echo "This may take 3-5 minutes..."
echo ""

gcloud run deploy tbq-manage \
    --source . \
    --region asia-southeast1 \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "TURSO_DATABASE_URL=$TURSO_DATABASE_URL,TURSO_AUTH_TOKEN=$TURSO_AUTH_TOKEN,TURSO_SYNC_ENABLED=true"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Your app is now live at the URL shown above."
