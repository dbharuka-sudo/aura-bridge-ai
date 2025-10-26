# Aura Bridge AI

End-to-end system that turns 3D hand gestures (ZED 2i on Jetson) into robot motion code (FANUC KAREL, KUKA KRL) and visualizes the path in a web UI. Backend validates, stores artifacts, and can refine code via Amazon Bedrock.

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Edge Computing Layer"
        A[ZED 2i Stereo Camera] --> B[NVIDIA Jetson]
        B --> C[Gesture Recognition AI]
        C --> D[JSON Trajectory Data]
    end
    
    subgraph "AWS IoT Core"
        E[IoT Topic: auraBridge/gestures/path]
        F[Message Broker]
        G[Device Registry]
    end
    
    subgraph "AWS Lambda Functions"
        H[Ingest Lambda]
        I[API Lambda]
        J[Validation & Processing]
        K[Code Generation]
        L[Bedrock AI Enhancement]
    end
    
    subgraph "AWS Storage & Database"
        M[S3 Bucket]
        N[DynamoDB]
        O[Path Artifacts]
        P[Generated Code]
        Q[Job Metadata]
    end
    
    subgraph "API Gateway"
        R[HTTP API v2]
        S[/latest/status]
        T[/latest/path]
        U[/latest/code]
    end
    
    subgraph "Frontend Application"
        V[React App]
        W[Three.js 3D Renderer]
        X[PathViewer Component]
        Y[Real-time Visualization]
        Z[Robot Code Display]
    end
    
    subgraph "External Services"
        AA[Amazon Bedrock]
        BB[AI Code Refinement]
    end
    
    %% Data Flow Connections
    D -->|Publish| E
    E -->|Trigger| H
    H -->|Process| J
    J -->|Generate| K
    K -->|Store| M
    K -->|Store| N
    H -->|Enhance| L
    L -->|AI Refinement| AA
    AA -->|Enhanced Code| BB
    BB -->|Store| M
    
    M -->|Serve| I
    N -->|Query| I
    I -->|Expose| R
    R -->|Endpoints| S
    R -->|Endpoints| T
    R -->|Endpoints| U
    
    S -->|Poll| V
    T -->|Fetch| V
    U -->|Retrieve| V
    V -->|Render| W
    W -->|Display| X
    X -->|Visualize| Y
    V -->|Show| Z
    
    %% Styling
    classDef edgeDevice fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef awsService fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef storage fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef frontend fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#fff8e1,stroke:#f57f17,stroke-width:2px
    
    class A,B,C,D edgeDevice
    class E,F,G,H,I,J,K,L,R,S,T,U awsService
    class M,N,O,P,Q storage
    class V,W,X,Y,Z frontend
    class AA,BB external
```

## 🔄 Data Flow

```mermaid
sequenceDiagram
    participant ZED as ZED 2i Camera
    participant Jetson as NVIDIA Jetson
    participant IoT as AWS IoT Core
    participant Ingest as Ingest Lambda
    participant S3 as S3 Storage
    participant DB as DynamoDB
    participant Bedrock as Amazon Bedrock
    participant API as API Lambda
    participant Gateway as API Gateway
    participant React as React Frontend
    participant Three as Three.js Renderer
    
    ZED->>Jetson: Capture hand gestures
    Jetson->>Jetson: Process with AI model
    Jetson->>IoT: Publish JSON trajectory
    IoT->>Ingest: Trigger Lambda function
    
    Ingest->>Ingest: Validate & normalize data
    Ingest->>Ingest: Generate base robot code
    Ingest->>S3: Store path artifacts
    Ingest->>DB: Update job metadata
    
    alt Bedrock Enhancement Enabled
        Ingest->>Bedrock: Send code for refinement
        Bedrock->>Ingest: Return enhanced code
        Ingest->>S3: Store refined code
    end
    
    React->>Gateway: Poll /latest/status
    Gateway->>API: Forward request
    API->>DB: Query job status
    API->>Gateway: Return status
    Gateway->>React: Status response
    
    React->>Gateway: Fetch /latest/path
    Gateway->>API: Forward request
    API->>S3: Retrieve path data
    API->>Gateway: Return path JSON
    Gateway->>React: Path data
    
    React->>Gateway: Fetch /latest/code
    Gateway->>API: Forward request
    API->>S3: Retrieve robot code
    API->>Gateway: Return code
    Gateway->>React: Robot code
    
    React->>Three: Render 3D visualization
    Three->>Three: Display trajectory path
    Three->>Three: Show waypoints & events
    React->>React: Display robot code
