// ============================================
// NIVA — Foundation E2E Test
// ============================================

import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:3001/api/v1';
const SOCKET_URL = 'http://localhost:3001';

async function runTests() {
  console.log('🧪 Starting NIVA Foundation E2E Tests...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  const healthRes = await fetch(`${API_BASE}/health`);
  const healthData = (await healthRes.json()) as any;
  if (healthData.success && healthData.data.status === 'healthy') {
    console.log('   ✅ Health check passed! Uptime:', healthData.data.uptime);
  } else {
    throw new Error('Health check failed: ' + JSON.stringify(healthData));
  }

  // Test 2: User Registration / Login
  console.log('\n2️⃣ Testing Authentication (Login)...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'harsh', password: 'Password123!' })
  });
  const loginData = (await loginRes.json()) as any;
  if (!loginData.success || !loginData.data.token) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.data.token;
  console.log('   ✅ Login passed! User:', loginData.data.user.username, '| Token issued');

  // Test 3: Authenticated /me endpoint
  console.log('\n3️⃣ Testing /auth/me with Bearer token...');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = (await meRes.json()) as any;
  if (!meData.success || meData.data.email !== 'test@niva.ai') {
    throw new Error('/auth/me failed: ' + JSON.stringify(meData));
  }
  console.log('   ✅ /auth/me passed! User email:', meData.data.email);

  // Test 4: Create Conversation
  console.log('\n4️⃣ Testing Conversation Creation...');
  const convRes = await fetch(`${API_BASE}/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ title: 'College Final Year Project Planning' })
  });
  const convData = (await convRes.json()) as any;
  if (!convData.success || !convData.data.id) {
    throw new Error('Conversation creation failed: ' + JSON.stringify(convData));
  }
  const conversationId = convData.data.id;
  console.log('   ✅ Conversation created! ID:', conversationId, '| Title:', convData.data.title);

  // Test 5: List Conversations
  console.log('\n5️⃣ Testing List Conversations...');
  const listRes = await fetch(`${API_BASE}/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = (await listRes.json()) as any;
  if (!listData.success || !Array.isArray(listData.data) || listData.data.length === 0) {
    throw new Error('List conversations failed: ' + JSON.stringify(listData));
  }
  console.log(`   ✅ List conversations passed! Found ${listData.data.length} conversation(s)`);

  // Test 6: Socket.IO Real-time messaging
  console.log('\n6️⃣ Testing Socket.IO Connection & Messaging...');
  await new Promise<void>((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      timeout: 5000,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket.IO test timed out after 5s'));
    }, 5000);

    socket.on('connect', () => {
      console.log('   🔌 Socket connected with auth token');

      // Send a test message
      socket.emit('chat:send', {
        conversationId,
        content: 'Hello NIVA, can you hear me?'
      });
    });

    let receivedUserMsg = false;
    let receivedAssistantMsg = false;

    socket.on('chat:message', (msg: any) => {
      console.log(`   📩 Received message [${msg.role}]: "${msg.content}"`);
      if (msg.role === 'user') receivedUserMsg = true;
      if (msg.role === 'assistant') receivedAssistantMsg = true;

      if (receivedUserMsg && receivedAssistantMsg) {
        clearTimeout(timeout);
        socket.disconnect();
        console.log('   ✅ Socket.IO real-time bi-directional messaging verified!');
        resolve();
      }
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error('Socket connect error: ' + err.message));
    });
  });

  console.log('\n🎉 ALL PHASE 01 FOUNDATION TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
