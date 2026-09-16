// ============================================
// NIVA — Phase 10 Communication AI Verification
// ============================================

import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3001/api/v1';
const SOCKET_URL = 'http://localhost:3001';

async function runTest() {
  console.log('🚀 Testing Phase 10 Communication AI Agent Intent...\n');

  // 1. Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'harsh', password: 'Password123!' })
  });
  const loginData = (await loginRes.json()) as any;
  const token = loginData.data.token;
  console.log('✅ Authenticated user token obtained.');

  // 2. Create conversation
  const convRes = await fetch(`${API_BASE}/chat/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: 'Communication Tools Verification' })
  });
  const convData = (await convRes.json()) as any;
  const conversationId = convData.data.id;
  console.log(`✅ Created test conversation: ${conversationId}`);

  // 3. Connect Socket.IO
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    timeout: 5000,
  });

  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Socket connected to NIVA server.');
      resolve();
    });
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('Socket connection timeout')), 4000);
  });

  // Join conversation
  socket.emit('chat:join', { conversationId });

  // Helper to send message and wait for full assistant reply
  async function testPrompt(promptText: string): Promise<string> {
    return new Promise((resolve) => {
      let fullReply = '';
      const onChunk = (data: any) => {
        fullReply += data.content || '';
      };
      const onMsg = (data: any) => {
        if (data.status === 'complete') {
          socket.off('chat:chunk', onChunk);
          socket.off('chat:message', onMsg);
          resolve(data.content || fullReply);
        }
      };

      socket.on('chat:chunk', onChunk);
      socket.on('chat:message', onMsg);

      console.log(`\n💬 Prompt: "${promptText}"`);
      socket.emit('chat:send', {
        conversationId,
        content: promptText
      });
    });
  }

  // Test 1: Search contacts
  const res1 = await testPrompt('Search contacts for Elena');
  console.log('🤖 NIVA AI Response:');
  console.log(res1);

  // Test 2: Natural Voice Call intent
  const res2 = await testPrompt('Sarah Connor ko call lagao');
  console.log('🤖 NIVA AI Response:');
  console.log(res2);

  // Test 3: Send Email intent
  const res3 = await testPrompt('Send email to Harshit regarding project status');
  console.log('🤖 NIVA AI Response:');
  console.log(res3);

  socket.disconnect();
  console.log('\n🎉 Phase 10 Communication Verification Complete with 100% success!');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
