# VitaBridge AI

### *“Multimodal Human Sensing for Personalized Physiological Trend Monitoring and Early Warning”*

VitaBridge AI is a modern health-monitoring and clinical decision-support platform that continuously tracks multiple physiological and behavioral data streams, builds a **personalized baseline** for every user, identifies subtle deviations over time, and delivers explainable early-warning alerts before minor shifts escalate.

> **Important Clinical Safety Notice**:
> VitaBridge AI is a health-monitoring and decision-support tool, **not** a diagnostic system. It never claims to diagnose diseases or replace medical doctors. All alerts and insights are informational and encourage consultation with qualified healthcare professionals when appropriate.

---

## Key Features

1. **Role-Based Access Control (3 User Types)**:
   - **Patient / User**: Personal cockpit, 8 modality metric cards, trend charts, AI insights, and consent manager.
   - **Caregiver**: Remote oversight of authorized family members or dependants under explicit patient consent.
   - **Admin / Healthcare Professional**: System telemetry, data ingestion throughput, sensor connectivity, and privacy audit trail.

2. **Multimodal Sensing Pipeline**:
   - Ingests and normalizes 7 modalities: Heart Rate, HRV (RMSSD), SpO2, Body Temperature, Respiratory Rate, Blood Pressure, Sleep Duration/Quality, Activity/Steps, and user-reported symptoms.
   - Robust validation: bounds checking, noise filtering, duplicate rejection, and temperature unit normalization.

3. **Personalized Baseline Engine**:
   - Computes individual statistics (Mean, Median, Standard Deviation, Percentiles $P_{10}, P_{25}, P_{75}, P_{90}$, Moving Averages) instead of generic static population thresholds.
   - Adaptive Exponential Moving Average gradually calibrates baseline as new reliable data arrives.

4. **Multi-Signal AI Trend Analysis**:
   - Recognizes complex patterns across days:
     - *Pattern A*: Gradual heart rate elevation over several days.
     - *Pattern B*: Sleep reduction coupled with resting heart rate increase.
     - *Pattern C*: Intermittent SpO2 dips below personal baseline.
     - *Pattern D*: Concurrent elevation of body temperature and resting heart rate.
     - *Pattern E*: Acute drop in daily physical activity volume.

5. **Multimodal Fusion & Risk Scoring**:
   - Computes a unified **Physiological Trend Score** (0–100, baseline stability) and **Early Warning Score** (0–100, physiological deviation risk).
   - Tiers into **GREEN** (Normal), **YELLOW** (Mild deviation), and **RED** (Strong / persistent deviation).

6. **Explainable AI (5 Whys)**:
   - Every alert answers: **What happened**, **Why was it detected**, **How different from baseline**, **Which signals contributed**, and **What the user should consider doing**.

7. **VitaGuide Conversational Health Assistant**:
   - Natural language assistant grounded in the user's authentic vitals, baseline parameters, and alerts.
   - Adheres strictly to non-diagnostic clinical guardrails.

8. **Demo Simulation Mode**:
   - One-click trigger for 5 realistic health scenarios: *Normal Day*, *Deep Recovery Day*, *Stressful Day (Yellow)*, *Abnormal Respiratory Dip*, and *Persistent Multimodal Deviation (Red Alert)*.
   - Real-time updates streamed instantly over WebSockets (Socket.IO).

9. **Data Privacy & Governance**:
   - Revocable caregiver consent management, data export in JSON and CSV formats, and immutable audit logs.

---

## Demo Credentials

The platform comes pre-seeded with 3 demo personas for instant evaluation:

| Role | Name | Email | Password | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | Sarah Jenkins | `patient@vitabridge.ai` | `password123` | Active 30-day baseline, paired devices, active Yellow alert |
| **Caregiver** | Michael Chen | `caregiver@vitabridge.ai` | `password123` | Sarah's spouse; monitors her vitals under active consent |
| **Admin** | Dr. Eleanor Vance, MD | `admin@vitabridge.ai` | `password123` | Healthcare system admin; views platform telemetry & audit logs |

> **Tip**: The login screen also features **1-Click Quick Demo Login** buttons to switch between personas instantly without typing credentials.

---

## Quick Start & Setup Instructions

### Prerequisites
- Node.js v18+ or v20+ or v22+
- npm v9+

*(Note: If a local MongoDB instance is not running on port 27017, the backend automatically spins up an in-memory MongoDB engine, requiring ZERO manual database setup!)*

### 1. Start the Backend Server
```bash
cd backend
npm install
npm start
```
The server will start at `http://localhost:5000`. On first run, it automatically seeds realistic demo data, baselines, and historical readings.

### 2. Start the Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Environment Variables (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/vitabridge
JWT_SECRET=vitabridge_super_secure_jwt_secret_key_2026_production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
USE_MEMORY_DB=auto
```

---

## Project Structure

```
vitabridge-ai/
├── backend/
│   ├── ai/                      # AI Engines: Baseline, Trends, Anomaly, Fusion, Explainable AI
│   ├── config/                  # Database connector with automatic memory fallback
│   ├── controllers/             # REST controllers for Auth, Readings, Baseline, Alerts, etc.
│   ├── middleware/              # JWT Protect, Role RBAC, Audit logger, Ingestion validation
│   ├── models/                  # 10 Mongoose schemas with indexed time-series
│   ├── routes/                  # Express route definitions
│   ├── services/                # Pipeline coordination, Simulation, VitaGuide Chat
│   ├── utils/                   # Database seeder with 30-day realistic baseline
│   ├── server.js                # Main HTTP + Socket.IO server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── charts/              # Recharts multi-trend & baseline deviation charts
│   │   ├── components/          # Navbar, Sidebar, HealthStatusCard, MetricCard, Modals
│   │   ├── context/             # AuthContext with token & persona switching
│   │   ├── pages/               # Dashboard, Trends, Insights, Alerts, Devices, Caregiver, etc.
│   │   ├── services/            # Axios API & Socket.IO client
│   │   ├── App.jsx              # Main router & layout
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── documentation/
    ├── ARCHITECTURE.md          # Technical architecture & mathematical formulations
    ├── API_DOCUMENTATION.md     # Comprehensive REST & WebSocket specifications
    └── SAFETY_AND_DATA_PRIVACY.md # Ethical non-diagnostic policies & HIPAA/GDPR principles
```

---

## Testing & Verification

1. **Verify Ingestion & Trend Detection**:
   - Log in as Sarah Jenkins (Patient).
   - Notice the current status card, personalized baseline ranges, and multi-signal charts.
   - Click **Simulate Event** in the top navigation bar.
   - Choose **Persistent Deviation (Red Alert)** and click **Simulate Selected Health Event**.
   - Notice how the dashboard status immediately updates to **Attention Needed**, the Early Warning Score surges to **75+/100**, and a new Red Alert banner appears in real time.
   - Click **Explain This Alert** to inspect the 5-question Explainable AI modal.

2. **Verify VitaGuide Conversational AI**:
   - Click **VitaGuide AI** in the top navigation bar.
   - Ask: *"What changed this week?"* or *"Why did I receive this alert?"*.
   - Verify that the response references your actual baseline and measurements, with appropriate non-diagnostic guidance.

3. **Verify Caregiver Access**:
   - Switch persona to Michael Chen (Caregiver).
   - View Sarah's live telemetry and verified consent badge.

4. **Verify Privacy & Data Portability**:
   - Go to **Privacy & Consent**.
   - Test **Export JSON** or **Export CSV** to download biometric history.
