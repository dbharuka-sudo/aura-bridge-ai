# Deploy Aura Bridge AI Frontend to AWS S3
$BUCKET_NAME = "aura-bridge-ai-frontend-$(Get-Date -Format 'yyyyMMddHHmmss')"
$REGION = "us-east-1"

Write-Host "🚀 Deploying Aura Bridge AI Frontend to AWS S3" -ForegroundColor Green
Write-Host "Bucket: $BUCKET_NAME" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow

# Create S3 bucket
Write-Host "📦 Creating S3 bucket..." -ForegroundColor Blue
aws s3 mb "s3://$BUCKET_NAME" --region $REGION

# Configure bucket for static website hosting
Write-Host "🌐 Configuring static website hosting..." -ForegroundColor Blue
aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html

# Upload files
Write-Host "📤 Uploading files..." -ForegroundColor Blue
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete

# Set public read permissions
Write-Host "🔓 Setting public read permissions..." -ForegroundColor Blue
$policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
"@
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy $policy

# Get website URL
$WEBSITE_URL = "http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Website URL: $WEBSITE_URL" -ForegroundColor Cyan
Write-Host "📦 S3 Bucket: $BUCKET_NAME" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 To update the deployment, run:" -ForegroundColor Blue
Write-Host "aws s3 sync dist/ s3://$BUCKET_NAME --delete" -ForegroundColor Gray
Write-Host ""
Write-Host "🗑️  To delete the deployment, run:" -ForegroundColor Red
Write-Host "aws s3 rb s3://$BUCKET_NAME --force" -ForegroundColor Gray
