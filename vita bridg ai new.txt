# VitaBridge AI — Project Handoff & Resumption Notes

> **Tagline**: *"Sense. Understand. Recheck. Warn Early."*  
> **Date**: September 12, 2026

---

## 1. Project Locations

- **Root Directory**:  
  `C:\Users\Indir\.gemini\antigravity-ide\scratch\vitabridge-ai`
- **Backend**:  
  `C:\Users\Indir\.gemini\antigravity-ide\scratch\vitabridge-ai\backend`
- **Frontend**:  
  `C:\Users\Indir\.gemini\antigravity-ide\scratch\vitabridge-ai\frontend`

---

## 2. Quick Start / How to Resume Tomorrow

Open two PowerShell windows:

### Terminal 1 — Backend:
```powershell
cd "C:\Users\Indir\.gemini\antigravity-ide\scratch\vitabridge-ai\backend"
node server.js
```
*The backend auto-starts an in-memory MongoDB instance and auto-seeds 30 days of baseline data, demo personas, and active alerts on Port 5000.*

### Terminal 2 — Frontend:
```powershell
cd "C:\Users\Indir\.gemini\antigravity-ide\scratch\vitabridge-ai\frontend"
npm.cmd run dev
```
*Frontend dev server starts on [http://localhost:5173](http://localhost:5173).*

---

## 3. URLs & Demo Credentials

- **Web App**: [http://localhost:5173](http://localhost:5173)
- **API Base**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Demo Accounts:
- **Patient**: `patient@vitabridge.ai` / `vitabridge123` (Sarah Jenkins)
- **Caregiver**: `caregiver@vitabridge.ai` / `vitabridge123` (Marcus Jenkins)
- **Clinician**: `doctor@vitabridge.ai` / `vitabridge123` (Dr. Elena Rostova)
*(Or click the quick-login buttons on the login screen).*

---

## 4. Completed Modules & Features

1. **Backend Layer**:
   - 15 Mongoose schemas (Users, Profiles, Readings, Camera/Audio/Activity Observations, Baselines, Trends, Rechecks, Alerts, Notifications, Devices, Consents, CaregiverRelationships, AuditLogs).
   - 13 AI services: Visual analysis, audio/cough clustering, voice biomarkers, activity deficit, physiological trend analysis, baseline statistics (P10–P90 bands), 30s Recheck Engine, multimodal fusion, risk scoring (0–100), and Explainable AI.
   - 13/13 automated test suites passing (`node verify_fullstack.js`).

2. **Frontend & Interactive UI**:
   - **Live Sensing Cockpit** (`/sensing`): Mirrored live webcam feed (`transform -scale-x-100`), persistent DOM ref, biometric face HUD overlay (alignment brackets, forehead rPPG ROI, face lock), green-channel rPPG waveform canvas, Web Audio API FFT spectrum, and acoustic event classifier.
   - **Interactive 30-Second Recheck Studio** (`/recheck`): 5 clinical protocols, circular 30s countdown ring, live webcam face viewport alongside the countdown ring, persistence verification (`PERSISTENT` vs `TRANSIENT`), and multimodal fusion report.
   - **Unusual Activity Engine** (`/activity`): Step curve vs 30-day baseline bands, inactivity streak detector, and user context feedback buttons (`[I'm resting]`, `[I'm feeling unwell]`, `[Different schedule]`).
   - **Trends & Chronological Event Timeline** (`/trends`): Multi-day Recharts trends with baseline bands and Section 17 chronological event stream.
   - **Disease Screening Flags** (`/insights`): All 5 distinct sections per Section 12 (Observation, AI Pattern, Interpretation, Recommended Recheck, When to Seek Professional Review).
   - **5-Scenario Demo Mode Simulation**: Accessible via top navbar drawer. Injects Pre-Sepsis, Night Fever, Bronchitis, Fatigue, or Healthy scenarios with prominent `DEMO DATA — NOT REAL MEDICAL MEASUREMENTS` watermark and emergency medical warning banner.
   - **VitaGuide AI Assistant** (`/assistant`): Decision-support chatbot with clinical safety guardrails.
   - **Consent & Privacy** (`/privacy`): Camera/mic permissions, data retention policy, and right-to-erasure purge.

3. **Latest Fixes**:
   - Resolved camera unmount bug so your face is visible in real-time.
   - Mirrored webcam orientation naturally.
   - Added webcam preview tile into the 30-second Recheck Studio.

---

## 5. Artifacts for Reference

- **Walkthrough Document**:  
  `C:\Users\Indir\.gemini\antigravity-ide\brain\564b7341-4b34-4b6c-a0c1-34967744ec35\walkthrough.md`
- **Implementation Plan**:  
  `C:\Users\Indir\.gemini\antigravity-ide\brain\564b7341-4b34-4b6c-a0c1-34967744ec35\implementation_plan.md`
