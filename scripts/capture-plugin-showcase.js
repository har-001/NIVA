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
  console.log('🚀 Starting Phase 13 Plugin Hub Showcase Capture...');

  // 1. Authenticate with backend to get token
  console.log('1️⃣ Logging in to backend...');
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

  // 2. Launch Puppeteer with installed Chrome
  console.log('2️⃣ Launching Chrome headless...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();

  // Pre-seed localStorage before navigation
  await page.goto(CLIENT_BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((jwt, userData) => {
    localStorage.setItem('niva_token', jwt);
    localStorage.setItem('niva_user', JSON.stringify(userData));
    sessionStorage.setItem('niva_face_auth_done', 'true');
  }, token, user);

  console.log('3️⃣ Navigating to ChatPage...');
  await page.goto(CLIENT_BASE, { waitUntil: 'networkidle2' });
  await sleep(2000);

  // Take Screenshot 1: Header with 🧩 Plugin Hub button
  console.log('4️⃣ Capturing 18_header_plugin_button.png...');
  const snap1Path = path.join(SHOWCASE_DIR, '18_header_plugin_button.png');
  await page.screenshot({ path: snap1Path, fullPage: false });
  console.log('   ✅ Saved:', snap1Path);

  console.log('   Current URL:', page.url());
  const buttonsInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.textContent?.trim(),
      title: b.getAttribute('title'),
      className: b.className
    }));
  });
  console.log('   Buttons on page:', JSON.stringify(buttonsInfo, null, 2));

  // Click on the 🧩 button
  console.log('5️⃣ Clicking on 🧩 Plugin Hub button...');
  const pluginBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => 
      b.getAttribute('title')?.includes('Plugin') || b.textContent?.includes('🧩')
    );
  });
  if (!pluginBtn || !(await pluginBtn.asElement())) {
    throw new Error('Plugin Hub header button not found! Page buttons were: ' + JSON.stringify(buttonsInfo));
  }
  await pluginBtn.click();
  await sleep(1500);

  // Take Screenshot 2: Plugin Hub Modal with 4 installed plugins
  console.log('6️⃣ Capturing 19_plugin_hub_marketplace.png...');
  const snap2Path = path.join(SHOWCASE_DIR, '19_plugin_hub_marketplace.png');
  await page.screenshot({ path: snap2Path, fullPage: false });
  console.log('   ✅ Saved:', snap2Path);

  // Click on "▶ Test Tool" for Crypto & Currency Tracker
  console.log('7️⃣ Opening Tool Tester for Crypto plugin...');
  const testToolButtons = await page.$$('button');
  let testBtn = null;
  for (const btn of testToolButtons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Test Tool')) {
      testBtn = btn;
      break;
    }
  }
  if (testBtn) {
    await testBtn.click();
    await sleep(1000);

    console.log('8️⃣ Capturing 20_plugin_tool_tester.png...');
    const snap3Path = path.join(SHOWCASE_DIR, '20_plugin_tool_tester.png');
    await page.screenshot({ path: snap3Path, fullPage: false });
    console.log('   ✅ Saved:', snap3Path);
  } else {
    console.warn('   ⚠️ Could not find Test Tool button');
  }

  // Close the Plugin Hub modal
  console.log('9️⃣ Closing Plugin Hub modal...');
  const closeBtn = await page.$('button[title="Close"]');
  if (closeBtn) {
    await closeBtn.click();
    await sleep(800);
  }

  // Type in chat: "plugins dikhao"
  console.log('🔟 Sending chat prompt: "plugins dikhao"...');
  const chatInput = await page.$('textarea');
  if (chatInput) {
    await chatInput.type('plugins dikhao', { delay: 50 });
    await sleep(300);

    // Click send button
    const sendBtn = await page.$('button[type="button"].chatInput_sendBtn, button:has(svg path[d*="M3 10l14-7"])');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }

    console.log('   ⏳ Waiting for NIVA response...');
    await sleep(4000);

    console.log('1️⃣1️⃣ Capturing 21_chat_plugins_list.png...');
    const snap4Path = path.join(SHOWCASE_DIR, '21_chat_plugins_list.png');
    await page.screenshot({ path: snap4Path, fullPage: false });
    console.log('   ✅ Saved:', snap4Path);
  } else {
    console.warn('   ⚠️ Could not find chat textarea');
  }

  await browser.close();
  console.log('\n🎉 All Phase 13 Plugin Hub Showcase Screenshots Captured Successfully!');
}

main().catch((err) => {
  console.error('❌ Error capturing showcase:', err);
  process.exit(1);
});
