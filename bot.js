const { Telegraf } = require('telegraf');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AnonymizeUAPlugin = require('puppeteer-extra-plugin-anonymize-ua');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const { execSync } = require('child_process');

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUAPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const BOT_TOKEN = '8927511031:AAErc7Zgfkd0Pp9xHoyDxuqr98kpdZMCke8';
const bot = new Telegraf(BOT_TOKEN);

async function ensureBrowser() {
  try {
    console.log('🔄 Checking if Chrome is installed...');
    execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
    console.log('✅ Chrome download completed.');
  } catch (error) {
    console.log('⚠️ Chrome download triggered automatically.');
  }
}

bot.start((ctx) => {
  ctx.reply('🤖 Google Account Creator Bot ready!\nUse /create to start.');
});

bot.command('create', async (ctx) => {
  // 🟢 We reply IMMEDIATELY to keep the connection alive
  ctx.reply('⏳ Account creation started! This will take 2-5 minutes. Please wait...');
  
  // Run the heavy work in the background
  try {
    await ensureBrowser();
    const result = await createAccount();
    
    // Send the final result after everything is done
    await ctx.reply(`✅ ${result}`);
  } catch (err) {
    await ctx.reply(`❌ Error: ${err.message}`);
  }
});

async function createAccount() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();
  
  await page.setDefaultTimeout(0);
  await page.setDefaultNavigationTimeout(0);

  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('🌐 Loading Google signup page...');
  await page.goto('https://accounts.google.com/signup/v2/createaccount?flowName=GlifWebSignIn&flowEntry=SignUp', {
    waitUntil: 'domcontentloaded'
  });

  console.log('✅ Page structure loaded! Attempting to fill form...');

  // Step 1: Name
  await page.waitForSelector('input[name="firstName"]', { timeout: 30000 });
  await page.type('input[name="firstName"]', 'chuchajohn1123');
  await page.type('input[name="lastName"]', 'gmail');
  await page.click('#collectNameNext > div > button > span');

  // Step 2: Birthday & Gender
  await page.waitForSelector('input[name="day"]', { timeout: 30000 });
  await page.type('#day', '01');
  await page.type('#year', '1992');
  await page.evaluate(() => {
    document.querySelector('#month').selectedIndex = 1;
    document.querySelector('#month').dispatchEvent(new Event('change'));
    document.querySelector('#gender').selectedIndex = 2;
    document.querySelector('#gender').dispatchEvent(new Event('change'));
  });
  await page.click('#birthdaygenderNext > div > button > span');

  // Step 3: Purpose
  await page.waitForSelector('#selectionc2', { timeout: 30000 });
  await page.click('#selectionc2');
  await page.click('#next > div > button');

  // Step 4: Password
  await page.waitForSelector('#passwd', { timeout: 30000 });
  await page.type('#passwd', '6lxTczLPhtA');
  await page.type('#confirm-passwd', '6lxTczLPhtA');
  await page.click('#createpasswordNext > div > button');

  console.log('Skipping phone verification for now...');

  if (page.url().includes('recaptcha')) {
    console.log('⚠️ CAPTCHA detected - Skipping for now');
  }

  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  const url = page.url();
  await browser.close();

  return url.includes('inbox') ? 'Account created successfully!' : `Partial success. URL: ${url}`;
}

bot.launch();
console.log('🤖 Bot is running...');