```

### **System Flow Overview:**

1. **🎥 Capture**: ZED 2i stereo camera captures hand gestures in real-time
2. **🧠 Process**: NVIDIA Jetson processes gestures with custom AI model
3. **📤 Publish**: JSON trajectory data published to AWS IoT Core topic
4. **⚡ Ingest**: Lambda function validates, normalizes (mm→m), and processes data
5. **🤖 Generate**: Base robot code (FANUC KAREL, KUKA KRL) automatically generated
6. **✨ Enhance**: Optional Amazon Bedrock AI refinement for improved code quality
7. **💾 Store**: Processed data stored in S3, metadata in DynamoDB
8. **🌐 Serve**: API Lambda provides RESTful endpoints for status, path, and code
9. **🎨 Visualize**: React frontend renders interactive 3D path with Three.js
10. **📱 Display**: Real-time visualization with live robot code updates

## 🛠️ Technology Stack

```mermaid
graph LR
    subgraph "Edge Layer"
        A1[ZED 2i Stereo Camera]
        A2[NVIDIA Jetson Nano/Xavier]
        A3[Custom AI Model]
        A4[Python/OpenCV]
    end
    
    subgraph "Cloud Infrastructure"
        B1[AWS IoT Core]
        B2[AWS Lambda]
        B3[API Gateway v2]
        B4[S3 Bucket]
        B5[DynamoDB]
        B6[Amazon Bedrock]
    end
    
    subgraph "Frontend Stack"
        C1[React 18]
        C2[Three.js]
        C3[Vite]
        C4[CSS3/Modern UI]
        C5[Axios HTTP Client]
    end
    
    subgraph "Development Tools"
        D1[Node.js]
        D2[npm/yarn]
        D3[Serverless Framework]
        D4[Git/GitHub]
        D5[AWS CLI]
    end
    
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> B1
    
    B1 --> B2
    B2 --> B3
    B2 --> B4
    B2 --> B5
    B2 --> B6
    
    B3 --> C1
    C1 --> C2
    C1 --> C5
    
    D1 --> D2
    D2 --> D3
    D3 --> B1
    D4 --> D5
    
    classDef edge fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef cloud fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef frontend fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef dev fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class A1,A2,A3,A4 edge
    class B1,B2,B3,B4,B5,B6 cloud
    class C1,C2,C3,C4,C5 frontend
    class D1,D2,D3,D4,D5 dev
```

### **Edge Computing**
- **🎥 ZED 2i Camera**: Stereo depth camera for precise gesture recognition
- **🚀 NVIDIA Jetson**: Edge computing platform for real-time AI processing
- **🧠 Custom AI Model**: Trained gesture recognition for hand tracking
- **🐍 Python/OpenCV**: Computer vision and image processing

### **AWS Cloud Services**
- **📡 IoT Core**: Message broker for secure device communication
- **⚡ Lambda Functions**: Serverless compute for scalable processing
- **🌐 API Gateway**: HTTP API endpoints with CORS support
- **💾 S3**: Object storage for artifacts and generated code
- **🗄️ DynamoDB**: NoSQL database for job metadata and status
- **🤖 Bedrock**: AI service for optional code refinement

### **Frontend Technologies**
- **⚛️ React 18**: Modern web framework with hooks and context
- **🎨 Three.js**: 3D graphics library for path visualization
- **⚡ Vite**: Fast build tool and development server
- **💅 CSS3**: Modern styling with gradients and animations
- **📡 Axios**: HTTP client for API communication

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