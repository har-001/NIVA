const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001/api/v1';
const CLIENT_BASE = 'http://localhost:3002';
const SHOWCASE_DIR = path.join(__dirname, '..', 'social_media_showcase');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting Phase 14 Multi-Agent Squad Showcase Capture...');

  // 1. Authenticate with backend
  console.log('1️⃣ Authenticating with backend...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername: 'harsh', password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.data.token) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.data.token;
  const user = loginData.data.user;
  console.log('   ✅ Authenticated! Token acquired for user:', user.username);

  // 2. Launch Chrome
  console.log('2️⃣ Launching Chrome headless...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Pre-seed storage
  await page.goto(CLIENT_BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((jwt, userData) => {
    localStorage.setItem('niva_token', jwt);
    localStorage.setItem('niva_user', JSON.stringify(userData));
    sessionStorage.setItem('niva_face_auth_done', 'true');
  }, token, user);

  console.log('3️⃣ Navigating to ChatPage...');
  await page.goto(CLIENT_BASE, { waitUntil: 'networkidle2' });
  await sleep(2000);

  // Take Screenshot 1: Header with 🤖 button
  console.log('4️⃣ Capturing 22_header_agent_squad_button.png...');
  const snap1Path = path.join(SHOWCASE_DIR, '22_header_agent_squad_button.png');
  await page.screenshot({ path: snap1Path, fullPage: false });
  console.log('   ✅ Saved:', snap1Path);

  // Click on 🤖 Agent Squad button
  console.log('5️⃣ Clicking on 🤖 Agent Squad button...');
  const squadBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => 
      b.getAttribute('title')?.includes('Multi-Agent') || b.textContent?.includes('🤖')
    );
  });
  if (!squadBtn || !(await squadBtn.asElement())) {
    throw new Error('Agent Squad header button not found!');
  }
  await squadBtn.click();
  await sleep(1500);

  // Take Screenshot 2: Agent Squad Roster Grid (7 Agents)
  console.log('6️⃣ Capturing 23_agent_squad_grid.png...');
  const snap2Path = path.join(SHOWCASE_DIR, '23_agent_squad_grid.png');
  await page.screenshot({ path: snap2Path, fullPage: false });
  console.log('   ✅ Saved:', snap2Path);

  // Switch to Tab 2: Mission Control & Visual DAG
  console.log('7️⃣ Switching to Mission Pipeline DAG tab...');
  const missionTabBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('Mission Pipeline')
    );
  });
  if (missionTabBtn && (await missionTabBtn.asElement())) {
    await missionTabBtn.click();
    await sleep(1000);

    // Click Dispatch Multi-Agent Squad button
    console.log('   Executing sample mission...');
    const dispatchBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent?.includes('Dispatch Multi-Agent')
      );
    });
    if (dispatchBtn && (await dispatchBtn.asElement())) {
      await dispatchBtn.click();
      console.log('   ⏳ Waiting for mission DAG pipeline to complete...');
      await sleep(6000);
    }

    console.log('8️⃣ Capturing 24_mission_pipeline_visualizer.png...');
    const snap3Path = path.join(SHOWCASE_DIR, '24_mission_pipeline_visualizer.png');
    await page.screenshot({ path: snap3Path, fullPage: false });
    console.log('   ✅ Saved:', snap3Path);
  }

  // Close the Agent Squad Hub modal
  console.log('9️⃣ Closing Agent Squad Hub modal...');
  const closeBtn = await page.$('button[title="Close"]');
  if (closeBtn) {
    await closeBtn.click();
    await sleep(800);
  }

  // Type in chat: "multi agent squad se karwao"
  console.log('🔟 Sending chat prompt: "multi agent squad se karwao"...');
  const chatInput = await page.$('textarea');
  if (chatInput) {
    await chatInput.type('multi agent squad se research and code create karwao', { delay: 40 });
    await sleep(300);

    // Submit
    const sendBtn = await page.$('button[type="button"].chatInput_sendBtn, button:has(svg path[d*="M3 10l14-7"])');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log('   ⏳ Waiting for Multi-Agent response...');
    await sleep(6500);

    console.log('1️⃣1️⃣ Capturing 25_chat_multi_agent_execution.png...');
    const snap4Path = path.join(SHOWCASE_DIR, '25_chat_multi_agent_execution.png');
    await page.screenshot({ path: snap4Path, fullPage: false });
    console.log('   ✅ Saved:', snap4Path);
  }

  await browser.close();
  console.log('\n🎉 All Phase 14 Multi-Agent Showcase Screenshots Captured Successfully!');
}

main().catch((err) => {
  console.error('❌ Error capturing showcase:', err);
  process.exit(1);
});
