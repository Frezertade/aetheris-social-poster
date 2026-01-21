/**
 * Base Browser Automation Class
 * Provides common functionality for all platform modules
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

class BaseBrowser {
    constructor(platformName) {
          this.platformName = platformName;
          this.browser = null;
          this.page = null;
          this.cookiesPath = path.join(__dirname, '../../data/cookies', `${platformName}.json`);
    }

  /**
     * Initialize browser with human-like settings
     */
  async init(headless = true) {
        console.log(`[${this.platformName}] Initializing browser...`);

      this.browser = await puppeteer.launch({
              headless: headless ? 'new' : false,
              args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-blink-features=AutomationControlled',
                        '--window-size=1920,1080'
                      ],
              defaultViewport: {
                        width: 1920,
                        height: 1080
              }
      });

      this.page = await this.browser.newPage();

      // Set a realistic user agent
      await this.page.setUserAgent(
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

      // Load cookies if they exist
      await this.loadCookies();

      return this;
  }

  /**
     * Save cookies to file for session persistence
     */
  async saveCookies() {
        try {
                const cookies = await this.page.cookies();
                const cookiesDir = path.dirname(this.cookiesPath);

          if (!fs.existsSync(cookiesDir)) {
                    fs.mkdirSync(cookiesDir, { recursive: true });
          }

          fs.writeFileSync(this.cookiesPath, JSON.stringify(cookies, null, 2));
                console.log(`[${this.platformName}] Cookies saved`);
        } catch (error) {
                console.error(`[${this.platformName}] Error saving cookies:`, error.message);
        }
  }

  /**
     * Load cookies from file
     */
  async loadCookies() {
        try {
                if (fs.existsSync(this.cookiesPath)) {
                          const cookies = JSON.parse(fs.readFileSync(this.cookiesPath, 'utf8'));
                          await this.page.setCookie(...cookies);
                          console.log(`[${this.platformName}] Cookies loaded`);
                          return true;
                }
        } catch (error) {
                console.error(`[${this.platformName}] Error loading cookies:`, error.message);
        }
        return false;
  }

  /**
     * Human-like delay between actions
     */
  async humanDelay(min = 1000, max = 3000) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
     * Type text with human-like speed variations
     */
  async humanType(selector, text) {
        await this.page.click(selector);
        await this.humanDelay(200, 500);

      for (const char of text) {
              await this.page.type(selector, char, {
                        delay: Math.floor(Math.random() * 100) + 30
              });
      }
  }

  /**
     * Wait for selector with timeout
     */
  async waitForSelector(selector, timeout = 10000) {
        try {
                await this.page.waitForSelector(selector, { timeout });
                return true;
        } catch (error) {
                console.log(`[${this.platformName}] Selector not found: ${selector}`);
                return false;
        }
  }

  /**
     * Take a screenshot for debugging
     */
  async screenshot(name = 'debug') {
        const screenshotPath = path.join(__dirname, '../../data', `${this.platformName}-${name}-${Date.now()}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[${this.platformName}] Screenshot saved: ${screenshotPath}`);
        return screenshotPath;
  }

  /**
     * Check if currently logged in (to be overridden by subclasses)
     */
  async isLoggedIn() {
        throw new Error('isLoggedIn() must be implemented by subclass');
  }

  /**
     * Login to platform (to be overridden by subclasses)
     */
  async login(credentials) {
        throw new Error('login() must be implemented by subclass');
  }

  /**
     * Post content (to be overridden by subclasses)
     */
  async post(content) {
        throw new Error('post() must be implemented by subclass');
  }

  /**
     * Close browser
     */
  async close() {
        if (this.browser) {
                await this.browser.close();
                console.log(`[${this.platformName}] Browser closed`);
        }
  }
}

module.exports = BaseBrowser;
