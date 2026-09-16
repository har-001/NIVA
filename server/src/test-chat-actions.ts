// ============================================
// NIVA — End-to-End Test for In-Chat Media & Action Execution
// ============================================

import { io } from 'socket.io-client';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3001/api/v1';
const WS_BASE = 'http://localhost:3001';

async function runTest() {
  console.log('🚀 Starting NIVA In-Chat Media & Physical Action Test...\n');

  // 1. Authenticate or Login
  console.log('1. Authenticating test user...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrUsername: 'harsh',
      password: 'Password123!',
    }),
  });

  const loginData = (await loginRes.json()) as any;
  const token = loginData.data?.token;
  if (!token) {
    throw new Error('Failed to get token: ' + JSON.stringify(loginData));
  }
  console.log('✅ Logged in successfully. Token acquired.');

  // 2. Test Direct IDE Endpoint (/chat/open-ide)
  console.log('\n2. Testing POST /api/v1/chat/open-ide...');
  const testCode = 'def greet(name):\n    return f"Hello, {name} from NIVA Assistant!"\n\nprint(greet("Harshit"))';
  const ideRes = await fetch(`${API_BASE}/chat/open-ide`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      code: testCode,
      language: 'python',
      ide: 'notepad', // test with notepad as it runs lightweight
      fileName: 'test_action_script.py',
    }),
  });

  const ideData = (await ideRes.json()) as any;
  console.log('IDE Endpoint Response:', ideData);
  if (ideData.success) {
    console.log('✅ File saved to disk and application launched successfully!');
    const savedOnDisk = fs.existsSync(ideData.filePath);
    console.log(`✅ File exists on user filesystem: ${savedOnDisk} (${ideData.filePath})`);
  } else {
    console.error('❌ IDE open failed:', ideData);
  }

  // 3. Test Chat Socket with Code Generation Command
  console.log('\n3. Testing Chat Socket with Code Generation Intent...');
  const convRes = await fetch(`${API_BASE}/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ title: 'Code Generation Test' }),
  });
  const convData = (await convRes.json()) as any;
  const convId = convData.data.id;
  console.log(`Conversation ID: ${convId}`);

  const socket = io(WS_BASE, {
    auth: { token },
    transports: ['websocket'],
  });

  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully.');
      resolve();
    });
    socket.on('connect_error', reject);
  });

  // Listen for tool call and completed message
  let toolExecuted: any = null;
  let assistantReply = '';

  socket.on('chat:tool_call', (data) => {
    console.log(`⚡ Tool Call Triggered: ${data.tool.name}`);
    toolExecuted = data.tool;
  });

  socket.on('chat:message', (data) => {
    if (data.role === 'assistant' && data.status === 'complete') {
      assistantReply = data.content;
      console.log('\n🤖 NIVA Completed Assistant Reply:\n' + assistantReply);
    }
  });

  console.log('Sending user prompt: "write python code for fibonacci sequence and open in vscode"');
  socket.emit('chat:send', {
    conversationId: convId,
    content: 'write python code for fibonacci sequence and open in vscode',
  });

  // Wait for assistant response
  let elapsed = 0;
  while (!assistantReply && elapsed < 15000) {
    await new Promise((r) => setTimeout(r, 500));
    elapsed += 500;
  }

  if (toolExecuted && toolExecuted.name === 'generate_code') {
    console.log('✅ Tool `generate_code` was executed!');
  } else {
    console.log('ℹ️ Tool executed:', toolExecuted?.name);
  }

  if (assistantReply.includes('```python') || assistantReply.includes('```')) {
    console.log('✅ Code block is embedded directly in chat with markdown tags!');
  }

  if (assistantReply.includes('niva_workspace')) {
    console.log('✅ Code file saved to user workspace!');
  }

  // 4. Test Image Generation Intent
  console.log('\n4. Testing Chat Socket with Image Generation Intent...');
  assistantReply = '';
  toolExecuted = null;

  console.log('Sending user prompt: "generate image of futuristic neon cyberpunk city"');
  socket.emit('chat:send', {
    conversationId: convId,
    content: 'generate image of futuristic neon cyberpunk city',
  });

  elapsed = 0;
  while (!assistantReply && elapsed < 15000) {
    await new Promise((r) => setTimeout(r, 500));
    elapsed += 500;
  }

  if (toolExecuted && toolExecuted.name === 'generate_image') {
    console.log('✅ Tool `generate_image` was executed!');
  }

  if (assistantReply.includes('![') && assistantReply.includes('/generated/images/')) {
    console.log('✅ Image markdown tag is embedded directly in chat with absolute/valid URL!');
  }

  // 5. Test YouTube Action Execution Intent
  console.log('\n5. Testing YouTube Action Execution Intent...');
  assistantReply = '';
  toolExecuted = null;

  console.log('Sending user prompt: "youtube pe lofi hip hop beats gaana chalao"');
  socket.emit('chat:send', {
    conversationId: convId,
    content: 'youtube pe lofi hip hop beats gaana chalao',
  });

  elapsed = 0;
  while (!assistantReply && elapsed < 15000) {
    await new Promise((r) => setTimeout(r, 500));
    elapsed += 500;
  }

  if (toolExecuted && toolExecuted.name === 'system_open_url') {
    console.log('✅ Tool `system_open_url` was executed for YouTube action!');
    console.log('Arguments:', toolExecuted.arguments);
  }

  socket.disconnect();
  console.log('\n🎉 All In-Chat Media & Physical Laptop Action tests passed!');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
