#!/bin/bash
# Deploy Aura Bridge AI Frontend to AWS S3

BUCKET_NAME="aura-bridge-ai-frontend-$(date +%s)"
REGION="us-east-1"

echo "🚀 Deploying Aura Bridge AI Frontend to AWS S3"
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"

# Create S3 bucket
echo "📦 Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Configure bucket for static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Upload files
echo "📤 Uploading files..."
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# Set public read permissions
echo "🔓 Setting public read permissions..."
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [
    {
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
    }
  ]
}"

# Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo ""
echo "✅ Deployment Complete!"
echo "🌐 Website URL: $WEBSITE_URL"
echo "📦 S3 Bucket: $BUCKET_NAME"
echo ""
echo "🔧 To update the deployment, run:"
echo "aws s3 sync dist/ s3://$BUCKET_NAME --delete"
echo ""
echo "🗑️  To delete the deployment, run:"
echo "aws s3 rb s3://$BUCKET_NAME --force"
