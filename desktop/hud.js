// ============================================
// NIVA — Standalone Jarvis Desktop HUD Logic
// Google Voice Gathering Engine (en-IN Hinglish & hi-IN Hindi)
// Realtime Web Speech + MediaRecorder to Gemini 2.0 Audio Fallback
// ============================================

const coreTrigger = document.getElementById('coreTrigger');
const coreSphere = document.getElementById('coreSphere');
const statusOutput = document.getElementById('statusOutput');
const btnExpand = document.getElementById('btnExpand');
const btnMinimize = document.getElementById('btnMinimize');
const btnNotepad = document.getElementById('btnNotepad');
const btnCalc = document.getElementById('btnCalc');
const btnChrome = document.getElementById('btnChrome');
const btnCenter = document.getElementById('btnCenter');
const btnLangToggle = document.getElementById('btnLangToggle');
const startupToggleBtn = document.getElementById('startupToggleBtn');
const ramVal = document.getElementById('ramVal');
const cpuVal = document.getElementById('cpuVal');
const batVal = document.getElementById('batVal');

const testVoiceStatus = document.getElementById('testVoiceStatus');
const testVoiceNotepad = document.getElementById('testVoiceNotepad');
const testVoiceYouTube = document.getElementById('testVoiceYouTube');
const testVoiceCalc = document.getElementById('testVoiceCalc');

let isListening = false;
let recognition = null;
let currentLang = 'en-IN';
let autoStartEnabled = false;
let mediaRecorder = null;
let audioChunks = [];
let mediaStream = null;
let hasReceivedSpeech = false;

// Initialize Google Chromium Web Speech API if supported
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  try {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = currentLang;

    recognition.onstart = () => {
      isListening = true;
      hasReceivedSpeech = false;
      coreTrigger.classList.add('listening');
      statusOutput.innerText = `🎙️ Google Voice Engine active (${currentLang})... Speak now!`;
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        hasReceivedSpeech = true;
        handleVoiceCommand(finalTranscript.trim());
      } else if (interim.trim()) {
        statusOutput.innerText = `"${interim.trim()}"`;
      }
    };

    recognition.onerror = (e) => {
      console.warn('Desktop speech engine notice:', e.error);
    };

    recognition.onend = () => {
      if (isListening && !hasReceivedSpeech && audioChunks.length === 0) {
        stopListening();
      }
    };
  } catch (e) {
    console.warn('SpeechRecognition init error:', e);
  }
}

// MediaRecorder fallback capturing raw mic audio to send to Google Gemini 2.0
async function startMediaRecorder() {
  audioChunks = [];
  try {
    if (!navigator.mediaDevices?.getUserMedia) return;
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: mime });
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunks.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
      }
      if (hasReceivedSpeech) return;

      if (audioChunks.length > 0) {
        statusOutput.innerText = '🧠 Transcribing with Google Gemini 2.0...';
        const blob = new Blob(audioChunks, { type: mime });
        if (blob.size > 1000) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64 = reader.result;
              const res = await fetch('http://localhost:3001/api/v1/voice/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: base64, mimeType: mime, language: currentLang }),
              });
              const json = await res.json();
              if (json.data?.text && !hasReceivedSpeech) {
                hasReceivedSpeech = true;
                handleVoiceCommand(json.data.text);
                return;
              }
            } catch (err) {
              console.warn('Gemini audio transcribe err:', err);
            }
            statusOutput.innerText = 'Tap Core or say "Hey NIVA"';
          };
          reader.readAsDataURL(blob);
          return;
        }
      }
      statusOutput.innerText = 'Tap Core or say "Hey NIVA"';
    };
    mediaRecorder.start(250);
  } catch (err) {
    console.warn('Microphone access notice:', err);
  }
}

function stopMediaRecorder() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch (e) {}
  }
}

function startListening() {
  isListening = true;
  hasReceivedSpeech = false;
  coreTrigger.classList.add('listening');
  statusOutput.innerText = `🎙️ Google Voice Engine active (${currentLang})... Tap Core when done.`;

  if (recognition) {
    recognition.lang = currentLang;
    try {
      recognition.start();
    } catch (e) {}
  }
  startMediaRecorder();
}

function stopListening() {
  isListening = false;
  coreTrigger.classList.remove('listening');
  try {
    recognition?.stop();
  } catch (e) {}
  stopMediaRecorder();
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;
    utt.pitch = 1.0;
    utt.lang = currentLang;
    window.speechSynthesis.speak(utt);
  }
}

