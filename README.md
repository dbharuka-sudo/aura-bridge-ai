# Aura Bridge AI

End-to-end system that turns 3D hand gestures (ZED 2i on Jetson) into robot motion code (FANUC KAREL, KUKA KRL) and visualizes the path in a web UI. Backend validates, stores artifacts, and can refine code via Amazon Bedrock.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Edge Device   │    │   AWS Cloud     │    │   Web Frontend  │
│                 │    │                 │    │                 │
│  ┌─────────────┐│    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│  │ ZED 2i      ││    │ │ IoT Core    │ │    │ │ React App   │ │
│  │ Camera      ││    │ │ Topic:      │ │    │ │ Three.js    │ │
│  │ Jetson      ││    │ │ auraBridge/ │ │    │ │ PathViewer  │ │
│  │             ││    │ │ gestures/   │ │    │ │             │ │
│  └─────────────┘│    │ │ path        │ │    │ └─────────────┘ │
│        │        │    │ └─────────────┘ │    │        │        │
│        │        │    │        │        │    │        │        │
│        ▼        │    │        ▼        │    │        ▼        │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Hand Gesture│ │    │ │ Ingest      │ │    │ │ API Gateway │ │
│ │ Recognition │ │    │ │ Lambda      │ │    │ │ HTTP API    │ │
│ │ JSON Output │ │    │ │             │ │    │ │             │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    │        │        │    └─────────────────┘
         │              │        ▼        │             │
         │              │ ┌─────────────┐ │             │
         │              │ │ S3 Storage  │ │             │
         │              │ │ DynamoDB    │ │             │
         │              │ │ Bedrock AI  │ │             │
         │              │ └─────────────┘ │             │
         │              │        │        │             │
         │              │        ▼        │             │
         │              │ ┌─────────────┐ │             │
         │              │ │ API Lambda  │ │             │
         │              │ │ /latest/*   │ │             │
         │              │ └─────────────┘ │             │
         │              └─────────────────┘             │
         │                       │                      │
         └───────────────────────┼──────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Data Flow           │
                    │                         │
                    │ 1. Hand Gesture → JSON  │
                    │ 2. IoT Core → Lambda    │
                    │ 3. Process → S3/DB      │
                    │ 4. API → Frontend       │
                    │ 5. 3D Visualization    │
                    └─────────────────────────┘
```

## 🔄 Data Flow

1. **Capture**: ZED 2i camera captures hand gestures on Jetson device
2. **Process**: Gesture recognition generates JSON trajectory data
3. **Publish**: Data published to AWS IoT Core topic `auraBridge/gestures/path`
4. **Ingest**: Lambda function validates, normalizes (mm→m), and processes data
5. **Generate**: Base robot code (FANUC KAREL, KUKA KRL) generated
6. **Enhance**: Optional Amazon Bedrock refinement for improved code
7. **Store**: Processed data stored in S3 and metadata in DynamoDB
8. **Serve**: API Lambda provides endpoints for status, path, and code
9. **Visualize**: React frontend renders 3D path with Three.js
10. **Display**: Real-time visualization with robot code generation

## 🛠️ Services & Technologies

### Edge Computing
- **ZED 2i Camera**: Stereo depth camera for gesture recognition
- **NVIDIA Jetson**: Edge computing platform
- **Gesture Recognition**: Custom AI model for hand tracking

### AWS Cloud Services
- **IoT Core**: Message broker for device communication
- **Lambda Functions**: Serverless compute for processing
- **API Gateway**: HTTP API endpoints
- **S3**: Object storage for artifacts and data
- **DynamoDB**: NoSQL database for metadata
- **Bedrock**: Optional AI code refinement

### Frontend Technologies
- **React**: Modern web framework
- **Three.js**: 3D graphics library
- **Vite**: Build tool and dev server
- **CSS3**: Modern styling with gradients and animations

## 📁 Project Structure

```
aura-bridge-ai/
├── src/
│   ├── App.jsx                 # Main application component
│   ├── components/
│   │   └── PathViewer.jsx      # 3D path visualization
│   └── main.jsx               # Application entry point
├── public/
│   ├── styles.css             # Enhanced styling
│   └── index.html             # HTML template
├── cloud/
│   ├── functions/
│   │   ├── ingest.js          # Data processing Lambda
│   │   └── api.js             # API endpoints Lambda
│   └── serverless.yml         # Infrastructure as code
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured
- Serverless Framework

### Frontend Development
```bash
cd aura-bridge-ai
npm install
npm run dev
```

### Backend Deployment
```bash
cd cloud
npm ci
npx serverless deploy --stage prod --region us-east-1
```

### Environment Configuration
Create `.env` file:
```env
VITE_API_BASE=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

## 🎯 Features

### 3D Path Visualization
- Real-time trajectory rendering
- Waypoint spheres and path lines
- Grasp/release event markers
- Interactive camera controls
- Auto-fit to path bounds

### Robot Code Generation
- **FANUC KAREL**: Industrial robot programming
- **KUKA KRL**: Advanced robot control
- Real-time code updates
- Download functionality
- Code refinement with AI

### System Monitoring
- Validation status tracking
- Connection monitoring
- Error handling and recovery
- Real-time data polling

## 🔧 Configuration

### Environment Variables
- `VITE_API_BASE`: API Gateway endpoint URL
- `BEDROCK_ENABLED`: Enable AI code refinement
- `BEDROCK_MODEL`: Bedrock model selection
- `THING_NAME`: IoT device identifier

### API Endpoints
- `GET /latest/status` - System validation status
- `GET /latest/path` - Trajectory data and metadata
- `GET /latest/code` - Generated robot code

## 📊 Performance

- **Real-time Updates**: 2-5 second polling intervals
- **3D Rendering**: 60fps smooth visualization
- **Code Generation**: <1 second response time
- **Scalability**: Serverless auto-scaling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- AWS for cloud infrastructure
- Three.js for 3D graphics
- React team for the framework
- NVIDIA for Jetson platform