// k6/login_and_save_cookie.js
require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;

  console.log('🔎 DEBUG EMAIL:', email, '| length:', email ? email.length : 0);
  console.log('🔎 DEBUG PASSWORD length:', password ? password.length : 0);

  if (!email || !password) {
    console.error('❌ В .env should be EMAIL и PASSWORD (one of the fields is empty)');
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('🌐 Open CRM (/)...');
    await page.goto('https://admin.fundingpips.dev/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    console.log('⌛ Wait FP CRM...');
    await page.getByText('FP CRM').waitFor({ state: 'visible', timeout: 30000 });

    console.log('⌨️ Enter login/password...');
    await page.fill('#email', email);
    await page.fill('#password', password);

    await page.waitForTimeout(1000);

    console.log('👉 Wait the button Login...');
    await page.click('button:has-text("Login")');

    console.log('⌛ Wait for button with username...');
    await page
      .getByRole('button', { name: email })
      .waitFor({ state: 'visible', timeout: 30000 });

    console.log('✅ Login succesfull, take cookies...');

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name.startsWith('_fundingpips_'));

    if (!sessionCookie) {
      console.error('❌ Not found session-cookie, starting with "_fundingpips_"');
      console.log('All cookies:', cookies);
      await browser.close();
      process.exit(1);
    }

    const cookieString = `${sessionCookie.name}=${sessionCookie.value}`;
    console.log('🍪 Found session cookie:', sessionCookie.name);

    const outPath = './k6/k6_cookie.txt';
    fs.writeFileSync(outPath, cookieString, 'utf8');
    console.log(`💾 Saved cookie at ${outPath}`);
  } catch (err) {
    console.error('❌ Error on login_and_save_cookie:', err);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
