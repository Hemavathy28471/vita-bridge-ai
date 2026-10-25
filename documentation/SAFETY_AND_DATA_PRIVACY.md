# VitaBridge AI - Clinical Safety, Guardrails & Data Privacy Policy

## 1. Core Clinical Safety Principles

VitaBridge AI is designed as an **informational physiological trend monitor and clinical decision-support system**. It strictly adheres to international ethical and medical safety standards:

1. **Non-Diagnostic Policy**:
   - The platform will **never** claim to diagnose a disease, infection, or medical pathology (e.g., it will never state "You have pneumonia", "You have COVID-19", or "You have hypertension").
   - Outputs describe observed deviations (e.g., *"Elevated resting heart rate and body temperature diverge from your standard baseline"*).

2. **No Pharmacological or Dosage Advice**:
   - The system **never** advises changing medication dosages, stopping prescriptions, or self-administering drugs.

3. **Appropriate Escalation & Disclaimer**:
   - All generated alerts, insight cards, and VitaGuide conversations explicitly present standard health decision-support disclaimers.
   - For severe, acute departures or emergency symptoms (e.g. chest discomfort, acute dyspnea, blue lips, severe fever), the system actively directs the user to contact local emergency services or a qualified physician immediately.

---

## 2. Privacy & Data Governance Architecture

VitaBridge AI is built on **Privacy by Design** principles inspired by HIPAA (Health Insurance Portability and Accountability Act) and GDPR:

1. **Granular Consent & Patient Sovereignty**:
   - Health records are private by default.
   - Caregivers, nurses, or clinicians can only inspect vitals if explicit, active consent has been granted by the patient.
   - Patients can revoke external access at any moment with single-click immediate termination.

2. **Immutable Audit Logging**:
   - Every read, export, login, device toggle, and consent grant is recorded in an immutable audit ledger (`AuditLog`).
   - Entries include timestamp, actor ID, action type, IP address, and status.

3. **Data Portability**:
   - Patients can export their complete biometric history at any time in standardized JSON or CSV format.

4. **Data Minimization & Admin Safeguards**:
   - Administrative users possess operational and infrastructure visibility only.
   - Unconsented patient physiological readings remain masked and inaccessible to admin accounts.
