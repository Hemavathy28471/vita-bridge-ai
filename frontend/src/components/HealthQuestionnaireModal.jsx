import React, { useState } from 'react';
import {
  ClipboardList,
  Check,
  ChevronRight,
  ChevronLeft,
  HeartPulse,
  Thermometer,
  Wind,
  AlertTriangle,
} from 'lucide-react';

export default function HealthQuestionnaireModal({ onSubmitAnswers, initialData = {} }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    primarySymptoms: initialData.primarySymptoms || [],
    durationDays: initialData.durationDays || 1,
    feverReported: initialData.feverReported || false,
    breathingDifficulty: initialData.breathingDifficulty || 'none',
    painScore: initialData.painScore || 2,
    appetiteStatus: initialData.appetiteStatus || 'normal',
    sleepQualityLastNight: initialData.sleepQualityLastNight || 'interrupted',
    userNotes: initialData.userNotes || '',
  });

  const symptomOptions = [
    { id: 'fever', label: 'Fever or Chills', icon: Thermometer },
    { id: 'cough', label: 'Cough or Wheezing', icon: Wind },
    { id: 'sore throat', label: 'Sore / Dry Throat', icon: HeartPulse },
    { id: 'fatigue', label: 'Severe Exhaustion / Fatigue', icon: AlertTriangle },
    { id: 'headache', label: 'Headache or Pressure', icon: AlertTriangle },
    { id: 'body aches', label: 'Muscle or Body Aches', icon: AlertTriangle },
    { id: 'shortness of breath', label: 'Shortness of Breath', icon: Wind },
    { id: 'rash', label: 'Skin Rash or Flushing', icon: HeartPulse },
    { id: 'routine', label: 'No Acute Symptoms (Routine Check)', icon: Check },
  ];

  const toggleSymptom = (sym) => {
    if (sym === 'routine') {
      setAnswers({ ...answers, primarySymptoms: ['routine'] });
      return;
    }
    const current = answers.primarySymptoms.filter((s) => s !== 'routine');
    if (current.includes(sym)) {
      setAnswers({ ...answers, primarySymptoms: current.filter((s) => s !== sym) });
    } else {
      setAnswers({ ...answers, primarySymptoms: [...current, sym] });
    }
  };

  const handleFinish = (e) => {
    e.preventDefault();
    if (onSubmitAnswers) {
      onSubmitAnswers(answers);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Clinical Health Questionnaire</h3>
            <p className="text-xs text-slate-500">Step {step} of 3: Symptom Context & Severity</p>
          </div>
        </div>

        {/* Step indicator pills */}
        <div className="flex items-center space-x-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-6 h-1.5 rounded-full transition ${
                step >= s ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleFinish} className="space-y-6">
        {/* STEP 1: Symptom Checklist */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                What symptoms or physical sensations are you experiencing?
              </h4>
              <p className="text-xs text-slate-500">Select all that apply to guide the AI pattern matcher.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {symptomOptions.map((opt) => {
                const isSelected = answers.primarySymptoms.includes(opt.id);
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleSymptom(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Duration, Fever & Breathing */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150 text-xs">
            <div>
              <label className="block font-extrabold text-slate-900 text-sm mb-1">
                How long have these symptoms been noticeable?
              </label>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { days: 1, label: 'Today (<24h)' },
                  { days: 2, label: '1–2 Days' },
                  { days: 4, label: '3–5 Days' },
                  { days: 7, label: '1+ Week' },
                ].map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => setAnswers({ ...answers, durationDays: d.days })}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                      answers.durationDays === d.days
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Breathing status */}
            <div>
              <label className="block font-extrabold text-slate-900 text-sm mb-1">
                Are you experiencing any respiratory resistance?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {[
                  { id: 'none', label: 'Breathing Freely', desc: 'No chest or airway tightness' },
                  { id: 'mild_on_exertion', label: 'Mild on Exertion', desc: 'Slightly winded on stairs' },
                  { id: 'moderate', label: 'Noticeable Airway Strain', desc: 'Persistent cough or tightness' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setAnswers({ ...answers, breathingDifficulty: b.id })}
                    className={`p-3 rounded-xl border text-left transition ${
                      answers.breathingDifficulty === b.id
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">{b.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{b.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Fever toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Feverish Feeling or Chills?</span>
                <span className="text-[11px] text-slate-500">Feeling warm, shivery, or elevated forehead temp</span>
              </div>
              <input
                type="checkbox"
                checked={answers.feverReported}
                onChange={(e) => setAnswers({ ...answers, feverReported: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center space-x-1 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Pain & Notes */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-extrabold text-slate-900 text-sm">
                  Overall Discomfort or Pain Level (0 to 10)
                </label>
                <span className="font-black text-indigo-600 text-base">{answers.painScore}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={answers.painScore}
                onChange={(e) => setAnswers({ ...answers, painScore: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0: None</span>
                <span>5: Moderate discomfort</span>
                <span>10: Severe acute pain</span>
              </div>
            </div>

            <div>
              <label className="block font-extrabold text-slate-900 text-sm mb-1">
                Additional Observations or Context (Optional)
              </label>
              <textarea
                rows={3}
                value={answers.userNotes}
                onChange={(e) => setAnswers({ ...answers, userNotes: e.target.value })}
                placeholder="e.g. Started after traveling; took paracetamol 2 hours ago..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-1 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
              >
                Submit Clinical Profile
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
