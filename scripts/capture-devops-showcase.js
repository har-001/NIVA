const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3001/api/v1';
const CLIENT_BASE = 'http://localhost:3002';
const SHOWCASE_DIR = path.join(__dirname, '..', 'social_media_showcase');
const ARTIFACT_DIR = 'C:\\Users\\harsh_2pgm3oe\\.gemini\\antigravity-ide\\brain\\32b8be2f-bf5d-42cd-9cd9-03d043267b4c';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting Phase 15 Production Deployment & In-Chat DevOps Showcase Capture...');

  if (!fs.existsSync(SHOWCASE_DIR)) {
    fs.mkdirSync(SHOWCASE_DIR, { recursive: true });
  }

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

  page.on('console', msg => console.log('   [PAGE LOG]:', msg.text()));
  page.on('pageerror', err => console.log('   [PAGE ERROR]:', err.message));

  // Pre-seed storage
  await page.goto(CLIENT_BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate((jwt, userData) => {
    localStorage.setItem('niva_token', jwt);
    localStorage.setItem('niva_user', JSON.stringify(userData));
    sessionStorage.setItem('niva_face_auth_done', 'true');
  }, token, user);

  console.log('3️⃣ Navigating to ChatPage...');
  await page.goto(CLIENT_BASE, { waitUntil: 'networkidle2' });
  await sleep(1500);

  // If on login page, fill form and sign in
  const emailInput = await page.$('#auth-email');
  if (emailInput) {
    console.log('   Form login required: filling credentials...');
    await page.type('#auth-email', 'harsh');
    await page.type('#auth-password', 'Password123!');
    await page.click('button[type="submit"]');
    await sleep(2500);
  }

  // Bypass face auth if present
  await page.evaluate(() => {
    sessionStorage.setItem('niva_face_auth_done', 'true');
  });

  // Ensure ChatPage textarea is ready
  await page.waitForSelector('textarea', { timeout: 15000 });
  await sleep(1500);

  // Capture Screenshot 1: Header bar with 🚀 button & Welcome screen with DevOps chips
  console.log('4️⃣ Capturing 26_header_devops_button.png...');
  const snap1Path = path.join(SHOWCASE_DIR, '26_header_devops_button.png');
  await page.screenshot({ path: snap1Path, fullPage: false });
  console.log('   ✅ Saved:', snap1Path);

  // Click the DevOps suggestion chip or type devops status
  console.log('5️⃣ Triggering DevOps Status in chat...');
  const devopsChip = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent && (b.textContent.includes('DevOps') || b.textContent.includes('Deployment'))
    );
  });

  const chipEl = await devopsChip.asElement();
  if (chipEl) {
    console.log('   Clicking "🚀 DevOps & Deployment Status" chip...');
    await chipEl.click();
  } else {
    console.log('   Typing "devops status" into textarea and clicking send...');
    await page.type('textarea', 'devops status');
    await page.evaluate(() => {
      const sendBtn = document.querySelector('button[class*="sendBtn"]');
      if (sendBtn) sendBtn.click();
    });
  }

  // Wait for NIVA response and DevOps card
  console.log('6️⃣ Waiting for In-Chat DevOps card to render...');
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('Production Infrastructure Health') || text.includes('PostgreSQL');
  }, { timeout: 20000 });
  await sleep(2500);

  // Capture Screenshot 2: In-Chat DevOps Status Card
  console.log('7️⃣ Capturing 27_chat_devops_status_card.png...');
  const snap2Path = path.join(SHOWCASE_DIR, '27_chat_devops_status_card.png');
  await page.screenshot({ path: snap2Path, fullPage: false });
  console.log('   ✅ Saved:', snap2Path);

  // Trigger Database Backup via In-Card Button or Chat
  console.log('8️⃣ Triggering Database Backup...');
  const inCardBackupBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent && b.textContent.includes('Backup Database')
    );
  });

  const btnEl = await inCardBackupBtn.asElement();
  if (btnEl) {
    console.log('   Clicking "💾 Backup Database" inside the DevOps Card...');
    await btnEl.click();
    await sleep(2000);
  }

  // Send message in chat to get the verified snapshot card
  console.log('   Sending "database backup le lo" in chat...');
  await page.type('textarea', 'database backup le lo');
  await page.evaluate(() => {
    const sendBtn = document.querySelector('button[class*="sendBtn"]');
    if (sendBtn) sendBtn.click();
  });

  // Wait for Backup Completed card
  console.log('9️⃣ Waiting for In-Chat Backup Completed card to render...');
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('Database Snapshot Captured') || text.includes('SHA-256');
  }, { timeout: 20000 });
  await sleep(2500);

  // Capture Screenshot 3: In-Chat Backup Completed Card
  console.log('🔟 Capturing 28_chat_backup_completed.png...');
  const snap3Path = path.join(SHOWCASE_DIR, '28_chat_backup_completed.png');
  await page.screenshot({ path: snap3Path, fullPage: false });
  console.log('   ✅ Saved:', snap3Path);

  await browser.close();

  // Mirror to artifact directory
  try {
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(snap1Path, path.join(ARTIFACT_DIR, '26_header_devops_button.png'));
      fs.copyFileSync(snap2Path, path.join(ARTIFACT_DIR, '27_chat_devops_status_card.png'));
      fs.copyFileSync(snap3Path, path.join(ARTIFACT_DIR, '28_chat_backup_completed.png'));
      console.log('   ✅ Mirrored screenshots to Antigravity IDE artifact directory!');
    }
  } catch (e) {
    console.warn('   ⚠️ Artifact copy warning:', e.message);
  }

  console.log('\n🎉 All Phase 15 In-Chat DevOps Showcase Assets Captured Successfully!');
}

main().catch((err) => {
  console.error('Fatal showcase capture error:', err);
  process.exit(1);
});
