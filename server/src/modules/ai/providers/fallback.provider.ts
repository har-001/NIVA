// ============================================
// NIVA — Intelligent Local Fallback Provider
// High-Fidelity NLU & Computer Action Automation Engine
// ============================================

import {
  AIProvider,
  AIMessage,
  AIGenerateOptions,
  AIResponse,
  AIStreamChunk,
  AIToolCall,
} from '../types';

/**
 * Intelligent local provider that handles conversational dialogue and
 * triggers local tools (system info, apps, calc, date, etc.) even when
 * no external cloud API key is configured.
 */
export class FallbackProvider implements AIProvider {
  readonly name = 'fallback';

  isAvailable(): boolean {
    return true; // Always available locally
  }

  private detectToolCall(userText: string): AIToolCall | null {
    const text = userText.toLowerCase().trim();

    // 0. Direct Terminal / Shell Command Execution (Live Execution on Laptop)
    const terminalPrefix = text.match(/^(?:run\s+command|execute\s+command|command\s+chalao|command\s+run\s+karo|command\s+execute\s+karo|terminal\s+me\s+chalao|powershell\s+me\s+chalao|cmd\s+me\s+chalao|run|execute|exec)\s*[:\-]?\s*(.+)/i);
    if (terminalPrefix && terminalPrefix[1] && terminalPrefix[1].trim().length > 0) {
      const candidate = terminalPrefix[1].trim();
      // Ensure it's not a generic conversational phrase or app open
      if (!candidate.startsWith('workflow') && !candidate.startsWith('briefing') && !candidate.includes('kholo')) {
        return { id: `call_${Date.now()}`, name: 'system_run_command', arguments: { command: candidate } };
      }
    }

    const directCmds = [
      'dir', 'ls', 'ipconfig', 'ifconfig', 'systeminfo', 'hostname', 'whoami',
      'tasklist', 'netstat', 'get-process', 'pwd', 'date /t', 'time /t'
    ];
    if (
      directCmds.includes(text) ||
      text.startsWith('ping ') ||
      text.startsWith('echo ') ||
      text.startsWith('git ') ||
      text.startsWith('npm ') ||
      text.startsWith('node ') ||
      text.startsWith('python ')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_run_command', arguments: { command: userText.trim() } };
    }

    // 1. YouTube & Music / Artist Playback (Checked First for Instant Action)
    if (
      text.includes('youtube') ||
      text.includes('gaana') ||
      text.includes('song') ||
      text.includes('music') ||
      text.startsWith('play ') ||
      text.endsWith('play') ||
      text.includes('play karo') ||
      text.includes('chalao') ||
      text.includes('chala do') ||
      text.includes('chala de') ||
      text.includes('sunao') ||
      text.includes('sunwao') ||
      text.includes('baja do') ||
      text.includes('bajana') ||
      text.includes('kholne ke liye bol raha') ||
      text.includes('kholne ko bol raha')
    ) {
      const cleanQuery = userText
        .replace(/(?:kholne ke liye bol raha hun|kholne ko bol raha hun|kholne ke liye bola|kholne ko bola|open|kholo|khol de|khol do|play|chalao|chala do|chala de|pe|search|sunao|lagao|laga do|on youtube|youtube|gaana|song|video|music|karo|baja do|bajana|please|sunwao)/gi, '')
        .trim();
      const url = cleanQuery
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery)}`
        : 'https://www.youtube.com';
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url } };
    }

    // 2. Direct Website Shortcuts & Live Services
    if (text.includes('github')) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://github.com' } };
    }
    if (text.includes('chatgpt') || text.includes('openai')) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://chatgpt.com' } };
    }
    if ((text.includes('gmail') || text.includes('mail')) && !text.includes('send') && !text.includes('bhejo')) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://mail.google.com' } };
    }
    if ((text.includes('whatsapp') || text.includes('wa web')) && (text.includes('kholo') || text.includes('open') || text.includes('web'))) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://web.whatsapp.com' } };
    }
    if (text.includes('twitter') || text.includes('x.com')) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://x.com' } };
    }
    if (text.includes('instagram') || text.includes('insta')) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://instagram.com' } };
    }
    if (text.includes('linkedin')) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://linkedin.com' } };
    }
    if (text.includes('amazon')) {
      const prod = userText.replace(/(?:open|kholo|on amazon|amazon|pe|search|dhoondo)/gi, '').trim();
      const url = prod ? `https://www.amazon.in/s?k=${encodeURIComponent(prod)}` : 'https://www.amazon.in';
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url } };
    }
    if (text.includes('flipkart')) {
      const prod = userText.replace(/(?:open|kholo|on flipkart|flipkart|pe|search|dhoondo)/gi, '').trim();
      const url = prod ? `https://www.flipkart.com/search?q=${encodeURIComponent(prod)}` : 'https://www.flipkart.com';
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url } };
    }
    if (text.includes('netflix')) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://www.netflix.com' } };
    }
    if (text.includes('reddit')) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://reddit.com' } };
    }
    if (text.includes('facebook') || text.includes('fb kholo')) {
      return { id: `call_${Date.now()}`, name: 'system_open_url', arguments: { url: 'https://facebook.com' } };
    }

    // 2.1 Live Weather & Climate (In-Chat Search)
    if (
      text.includes('weather') ||
      text.includes('mausam') ||
      text.includes('temperature') ||
      text.includes('barish') ||
      text.includes('rain') ||
      text.includes('sardi') ||
      text.includes('garmi')
    ) {
      const loc = userText.replace(/(?:weather|mausam|temperature|barish|rain|kaisa h|kaisa hai|aaj ka|today|in|ka|batao|dikhao|kya h|kya hai)/gi, '').trim();
      const q = loc ? `weather in ${loc}` : 'weather today';
      return { id: `call_${Date.now()}`, name: 'web_search', arguments: { query: q, limit: 3 } };
    }

    // 2.2 Live Sports / Cricket / IPL (In-Chat Search)
    if (
      text.includes('ipl') ||
      text.includes('cricket') ||
      text.includes('match score') ||
      text.includes('score kya') ||
      (text.includes('score') && !text.includes('credit'))
    ) {
      return { id: `call_${Date.now()}`, name: 'web_search', arguments: { query: 'live cricket match score', limit: 3 } };
    }

    // 2.3 Live News & Headlines (Direct Feed Retrieval)
    if (
      text.includes('news') ||
      text.includes('khabar') ||
      text.includes('samachar') ||
      text.includes('headlines') ||
      text.includes('taaja')
    ) {
      const topic = userText
        .replace(/(?:latest news on|latest news about|breaking news on|breaking news|latest news|aaj ki khabar|taaza khabar|news feed|news batao|news dikhao|headlines|news|samachar|taaja|batao|dikhao|please)/gi, '')
        .trim();
      return { id: `call_${Date.now()}`, name: 'fetch_news', arguments: { topic: topic || 'Trending', limit: 5 } };
    }

    // 3. Workspace / Project Directory Visual Inspection
    if (
      text.includes('workspace') ||
      text.includes('niva workspace') ||
      text.includes('code folder') ||
      text.includes('project folder')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'workspace' } };
    }

    // 4. Notepad with Note Content (Write & Immediately Display)
    if (
      (text.includes('notepad') || text.includes('note')) &&
      (text.includes('likh') || text.includes('write') || text.includes('save') || text.includes('text:'))
    ) {
      const noteContent = userText
        .replace(/(?:notepad\s+(?:me\s+)?(?:likh[oa]?|write|banao|save)|open\s+notepad\s+and\s+write|likh[oa]?\s+notepad\s+me|note\s*:?)/gi, '')
        .trim();
      return {
        id: `call_${Date.now()}`,
        name: 'system_open_ide',
        arguments: {
          code: noteContent || 'Note saved from NIVA Voice Assistant:\n' + userText,
          ide: 'notepad',
          file_name: `niva_note_${Date.now().toString().slice(-4)}.txt`,
        },
      };
    }

    // 5. AI Code Generation & IDE Auto-Launch (Python, JS, TS, HTML, Fibonacci, Algorithms, etc.)
    if (
      text.includes('write code') ||
      text.includes('generate code') ||
      text.includes('code likho') ||
      text.includes('code banao') ||
      text.includes('script banao') ||
      text.includes('python code') ||
      text.includes('python script') ||
      text.includes('program banao') ||
      text.includes('fibonacci') ||
      text.includes('algorithm') ||
      (text.includes('code') && (text.includes('banao') || text.includes('likho') || text.includes('write') || text.includes('generate') || text.includes('script') || text.includes('python') || text.includes('for ')))
    ) {
      const prompt = userText
        .replace(/(?:write code for|write code|generate code for|generate code|code likho|code banao|create script for|script banao|program banao)/gi, '')
        .trim() || 'Fibonacci sequence generator with performance benchmark and visualization';
      const lang = text.includes('python') ? 'python' : text.includes('javascript') ? 'javascript' : text.includes('html') ? 'html' : 'typescript';
      return { id: `call_${Date.now()}`, name: 'generate_code', arguments: { prompt, language: lang } };
    }

    // 6. App Launching (English + Hindi + Hinglish)
    if (
      text.includes('notepad') ||
      text.includes('text editor')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'notepad' } };
    }

    if (
      text.includes('calculator') ||
      text.includes('calc') ||
      text.includes('hisaab')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'calculator' } };
    }

    if (
      text.includes('chrome') ||
      text.includes('google kholo') ||
      text.includes('browser') ||
      text.includes('internet kholo')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'chrome' } };
    }

    if (
      (text.includes('vscode') ||
      text.includes('vs code') ||
      text.includes('code editor') ||
      text.includes('coding kholo')) &&
      !text.includes('likh') &&
      !text.includes('banao') &&
      !text.includes('write') &&
      !text.includes('generate')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'vscode' } };
    }

    if (
      text.includes('camera') ||
      text.includes('webcam')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'camera' } };
    }

    if (
      text.includes('files') ||
      text.includes('explorer') ||
      text.includes('folder kholo') ||
      text.includes('my computer')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'explorer' } };
    }

    if (
      text.includes('paint') ||
      text.includes('drawing')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'paint' } };
    }

    if (
      text.includes('cmd') ||
      text.includes('terminal') ||
      text.includes('command prompt')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'cmd' } };
    }

    if (
      text.includes('task manager') ||
      text.includes('taskmgr') ||
      text.includes('processes')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'taskmgr' } };
    }

    if (
      text.includes('settings') ||
      text.includes('setting kholo')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'settings' } };
    }

    if (
      text.includes('spotify') ||
      text.includes('music kholo') ||
      text.includes('music app')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'spotify' } };
    }

    if (
      text.includes('calendar') ||
      text.includes('calender') ||
      text.includes('tareekh dikhao') ||
      text.includes('calender khol') ||
      text.includes('calendar khol')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'calendar' } };
    }

    if (
      text.includes('whatsapp') ||
      text.includes('wa kholo')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'whatsapp' } };
    }

    if (
      text.includes('telegram')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'telegram' } };
    }

    if (
      text.includes('discord')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'discord' } };
    }

    if (
      text.includes('word kholo') ||
      text.includes('winword') ||
      text.includes('ms word')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'word' } };
    }

    if (
      text.includes('excel kholo') ||
      text.includes('ms excel')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'excel' } };
    }

    if (
      text.includes('powerpoint kholo') ||
      text.includes('ppt kholo')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'powerpoint' } };
    }

    if (
      text.includes('control panel') ||
      text.includes('control panel kholo')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'control' } };
    }

    // 6. System / Laptop Status (CPU, RAM, Battery, OS, Specs)
    if (
      text.includes('system info') ||
      text.includes('laptop status') ||
      text.includes('system status') ||
      text.includes('laptop info') ||
      text.includes('laptop specs') ||
      text.includes('system specs') ||
      text.includes('battery') ||
      text.includes('cpu') ||
      text.includes('ram') ||
      text.includes('laptop kaisa') ||
      text.includes('kitni battery') ||
      text.includes('charge kitna') ||
      (text.includes('laptop') && (text.includes('info') || text.includes('details') || text.includes('batao') || text.includes('dikhao')))
    ) {
      return { id: `call_${Date.now()}`, name: 'system_info', arguments: { detail: 'basic' } };
    }

    // 7. Time & Date
    if (
      text.includes('time') ||
      text.includes('date') ||
      text.includes('samay') ||
      text.includes('tarikh') ||
      text.includes('kitne baje') ||
      text.includes('aaj kya date') ||
      text.includes('aaj kya din')
    ) {
      return { id: `call_${Date.now()}`, name: 'date_time', arguments: {} };
    }

    // 8. Calculator & Math Expression
    const calcMatch = text.match(/(?:calculate|solve|hisaab|karo|what is)\s+([0-9+\-*/().\s^sqrt]+)/i);
    if (calcMatch && calcMatch[1] && calcMatch[1].trim().length > 1) {
      return { id: `call_${Date.now()}`, name: 'calculator', arguments: { expression: calcMatch[1].trim() } };
    }
    const mathPattern = /^[0-9+\-*/().\s^]+$/;
    if (mathPattern.test(text.trim()) && text.trim().length > 2) {
      return { id: `call_${Date.now()}`, name: 'calculator', arguments: { expression: text.trim() } };
    }

    // 9. Screenshot
    if (
      text.includes('screenshot') ||
      text.includes('capture screen') ||
      text.includes('photo lo') ||
      text.includes('screen ki photo')
    ) {
      return { id: `call_${Date.now()}`, name: 'system_screenshot', arguments: {} };
    }

    // 10. Volume Control
    if (
      text.includes('mute') ||
      text.includes('unmute') ||
      text.includes('volume') ||
      text.includes('aawaz')
    ) {
      const action = text.includes('unmute')
        ? 'unmute'
        : text.includes('mute')
        ? 'mute'
        : text.includes('up') || text.includes('badhao') || text.includes('tez')
        ? 'up'
        : 'down';
      return { id: `call_${Date.now()}`, name: 'system_volume', arguments: { action } };
    }

    // 11. Clipboard
    if (text.includes('clipboard') || text.includes('copy to clipboard')) {
      const isWrite = text.includes('copy') || text.includes('write');
      const textMatch = userText.match(/(?:copy|write)\s+["']?([^"']+)["']?\s+to\s+clipboard/i);
      return {
        id: `call_${Date.now()}`,
        name: 'system_clipboard',
        arguments: { action: isWrite ? 'write' : 'read', text: textMatch ? textMatch[1] : 'Hello from NIVA!' },
      };
    }

    // 12. List Files
    if (
      text.includes('list files') ||
      text.includes('show files') ||
      text.includes('files in documents') ||
      text.includes('files in desktop') ||
      text.includes('files in downloads')
    ) {
      const folder = text.includes('desktop') ? 'Desktop' : text.includes('download') ? 'Downloads' : 'Documents';
      return { id: `call_${Date.now()}`, name: 'system_list_files', arguments: { folder } };
    }

    // 13. Lock Workstation
    if (text.includes('lock laptop') || text.includes('lock pc') || text.includes('lock screen') || text.includes('lock system')) {
      return { id: `call_${Date.now()}`, name: 'system_lock', arguments: {} };
    }

    // 14. Search Contacts Directory (Checked before generic search)
    if (text.includes('contact') || text.includes('phone number') || text.includes('kiska number')) {
      const queryMatch = userText.match(/(?:contact|number|details|for|of)\s+([a-zA-Z\s]+)/i);
      const query = queryMatch && queryMatch[1] ? queryMatch[1].trim() : '';
      return { id: `call_${Date.now()}`, name: 'search_contacts', arguments: { query } };
    }

    // 15. Initiate Call (Hindi & English)
    if (text.includes('call karo') || text.includes('call lagao') || text.includes('make a call') || text.includes('phone milao') || text.includes('call to') || (text.startsWith('call ') && text.length < 35)) {
      let contactName = 'Harshit Sharma';
      const hindiMatch = userText.match(/([a-zA-Z\s]+)\s+ko\s+call/i);
      const engMatch = userText.match(/call\s+(?:to\s+|karo\s+)?([a-zA-Z\s]+)/i);
      if (hindiMatch && hindiMatch[1]) {
        contactName = hindiMatch[1].trim();
      } else if (engMatch && engMatch[1]) {
        contactName = engMatch[1].replace(/(?:karo|ko|lagao|please)/gi, '').trim();
      }
      return { id: `call_${Date.now()}`, name: 'initiate_call', arguments: { contactName } };
    }

    // 16. In-Chat Web Search & Informational Questions (Live Multi-Engine Search in Chat)
    // Handle suffix searches like "elon musk search karo", "ipl score google karo"
    const suffixSearch = userText.match(/(.+?)\s+(?:search\s*(?:karo|kro|pe|par)?|google\s*(?:karo|kro|pe|par)?|dhoondo|khojo)$/i);
    if (suffixSearch && suffixSearch[1] && suffixSearch[1].trim().length > 1) {
      const q = suffixSearch[1].trim();
      return { id: `call_${Date.now()}`, name: 'web_search', arguments: { query: q, limit: 5 } };
    }

    // Handle prefix searches like "search elon musk", "google weather"
    const prefixSearch = userText.match(/^(?:search|google|dhoondo|khojo)\s+(?:for\s+|about\s+|pe\s+)?(.+)/i);
    if (prefixSearch && prefixSearch[1] && prefixSearch[1].trim().length > 1) {
      const q = prefixSearch[1].replace(/(?:pe|karo|kro|batao|please)/gi, '').trim();
      if (q.length > 1) {
        return { id: `call_${Date.now()}`, name: 'web_search', arguments: { query: q, limit: 5 } };
      }
    }

    // Handle questions like "who is elon musk", "what is quantum computing", "taj mahal kahan hai"
    if (
      text.startsWith('who is') ||
      text.startsWith('what is') ||
      text.startsWith('where is') ||
      text.startsWith('how to') ||
      text.startsWith('why is') ||
      text.includes('kaun hai') ||
      text.includes('kya hai') ||
      text.includes('kahan hai') ||
      text.includes('kaise kare') ||
      text.includes('ke baare me batao')
    ) {
      const cleanQ = userText
        .replace(/(?:search for|search karo|search kro|search|google pe|google par|google karo|google kro|google|dhoondo|khojo|batao|karo|kro|please|who is|what is|where is|how to|why is|kaun hai|kya hai|kahan hai|kaise kare|ke baare me batao)/gi, '')
        .trim();
      const finalQ = cleanQ.length > 1 ? cleanQ : userText;
      return { id: `call_${Date.now()}`, name: 'web_search', arguments: { query: finalQ, limit: 5 } };
    }

    // 17. Memory Save Trigger
    if (text.includes('yaad rakhna') || text.includes('remember that') || text.includes('save memory')) {
      const cleanContent = userText.replace(/(?:yaad rakhna|remember that|save memory|ki|that)/gi, '').trim();
      return {
        id: `call_${Date.now()}`,
        name: 'memory_save',
        arguments: {
          key: `note_${Date.now().toString().slice(-4)}`,
          content: cleanContent || userText,
          category: 'preference',
        },
      };
    }

    // 18. Memory Recall Trigger
    if (
      text.includes('kya yaad h') ||
      text.includes('what do you remember') ||
      text.includes('meri preferences') ||
      text.includes('mere baare me')
    ) {
      return { id: `call_${Date.now()}`, name: 'memory_recall', arguments: { key: 'favorite_framework' } };
    }

    // 19. AI Image Generation (Hindi + English)
    if (
      text.includes('generate image') ||
      text.includes('create image') ||
      text.includes('photo banao') ||
      text.includes('image banao') ||
      text.includes('tasveer banao') ||
      text.includes('image generate') ||
      text.includes('picture of') ||
      text.includes('photo chahiye') ||
      text.includes('image chahiye') ||
      text.includes('wallpaper') ||
      text.includes('draw ')
    ) {
      const prompt = userText
        .replace(/(?:generate image of|generate image|create image of|create image|photo banao|image banao|tasveer banao|image generate karo|photo chahiye|image chahiye|picture of|draw)/gi, '')
        .trim() || 'Futuristic AI neural orb with glowing cyan neon lights';
      return { id: `call_${Date.now()}`, name: 'generate_image', arguments: { prompt, style: 'cyberpunk', aspectRatio: '1:1' } };
    }

    // 20. AI Code Generation & IDE Auto-Launch (Python, JS, TS, HTML, Fibonacci, Algorithms, etc.)
    if (
      text.includes('write code') ||
      text.includes('generate code') ||
      text.includes('code likho') ||
      text.includes('code banao') ||
      text.includes('script banao') ||
      text.includes('python code') ||
      text.includes('python script') ||
      text.includes('program banao') ||
      text.includes('fibonacci') ||
      text.includes('algorithm') ||
      text.includes('bubble sort') ||
      text.includes('vscode me code') ||
      text.includes('code karo')
    ) {
      const prompt = userText
        .replace(/(?:write code for|write code|generate code for|generate code|code likho|code banao|create script for|script banao|program banao)/gi, '')
        .trim() || 'Fibonacci sequence generator with performance benchmark and visualization';
      const lang = text.includes('python') ? 'python' : text.includes('javascript') ? 'javascript' : text.includes('html') ? 'html' : 'typescript';
      return { id: `call_${Date.now()}`, name: 'generate_code', arguments: { prompt, language: lang } };
    }

    // 21. AI Document Generation
    if (text.includes('generate report') || text.includes('create report') || text.includes('write document') || text.includes('report banao') || text.includes('generate document')) {
      const topic = userText.replace(/(?:generate report on|create report on|write document on|report banao|generate document)/gi, '').trim() || 'Executive Brief on Autonomous AI Agents';
      return { id: `call_${Date.now()}`, name: 'generate_document', arguments: { topic, format: 'markdown' } };
    }

    // 22. Send Email
    if (text.includes('send email') || text.includes('send mail') || text.includes('email bhejo') || text.includes('mail likho') || text.includes('email to')) {
      const parts = userText.match(/(?:to|ko)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[a-zA-Z\s]+)/i);
      const recipient = parts && parts[1] ? parts[1].trim() : 'harshit@niva.ai';
      return {
        id: `call_${Date.now()}`,
        name: 'send_email',
        arguments: {
          recipient,
          subject: 'Priority Update from NIVA Assistant',
          body: `Hello,\n\nThis is an automated dispatch from NIVA regarding: "${userText}".\n\nBest regards,\nNIVA Assistant`
        }
      };
    }

    // 23. Send WhatsApp / Telegram Message
    if (text.includes('whatsapp') || text.includes('telegram') || text.includes('send message') || text.includes('message bhejo') || text.includes('sandesh bhejo')) {
      const channel = text.includes('telegram') ? 'telegram' : 'whatsapp';
      return {
        id: `call_${Date.now()}`,
        name: 'send_message',
        arguments: {
          channel,
          recipient: channel === 'whatsapp' ? '+91 98765 43210' : '@harshit_sharma',
          message: userText
        }
      };
    }

    // 24. Live Real-Time News Feed
    if (
      text.includes('taaza khabar') ||
      text.includes('breaking news') ||
      text.includes('latest news') ||
      text.includes('news feed') ||
      text.includes('aaj ki khabar') ||
      text.includes('headlines') ||
      text.includes('live news')
    ) {
      const topic = userText
        .replace(/(?:taaza khabar|breaking news on|breaking news|latest news on|latest news about|latest news|news feed|aaj ki khabar|headlines|live news|news|batao|dikhao|please)/gi, '')
        .trim();
      return {
        id: `call_${Date.now()}`,
        name: 'fetch_news',
        arguments: {
          topic: topic || 'Trending',
          limit: 5
        }
      };
    }

    // 25. Webpage Reader / Article Extractor
    const urlMatch = userText.match(/https?:\/\/[^\s]+/i);
    if (urlMatch && (text.includes('read') || text.includes('browse') || text.includes('summarize') || text.includes('padho') || text.includes('article') || text.includes('dekho') || text.includes('link'))) {
      return {
        id: `call_${Date.now()}`,
        name: 'browse_webpage',
        arguments: {
          url: urlMatch[0]
        }
      };
    }

    // 26. Live Web Search & Knowledge Retrieval
    if (
      text.includes('web search') ||
      text.includes('search web') ||
      text.includes('search internet') ||
      text.includes('internet search') ||
      text.includes('internet pe search') ||
      text.includes('live search') ||
      text.startsWith('search for')
    ) {
      const q = userText
        .replace(/(?:web search for|web search|search web for|search web|search internet for|search internet|internet search for|internet search|internet pe search karo|live search for|live search|search for)/gi, '')
        .trim();
      return {
        id: `call_${Date.now()}`,
        name: 'web_search',
        arguments: {
          query: q || userText,
          limit: 5
        }
      };
    }

    // 27. Autonomous Morning Briefing / Workflow Execution
    if (
      text.includes('morning briefing') ||
      text.includes('briefing run karo') ||
      text.includes('daily briefing') ||
      text.includes('run workflow') ||
      text.includes('workflow run') ||
      text.includes('workflow chalao') ||
      text.includes('workflow start')
    ) {
      const name = text.includes('briefing')
        ? 'Morning Intelligence Briefing'
        : userText.replace(/(?:run workflow|workflow run karo|workflow run|workflow chalao|workflow start karo|workflow)/gi, '').trim() || 'Morning Intelligence Briefing';
      return {
        id: `call_${Date.now()}`,
        name: 'run_workflow',
        arguments: { workflow_name: name }
      };
    }

    // 28. List Workflows / Automations
    if (
      text.includes('list workflow') ||
      text.includes('workflows dikhao') ||
      text.includes('automations dikhao') ||
      text.includes('active workflows') ||
      text.includes('scheduled tasks')
    ) {
      return {
        id: `call_${Date.now()}`,
        name: 'list_workflows',
        arguments: {}
      };
    }

    // 29. Plugins & Marketplace
    if (
      text.includes('list plugin') ||
      text.includes('plugins dikhao') ||
      text.includes('plugins list') ||
      text.includes('show plugins') ||
      text.includes('available plugins') ||
      text.includes('plugin marketplace') ||
      text.includes('extensions dikhao')
    ) {
      return {
        id: `call_${Date.now()}`,
        name: 'list_plugins',
        arguments: {}
      };
    }

    if (
      text.includes('enable plugin') ||
      text.includes('disable plugin') ||
      text.includes('plugin on karo') ||
      text.includes('plugin band karo') ||
      text.includes('plugin enable') ||
      text.includes('plugin disable')
    ) {
      const isEnable = !text.includes('disable') && !text.includes('band');
      const pluginName = text
        .replace(/(?:enable plugin|disable plugin|plugin on karo|plugin band karo|plugin enable|plugin disable|plugin)/gi, '')
        .trim();
      return {
        id: `call_${Date.now()}`,
        name: 'toggle_plugin',
        arguments: {
          plugin_id: pluginName || 'github',
          enable: isEnable
        }
      };
    }

    // 30. Multi-Agent Squad & Collaborative Missions (Phase 14)
    if (
      text.includes('list agent') ||
      text.includes('agents dikhao') ||
      text.includes('agent roles') ||
      text.includes('show agents') ||
      text.includes('squad roles') ||
      text.includes('team dikhao')
    ) {
      return {
        id: `call_${Date.now()}`,
        name: 'list_agents',
        arguments: {},
      };
    }

    if (
      text.includes('multi agent') ||
      text.includes('multi-agent') ||
      text.includes('agent squad') ||
      text.includes('squad se') ||
      text.includes('agents se') ||
      text.includes('orchestrate') ||
      text.includes('team assemble') ||
      text.includes('collaborative mission')
    ) {
      const cleanGoal = userText
        .replace(/(?:multi agent se karwao|multi agent mission|multi agent|multi-agent|agent squad se|agent squad|squad se karwao|squad se|agents se karwao|agents se|orchestrate karo|orchestrate|team assemble karo|team assemble|collaborative mission)/gi, '')
        .trim() || userText;
      return {
        id: `call_${Date.now()}`,
        name: 'orchestrate_mission',
        arguments: { goal: cleanGoal },
      };
    }

    // 31. GitHub Intelligence Plugin Tools
    if (text.includes('github trending') || text.includes('trending repos') || text.includes('trending repositories')) {
      return {
        id: `call_${Date.now()}`,
        name: 'github_trending',
        arguments: { limit: 3 }
      };
    }
    if (text.includes('github repo') || text.includes('github repository')) {
      const match = text.match(/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/);
      if (match) {
        return {
          id: `call_${Date.now()}`,
          name: 'github_repo_info',
          arguments: { owner: match[1], repo: match[2] }
        };
      }
      return {
        id: `call_${Date.now()}`,
        name: 'github_trending',
        arguments: { limit: 3 }
      };
    }

    // 31. Crypto & Currency Tracker Plugin Tools
    if (
      text.includes('crypto') ||
      text.includes('bitcoin') ||
      text.includes('btc') ||
      text.includes('ethereum') ||
      text.includes('solana')
    ) {
      return {
        id: `call_${Date.now()}`,
        name: 'crypto_price_tracker',
        arguments: { coins: 'bitcoin,ethereum,solana', vs_currency: 'usd' }
      };
    }

    // 32. Windows Media Controller Plugin Tools
    if (
      text.includes('play music') ||
      text.includes('pause music') ||
      text.includes('next track') ||
      text.includes('next song') ||
      text.includes('media play') ||
      text.includes('media pause')
    ) {
      const action = text.includes('next') ? 'next' : 'play_pause';
      return {
        id: `call_${Date.now()}`,
        name: 'media_player_control',
        arguments: { action }
      };
    }

    // 33. DevOps & Deployment Health Status (Phase 15)
    if (
      text.includes('devops') ||
      text.includes('deployment status') ||
      text.includes('server status') ||
      text.includes('docker status') ||
      text.includes('infrastructure status') ||
      text.includes('server health') ||
      text.includes('system health') ||
      text.includes('health check') ||
      text.includes('database status') ||
      text.includes('redis status')
    ) {
      return {
        id: `call_${Date.now()}`,
        name: 'devops_status',
        arguments: {}
      };
    }

    // 34. Database Backup Snapshot (Phase 15)
    if (
      text.includes('backup database') ||
      text.includes('database backup') ||
      text.includes('db backup') ||
      text.includes('backup le lo') ||
      text.includes('backup karo') ||
      text.includes('take backup') ||
      text.includes('create backup') ||
      text.includes('backup lo')
    ) {
      return {
        id: `call_${Date.now()}`,
        name: 'db_backup',
        arguments: {}
      };
    }

    // 35. Action words fallback (If user said "kholo", "khol de", "khol do", "open", "chalao", "launch", "start")
    const hasOpenAction =
      text.includes('kholo') ||
      text.includes('khol de') ||
      text.includes('khol do') ||
      text.includes('kholna') ||
      text.includes('open ') ||
      text.startsWith('open') ||
      text.includes('launch') ||
      text.includes('chalao') ||
      text.includes('chala do') ||
      text.includes('chala de');

    if (hasOpenAction) {
      if (text.includes('calendar') || text.includes('calender') || text.includes('cal')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'calendar' } };
      }
      if (text.includes('code') || text.includes('ide') || text.includes('vscode')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'vscode' } };
      }
      if (text.includes('note') || text.includes('pad')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'notepad' } };
      }
      if (text.includes('calc') || text.includes('calculator') || text.includes('hisaab')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'calculator' } };
      }
      if (text.includes('net') || text.includes('web') || text.includes('chrome') || text.includes('google')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'chrome' } };
      }
      if (text.includes('edge')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'edge' } };
      }
      if (text.includes('spotify') || text.includes('music') || text.includes('gaana')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'spotify' } };
      }
      if (text.includes('whatsapp')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'whatsapp' } };
      }
      if (text.includes('telegram')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'telegram' } };
      }
      if (text.includes('discord')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'discord' } };
      }
      if (text.includes('terminal') || text.includes('cmd') || text.includes('powershell')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: 'terminal' } };
      }
      // General app extraction fallback
      const cleanTarget = text
        .replace(/(?:open|kholo|khol de|khol do|kholna|launch|start|chalao|chala de|chala do|app|application|please|bhi|ko|pe|mera|meri)/gi, '')
        .trim();
      if (cleanTarget.length > 1 && !cleanTarget.includes(' ')) {
        return { id: `call_${Date.now()}`, name: 'system_open_app', arguments: { app_name: cleanTarget } };
      }
    }

    return null;
  }

  private generateConversationalReply(userText: string): string {
    const text = userText.toLowerCase().trim();

    // Greetings
    if (
      text.includes('hello') ||
      text.includes('hi') ||
      text.includes('hey') ||
      text.includes('namaste') ||
      text.includes('suno')
    ) {
      return "Hello! Main NIVA hoon — aapka Neural Intelligent Virtual Assistant. Main aapke laptop aur web par active hoon. Main aapke voice commands sun sakta hoon, apps open kar sakta hoon, system check kar sakta hoon, aur aapki files manage kar sakta hoon. Kahiye, main aapki kya madad karoon?";
    }

    // Voice Gender Switch Acknowledgements
    if (
      text.includes('female voice') ||
      text.includes('female aawaz') ||
      text.includes('ladki ki aawaz') ||
      text.includes('voice female') ||
      text.includes('switch to female')
    ) {
      return "Maine voice ko **Female Voice** par switch kar diya hai! Ab se main is aawaz me baat karungi. Kahiye, main aapki kya madad kar sakti hoon?";
    }

    if (
      text.includes('male voice') ||
      text.includes('male aawaz') ||
      text.includes('ladke ki aawaz') ||
      text.includes('voice male') ||
      text.includes('switch to male')
    ) {
      return "Maine voice ko **Male Voice** par switch kar diya hai! Ab se main is aawaz me baat karunga. Kahiye, main aapki kya madad kar sakta hoon?";
    }

    // Well-being / How are you
    if (
      text.includes('kaise ho') ||
      text.includes('how are you') ||
      text.includes('kya haal') ||
      text.includes('sab theek')
    ) {
      return "Main bilkul badhiya aur energetic hoon! Sabhi neural sub-systems, memory engine, aur laptop controls smoothly run ho rahe hain. Aap batayein, aaj kis project par kaam karna hai?";
    }

    // Identity / Persona (Masculine)
    if (
      text.includes('who are you') ||
      text.includes('tum kaun ho') ||
      text.includes('kya ho') ||
      text.includes('about yourself')
    ) {
      return "Main **NIVA** (Neural Intelligent Virtual Assistant) hoon. Main ek high-tech multimodal AI assistant hoon jo Jarvis ki tarah real-time laptop system control, neural voice speech, biometric face security, hand gesture recognition, aur semantic memory ke sath operate karta hoon.";
    }

    // Capabilities (Masculine)
    if (
      text.includes('capabilities') ||
      text.includes('kya kar sakte') ||
      text.includes('features') ||
      text.includes('kya kaam')
    ) {
      return `Main aapke laptop par ye sab kar sakta hoon:
1. 🎙️ **Voice Commands**: Bol kar koi bhi command dijiye aur main execute karunga.
2. 💻 **Computer Control**: Notepad, Calculator, Chrome, VS Code kholna, System info & battery check karna.
3. 📸 **Screen Capture**: Laptop screen ka instant screenshot lena.
4. 🧠 **Long-Term Memory**: Pinned memories aur document RAG se facts yaad rakhna.
5. 🛡️ **Biometric Security**: Face ID verification aur written PIN security gateway.`;
    }

    // Good / Thanks
    if (
      text.includes('thank') ||
      text.includes('shukriya') ||
      text.includes('great') ||
      text.includes('shabash') ||
      text.includes('good job')
    ) {
      return "Aapka bahut-bahut shukriya! Mujhe aapki help karke bahut khushi hui. Jab bhi koi zaroorat ho, bas NIVA ko aawaz dijiye!";
    }

    // Default conversational reply (Masculine)
    return `Maine aapka instruction samajh liya hai: "${userText}". Main aapki command par instant action lene ke liye fully ready hoon. Aap bol sakte hain "notepad kholo", "system info dikhao", "calculator chalao", ya "screenshot lo", aur main turant execute kar dunga!`;
  }

  async generate(messages: AIMessage[], options?: AIGenerateOptions): Promise<AIResponse> {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const toolCall = this.detectToolCall(lastUserMsg);

    if (toolCall) {
      return {
        content: `Action initiated on laptop: ${toolCall.name}`,
        finishReason: 'tool_calls',
        toolCalls: [toolCall],
        model: 'niva-local-fallback',
      };
    }

    return {
      content: this.generateConversationalReply(lastUserMsg),
      finishReason: 'stop',
      model: 'niva-local-fallback',
    };
  }

  async *stream(messages: AIMessage[], options?: AIGenerateOptions): AsyncGenerator<AIStreamChunk, void, unknown> {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const toolCall = this.detectToolCall(lastUserMsg);

    if (toolCall) {
      yield { type: 'tool_call', toolCall };
      yield { type: 'done' };
      return;
    }

    const reply = this.generateConversationalReply(lastUserMsg);
    // Stream reply in words for natural typing effect
    const words = reply.split(' ');
    for (const word of words) {
      yield { type: 'text', content: word + ' ' };
      await new Promise((r) => setTimeout(r, 18)); // natural human cadence
    }

    yield { type: 'done' };
  }

  async listModels(): Promise<string[]> {
    return ['niva-local-fallback'];
  }
}
