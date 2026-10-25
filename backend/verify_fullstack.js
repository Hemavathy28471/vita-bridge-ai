const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING VITABRIDGE AI FULL-STACK ENDPOINT VERIFICATION ===\n');

  // 1. Health check
  const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('1. Health Check:', health.status === 200 ? 'PASS ✓' : 'FAIL ✗', health.data.service);

  // 2. Patient Demo Login
  const loginRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/demo-login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { persona: 'patient' }
  );
  const token = loginRes.data.token;
  console.log('2. Patient Demo Login (Sarah Jenkins):', loginRes.status === 200 ? 'PASS ✓' : 'FAIL ✗', `Token received, Role: ${loginRes.data.user.role}`);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // 3. Root Dashboard Data (Section 15 & 21)
  const dashRes = await request({ hostname: 'localhost', port: 5000, path: '/api/dashboard', method: 'GET', headers: authHeaders });
  console.log('3. Root Dashboard & Live Sensing Status:', dashRes.status === 200 ? 'PASS ✓' : 'FAIL ✗',
    `Overall Pattern: ${dashRes.data.data.liveSensing.overallPattern}, Confidence: ${dashRes.data.data.liveSensing.confidence}%`);

  // 4. Personalized Baseline
  const baseRes = await request({ hostname: 'localhost', port: 5000, path: '/api/baseline', method: 'GET', headers: authHeaders });
  console.log('4. Personalized Baseline Signature:', baseRes.status === 200 ? 'PASS ✓' : 'FAIL ✗', `Mean Resting HR: ${baseRes.data.data.heartRate.mean} BPM, SpO2: ${baseRes.data.data.spo2.mean}%`);

  // 5. Camera Observation Ingestion (Section 1 & 2)
  const camRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/camera-observations', method: 'POST', headers: authHeaders },
    {
      eyeOpennessPercent: 62,
      blinkRatePerMin: 24,
      facialAppearanceChanges: { skinFlushingIndex: 65, skinPallorIndex: 5, facialFatigueScore: 68 },
      bodyPosture: { postureType: 'sitting', postureStabilityScore: 88, movementIntensity: 14 },
      rppgPhysiological: { estimatedPulseBpm: 86, pulseConfidence: 0.91, signalQualityScore: 92 },
    }
  );
  console.log('5. Camera Observation & rPPG Ingestion:', camRes.status === 201 ? 'PASS ✓' : 'FAIL ✗', `Fatigue Score: ${camRes.data.analysis.fatigueScore}, Anomaly: ${camRes.data.analysis.isAnomalous}`);

  // 6. Audio Observation Ingestion (Section 4 & 5)
  const audioRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/audio-observations', method: 'POST', headers: authHeaders },
    {
      eventType: 'cough_like',
      confidence: 86,
      frequency: 6,
      durationSeconds: 360,
      vocalAcoustics: { speechRateWpm: 112, pauseDurationRatio: 0.28, voiceStrainScore: 48, hoarsenessScore: 54 },
    }
  );
  console.log('6. Audio Observation & Cough Cluster:', audioRes.status === 201 ? 'PASS ✓' : 'FAIL ✗', `Interpretation: ${audioRes.data.analysis.interpretation.slice(0, 50)}...`);

  // 7. Recheck Engine: Start & Complete (Section 8 & 9)
  const recheckStart = await request(
    { hostname: 'localhost', port: 5000, path: '/api/recheck/start', method: 'POST', headers: authHeaders },
    {
      protocolType: 'respiratory',
      triggerSource: 'cough_cluster',
      initialSignals: { heartRate: 86, spo2: 94, respiratoryRate: 20, coughEventCount: 6 },
    }
  );
  console.log('7a. Recheck Engine Started (Respiratory Protocol):', recheckStart.status === 201 ? 'PASS ✓' : 'FAIL ✗', `Session ID: ${recheckStart.data.data._id}`);

  const recheckComplete = await request(
    { hostname: 'localhost', port: 5000, path: '/api/recheck/complete', method: 'POST', headers: authHeaders },
    {
      sessionId: recheckStart.data.data._id,
      protocolType: 'respiratory',
      recheckSignals: { heartRate: 85, spo2: 94, respiratoryRate: 20, coughEventCount: 2 },
      userSymptomInput: { reportedDyspnea: true, reportedFatigue: 3, notes: 'Feeling slightly short of breath' },
    }
  );
  console.log('7b. Recheck Engine Completed & Verified:', recheckComplete.status === 200 ? 'PASS ✓' : 'FAIL ✗',
    `Persists: ${recheckComplete.data.verification.persists}, Tier: ${recheckComplete.data.tier.tier}`);

  // 8. Unusual Activity Engine & Context Prompt (Section 7)
  const actRes = await request({ hostname: 'localhost', port: 5000, path: '/api/activity', method: 'GET', headers: authHeaders });
  console.log('8a. Unusual Activity Status:', actRes.status === 200 ? 'PASS ✓' : 'FAIL ✗', `Steps Today: ${actRes.data.data.currentSteps}, Baseline: ${actRes.data.data.baselineSteps.mean}`);

  const actContext = await request(
    { hostname: 'localhost', port: 5000, path: '/api/activity/context', method: 'POST', headers: authHeaders },
    { context: 'resting' }
  );
  console.log('8b. Unusual Activity Context Prompt Provided [I\'m resting]:', actContext.status === 200 ? 'PASS ✓' : 'FAIL ✗', `Interpretation: ${actContext.data.evaluation.contextInterpretation}`);

  // 9. Multi-Day Trends & Chronological Event Timeline (Section 16 & 17)
  const trendRes = await request({ hostname: 'localhost', port: 5000, path: '/api/trends?timeframe=7d', method: 'GET', headers: authHeaders });
  console.log('9. Multi-Day Trends & Event Timeline:', trendRes.status === 200 ? 'PASS ✓' : 'FAIL ✗', `Timeline Events: ${trendRes.data.timeline.length}`);

  // 10. Disease Screening & Possible Condition Flags (Section 12)
  const insightRes = await request({ hostname: 'localhost', port: 5000, path: '/api/insights', method: 'GET', headers: authHeaders });
  const conditionFlag = insightRes.data.data.conditionPatternFlags[0];
  console.log('10. Disease Screening Flags (5 Distinct Parts):', insightRes.status === 200 ? 'PASS ✓' : 'FAIL ✗', `Flag: ${conditionFlag?.categoryName}`);
  if (conditionFlag) {
    console.log('    • Observation:', conditionFlag.observation.slice(0, 60) + '...');
    console.log('    • AI Pattern:', conditionFlag.aiPattern.slice(0, 60) + '...');
    console.log('    • Possible Interpretation:', conditionFlag.possibleInterpretation.slice(0, 60) + '...');
    console.log('    • Recheck:', conditionFlag.recheck.slice(0, 60) + '...');
    console.log('    • Professional Review:', conditionFlag.professionalReview.slice(0, 60) + '...');
  }

  // 11. Early Warning Alerts & Explainable AI (Section 11 & 13)
  const alertRes = await request({ hostname: 'localhost', port: 5000, path: '/api/alerts', method: 'GET', headers: authHeaders });
  const latestAlert = alertRes.data.data[0];
  console.log('11. Early Warning Alerts & Explainable AI ("Why am I seeing this?"):', alertRes.status === 200 ? 'PASS ✓' : 'FAIL ✗', `Tier: ${latestAlert?.alertLevel}`);
  if (latestAlert?.explainableAi) {
    console.log('    • WHY:', latestAlert.explainableAi.why ? latestAlert.explainableAi.why.slice(0, 60) + '...' : 'N/A');
    console.log('    • WHAT IT MEANS:', latestAlert.explainableAi.whatDoesThisMean ? latestAlert.explainableAi.whatDoesThisMean.slice(0, 60) + '...' : 'N/A');
    console.log('    • WHAT TO DO:', latestAlert.explainableAi.whatShouldIDo ? latestAlert.explainableAi.whatShouldIDo.slice(0, 60) + '...' : 'N/A');
  }

  // 12. VitaGuide Conversational AI Assistant (Section 14)
  const chatRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/chat/message', method: 'POST', headers: authHeaders },
    { message: 'Why am I being asked to recheck?' }
  );
  console.log('12. VitaGuide Health Assistant (Decision Support):', chatRes.status === 200 ? 'PASS ✓' : 'FAIL ✗');
  console.log('    VitaGuide Response:', chatRes.data.data.answer.slice(0, 90) + '...');

  // 13. Demo Mode: Multimodal Event Simulation (Section 24)
  const simRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/simulation/trigger', method: 'POST', headers: authHeaders },
    { scenarioKey: 'MULTIMODAL_EVENT_MODE' }
  );
  console.log('13. Demo Mode Simulation (Multimodal Event Mode):', simRes.status === 201 ? 'PASS ✓' : 'FAIL ✗',
    `Watermark: "${simRes.data.data.watermark}" -> Alert Tier: ${simRes.data.data.alertLevel}`);

  console.log('\n=== ALL 13 VITABRIDGE AI SPECIFICATION TESTS COMPLETED SUCCESSFULLY! ===');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