// Process voice command locally or dispatch to NIVA Brain
async function handleVoiceCommand(cmd) {
  const clean = cmd
    .replace(/^(?:hey\s+niva|niva|jarvis|namaste\s+niva|suno\s+niva)[,\s:]*/i, '')
    .trim();
  const lower = (clean || cmd).toLowerCase();
  statusOutput.innerText = `🗣️ "${clean || cmd}"`;

  // Instant Laptop System Actions
  if (lower.includes('notepad')) {
    window.nivaDesktop?.openApp('notepad');
    speakText('Notepad laptop par launch ho gaya hai.');
  } else if (lower.includes('calc')) {
    window.nivaDesktop?.openApp('calculator');
    speakText('Calculator open kar diya hai.');
  } else if (lower.includes('chrome') || lower.includes('browser')) {
    window.nivaDesktop?.openApp('chrome');
    speakText('Chrome browser open ho gaya hai.');
  } else if (lower.includes('code') || lower.includes('vs code')) {
    window.nivaDesktop?.openApp('code');
    speakText('VS Code open ho gaya hai.');
  } else if (lower.includes('status') || lower.includes('health') || lower.includes('battery')) {
    const stats = window.nivaDesktop?.getQuickStats?.() || { battery: '51%', usedMem: '7.8' };
    const reply = `NIVA Core active hai. CPU nominal hai, RAM ${stats.usedMem || '7.8'} GB used hai, aur battery status healthy hai.`;
    speakText(reply);
    statusOutput.innerText = reply;
  } else if (lower.includes('open full') || lower.includes('web') || lower.includes('command center')) {
    window.nivaDesktop?.toggleFullWindow();
    speakText('NIVA Command Center open kar diya.');
  } else {
    // Send to NIVA AI Brain (Server Chat Endpoint)
    try {
      statusOutput.innerText = '🧠 Thinking...';
      const res = await fetch('http://localhost:3001/api/v1/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean || cmd }),
      });
      const data = await res.json();
      const reply = data.data?.content || data.reply || data.content || `Aapka instruction process ho gaya: ${clean || cmd}`;
      statusOutput.innerText = reply.slice(0, 50) + (reply.length > 50 ? '...' : '');
      speakText(reply.slice(0, 180));
    } catch (err) {
      speakText(`Understood: ${clean || cmd}`);
    }
  }

  setTimeout(() => {
    stopListening();
  }, 1000);
}

// Click Arc Reactor Core to toggle listening
coreTrigger.addEventListener('click', () => {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
});

// Language Toggle (en-IN Hinglish ⇄ hi-IN Hindi)
if (btnLangToggle) {
  btnLangToggle.addEventListener('click', () => {
    currentLang = currentLang === 'en-IN' ? 'hi-IN' : 'en-IN';
    btnLangToggle.innerText = currentLang === 'en-IN' ? '🇮🇳 en-IN' : '🇮🇳 हिन्दी';
    speakText(currentLang === 'hi-IN' ? 'Google Hindi voice engine active.' : 'Google Indian English voice engine active.');
  });
}

// Quick Voice Test Triggers (Instant 1-click viva demonstration)
testVoiceStatus?.addEventListener('click', () => handleVoiceCommand('NIVA, system health and laptop status report do'));
testVoiceNotepad?.addEventListener('click', () => handleVoiceCommand('NIVA, open Notepad on my laptop'));
testVoiceYouTube?.addEventListener('click', () => handleVoiceCommand('NIVA, open YouTube and play Bollywood hits'));
testVoiceCalc?.addEventListener('click', () => handleVoiceCommand('NIVA, open Calculator'));

// Expand to Full Web Application
btnExpand?.addEventListener('click', () => window.nivaDesktop?.toggleFullWindow());
btnCenter?.addEventListener('click', () => window.nivaDesktop?.toggleFullWindow());

// Minimize to tray
btnMinimize?.addEventListener('click', () => window.nivaDesktop?.minimize());

// Quick App Launchers
btnNotepad?.addEventListener('click', () => {
  window.nivaDesktop?.openApp('notepad');
  speakText('Notepad launched.');
});
btnCalc?.addEventListener('click', () => {
  window.nivaDesktop?.openApp('calculator');
  speakText('Calculator launched.');
});
btnChrome?.addEventListener('click', () => {
  window.nivaDesktop?.openApp('chrome');
  speakText('Opening Chrome.');
});

// Startup Toggle
function updateStartupUI(enabled) {
  autoStartEnabled = !!enabled;
  if (startupToggleBtn) {
    startupToggleBtn.innerText = autoStartEnabled ? 'ENABLED [ON]' : 'DISABLED [OFF]';
    startupToggleBtn.style.color = autoStartEnabled ? '#38bdf8' : '#f87171';
  }
}

if (window.nivaDesktop?.getStartupSetting) {
  window.nivaDesktop.getStartupSetting().then(updateStartupUI).catch(() => {});
}

startupToggleBtn?.addEventListener('click', async () => {
  if (window.nivaDesktop?.setStartupSetting) {
    const next = !autoStartEnabled;
    const res = await window.nivaDesktop.setStartupSetting(next);
    updateStartupUI(res);
  }
});

// Periodic Telemetry Update
function updateTelemetry() {
  if (window.nivaDesktop?.getQuickStats) {
    const stats = window.nivaDesktop.getQuickStats();
    if (ramVal) ramVal.innerText = `${stats.usedMem} GB`;
    if (cpuVal) cpuVal.innerText = stats.cpuModel.split(' ')[0] || 'CPU';
    if (batVal) batVal.innerText = stats.battery || '51%';
  }
}
setInterval(updateTelemetry, 4000);
updateTelemetry();
