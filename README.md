# Aura Bridge AI

End-to-end system that turns 3D hand gestures (ZED 2i on Jetson) into robot motion code (FANUC KAREL, KUKA KRL) and visualizes the path in a web UI. Backend validates, stores artifacts, and can refine code via Amazon Bedrock.

## Architecture
- Edge (Jetson + ZED 2i) → publishes JSON to AWS IoT Core topic `auraBridge/gestures/path`
- Ingest Lambda → validate/normalize (mm→m), generate base KAREL/KRL, optional Bedrock refine, store in S3, update DynamoDB
- API Lambda (HTTP API) → `/latest/status`, `/latest/path`, `/latest/code` (CORS)
- React + Three.js → renders full path + fixtures + grasp/release markers; shows KAREL/KRL (prefers refined)

## Services
AWS IoT Core, AWS Lambda, API Gateway v2 (HTTP), S3, DynamoDB, optional Amazon Bedrock (InvokeModel).

## Data Flow
Jetson → IoT (`auraBridge/gestures/path`) → Ingest Lambda → S3 + DynamoDB → API Lambda → React UI.

## Frontend
- `aura-bridge-ai/src/App.jsx` polls API
- `aura-bridge-ai/src/components/PathViewer.jsx` renders path, fixtures, events
- `.env(.production)`: `VITE_API_BASE=https://<apiId>.execute-api.us-east-1.amazonaws.com`

## Backend
- `cloud/functions/ingest.js`: stores `{ points, fixtures, grasp_events }` in meters and base/refined code
- `cloud/functions/api.js`: returns latest status, path, and code (refined preferred)
- `cloud/serverless.yml`: Lambdas, IoT Rule, S3, DynamoDB, CORS; env (`BEDROCK_ENABLED`, `BEDROCK_MODEL`, `THING_NAME`)

## Deploy
cd cloud && npm ci && npx serverless deploy --stage prod --region us-east-1
