// ============================================
// NIVA — Standalone Jarvis Desktop HUD Logic
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
const startupToggleBtn = document.getElementById('startupToggleBtn');
const ramVal = document.getElementById('ramVal');
const cpuVal = document.getElementById('cpuVal');
const batVal = document.getElementById('batVal');

let isListening = false;
let recognition = null;
let autoStartEnabled = false;

// Initialize Web Speech API for Desktop Voice Activation
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRec();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-IN';

  recognition.onstart = () => {
    isListening = true;
    coreTrigger.classList.add('listening');
    statusOutput.innerText = '🎙️ Listening for command...';
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        statusOutput.innerText = `"${event.results[i][0].transcript}"`;
      }
    }

    if (finalTranscript) {
      handleVoiceCommand(finalTranscript.trim());
    }
  };

  recognition.onerror = (e) => {
    console.warn('Speech error:', e.error);
    stopListening();
  };

  recognition.onend = () => {
    stopListening();
  };
}

function startListening() {
  if (recognition && !isListening) {
    try {
      recognition.start();
    } catch (e) {
      console.warn(e);
    }
  }
}

function stopListening() {
  isListening = false;
  coreTrigger.classList.remove('listening');
  statusOutput.innerText = 'Tap Core or say "Hey NIVA"';
  try {
    recognition?.stop();
  } catch (e) {}
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;
    window.speechSynthesis.speak(utt);
  }
}

// Process voice command
function handleVoiceCommand(cmd) {
  const lower = cmd.toLowerCase();
  statusOutput.innerText = `Command: "${cmd}"`;

  if (lower.includes('notepad')) {
    window.nivaDesktop?.openApp('notepad');
    speakText('Opening Notepad on your laptop.');
  } else if (lower.includes('calc')) {
    window.nivaDesktop?.openApp('calculator');
    speakText('Opening Calculator.');
  } else if (lower.includes('chrome') || lower.includes('browser')) {
    window.nivaDesktop?.openApp('chrome');
    speakText('Opening Chrome browser.');
  } else if (lower.includes('open full') || lower.includes('web') || lower.includes('chat')) {
    window.nivaDesktop?.toggleFullWindow();
    speakText('Opening NIVA Command Center.');
  } else {
    speakText(`Understood. ${cmd}`);
  }

  setTimeout(stopListening, 1500);
}

// Click to toggle listening
coreTrigger.addEventListener('click', () => {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
});

// Expand to Full Web Application
btnExpand.addEventListener('click', () => {
  window.nivaDesktop?.toggleFullWindow();
});
btnCenter.addEventListener('click', () => {
  window.nivaDesktop?.toggleFullWindow();
});

// Minimize to tray
btnMinimize.addEventListener('click', () => {
  window.nivaDesktop?.minimize();
});

// Quick App Launchers
btnNotepad.addEventListener('click', () => {
  window.nivaDesktop?.openApp('notepad');
  speakText('Notepad launched.');
});
btnCalc.addEventListener('click', () => {
  window.nivaDesktop?.openApp('calculator');
  speakText('Calculator launched.');
});
btnChrome.addEventListener('click', () => {
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

// Sync with actual system startup setting
if (window.nivaDesktop?.getStartupSetting) {
  window.nivaDesktop.getStartupSetting().then((enabled) => {
    updateStartupUI(enabled);
  }).catch(() => updateStartupUI(false));
} else {
  updateStartupUI(false);
}

startupToggleBtn.addEventListener('click', async () => {
  const nextState = !autoStartEnabled;
  if (window.nivaDesktop?.setStartupSetting) {
    const success = await window.nivaDesktop.setStartupSetting(nextState);
    updateStartupUI(success !== undefined ? success : nextState);
  } else {
    updateStartupUI(nextState);
  }
});

// Update Telemetry
async function updateStats() {
  if (window.nivaDesktop?.getQuickStats) {
    const stats = window.nivaDesktop.getQuickStats();
    if (stats) {
      ramVal.innerText = `${stats.usedMem || '14.8'} / ${stats.totalMem || '15.8'} GB`;
      cpuVal.innerText = stats.cpuModel ? stats.cpuModel.split(' ')[0] : 'AMD 16c';
      batVal.innerText = stats.battery || '51%';
    }
  }
}
setInterval(updateStats, 5000);
updateStats();
