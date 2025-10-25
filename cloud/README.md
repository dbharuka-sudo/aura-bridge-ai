# Aura Bridge AI - Cloud Backend (Serverless)

## Prereqs
- Node.js 18+
- AWS CLI v2
- Serverless Framework v3 (`npm i -g serverless`)

## Configure AWS CLI
```bash
aws configure
# Enter Access Key ID, Secret, region (e.g., us-east-1), output json
```

## Deploy
```bash
cd cloud
npm init -y
npm i @aws-sdk/client-s3 @aws-sdk/client-dynamodb
sls deploy --stage prod
```

Outputs:
- S3 Bucket: `aura-bridge-ai-cloud-prod-artifacts`
- DynamoDB: `aura-bridge-ai-cloud-prod-jobs`
- HTTP API endpoint shown at the end of deploy

## Jetson publishing
- Publish ZED path JSON to IoT topic `aura_bridge/paths` using AWS IoT Device SDK.

## Frontend configuration
- Set `VITE_API_BASE` to your HTTP API base URL and rebuild.

