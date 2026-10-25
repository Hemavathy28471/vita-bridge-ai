# VitaBridge AI - API Documentation

REST and WebSocket endpoint specifications for VitaBridge AI.

---

## Base URLs
- **REST Base**: `http://localhost:5000/api`
- **WebSocket Base**: `ws://localhost:5000`

---

## Authentication & Authorization
All secured endpoints require standard HTTP Bearer token:
```http
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register`: Create user account and initialize profile.
  - Body: `{ name, email, password, role, age, gender, heightCm, weightKg }`
- `POST /api/auth/login`: Authenticate with email/password.
  - Body: `{ email, password }`
  - Response: `{ token, user, profile }`
- `POST /api/auth/demo-login`: Instant login using preset persona.
  - Body: `{ persona: "patient" | "caregiver" | "admin" }`
- `GET /api/auth/me`: Current session inspection.
- `PUT /api/auth/profile`: Update demographics or alert sensitivity.

### 2. Physiological Readings (`/api/readings`)
- `POST /api/readings`: Ingest reading through the data cleaning and AI pipeline.
  - Body:
    ```json
    {
      "heartRate": 82,
      "hrv": 42,
      "spo2": 97,
      "temperature": 36.8,
      "respiratoryRate": 16,
      "bloodPressure": { "systolic": 120, "diastolic": 78 },
      "sleepHours": 6.8,
      "activityLevel": 0.72,
      "stressLevel": 0.35,
      "symptoms": [{ "name": "Fatigue", "severity": "mild" }]
    }
    ```
  - Response: Ingested reading, Early Warning Score, Alert level, Deviations.
- `GET /api/readings?timeframe=today|7d|30d|90d`: Historical readings.
- `GET /api/readings/dashboard`: Aggregated dashboard snapshot (scores, baseline, active alerts, latest readings).
- `POST /api/readings/import`: Batch JSON import of historical vitals.
- `GET /api/readings/export?format=json|csv`: Download personal medical history.

### 3. Health Baseline (`/api/baseline`)
- `GET /api/baseline`: Retrieve user's personal baseline signatures.
- `POST /api/baseline/recalibrate`: Trigger recalibration from stored historical readings.

### 4. Early Warning Alerts (`/api/alerts`)
- `GET /api/alerts?level=ALL|RED|YELLOW|GREEN`: List alerts.
- `GET /api/alerts/:id`: Retrieve single alert with full Explainable AI breakdown.
- `PUT /api/alerts/:id/read`: Mark alert acknowledged.

### 5. Connected Devices (`/api/devices`)
- `GET /api/devices`: List registered wearable sensors.
- `POST /api/devices`: Register new sensor.
- `PUT /api/devices/:id/toggle`: Toggle simulated connect/disconnect.

### 6. AI Insights (`/api/insights`)
- `GET /api/insights`: Grouped insights (Cardiovascular, Sleep, Respiratory, Activity, Recovery).

### 7. Caregiver Oversight (`/api/caregiver`)
*(Requires role: `caregiver` or `admin`)*
- `GET /api/caregiver/patients`: List authorized patients with active consent.
- `GET /api/caregiver/patients/:patientId/verify`: Verify access under patient consent.

### 8. Consent & Privacy (`/api/consent`)
- `GET /api/consent`: List consents granted by patient.
- `POST /api/consent/grant`: Authorize caregiver or physician email.
- `DELETE /api/consent/:id`: Immediately revoke consent.

### 9. Health Simulation Engine (`/api/simulation`)
- `GET /api/simulation/scenarios`: List demo scenario presets.
- `POST /api/simulation/trigger`:
  - Body: `{ scenarioKey: "NORMAL_DAY" | "RECOVERY_DAY" | "STRESSFUL_DAY" | "ABNORMAL_TREND" | "PERSISTENT_DEVIATION" }`
  - Broadcasts live event over WebSocket to all authorized rooms.

### 10. VitaGuide AI Assistant (`/api/chat`)
- `POST /api/chat/message`:
  - Body: `{ message: "Why did I receive this alert?" }`
  - Response: Grounded response with observed data, trend context, and safety disclaimer.

### 11. Admin Telemetry (`/api/admin`)
*(Requires role: `admin`)*
- `GET /api/admin/overview`: System status, active devices, readings count, audit log.
- `GET /api/admin/audit-logs`: Query immutable security audit events.

---

## WebSocket Events (Socket.IO)
- Client emit: `join_user_room(userId)`
- Client emit: `join_caregiver_room(patientId)`
- Server broadcast: `reading_received` -> Payload with `{ reading, earlyWarningScore, physiologicalTrendScore, alertLevel, alert }`
- Server broadcast: `patient_reading_updated` -> Caregiver notification.
