/**
 * Twitter/X Automation Module
 * Handles login and posting to Twitter/X
 */

const BaseBrowser = require('./base');

class TwitterBrowser extends BaseBrowser {
    constructor() {
          super('twitter');
          this.baseUrl = 'https://twitter.com';
    }

  async isLoggedIn() {
        try {
                await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 3000);

          const loginButton = await this.page.$('a[href*="/login"], [data-testid="loginButton"]');
                const homeTimeline = await this.page.$('[data-testid="primaryColumn"], [aria-label="Home timeline"]');

          if (homeTimeline && !loginButton) {
                    console.log('[twitter] Already logged in');
                    return true;
          }

          console.log('[twitter] Not logged in');
                return false;
        } catch (error) {
                console.error('[twitter] Error checking login status:', error.message);
                return false;
        }
  }

  async login(username, password) {
        try {
                console.log('[twitter] Starting login process...');
                await this.page.goto('https://twitter.com/i/flow/login', { waitUntil: 'networkidle2' });
                await this.humanDelay(3000, 5000);

          // Enter username
          const usernameSelector = 'input[autocomplete="username"], input[name="text"]';
                await this.waitForSelector(usernameSelector, 15000);
                console.log('[twitter] Entering username...');
                await this.humanType(usernameSelector, username);
                await this.humanDelay(500, 1000);

          // Click Next
          const nextButton = await this.page.$('div[role="button"]:has-text("Next"), [data-testid*="next"]');
                if (nextButton) {
                          await nextButton.click();
                          await this.humanDelay(2000, 3000);
                }

          // Enter password
          const passwordSelector = 'input[name="password"], input[type="password"]';
                await this.waitForSelector(passwordSelector, 10000);
                console.log('[twitter] Entering password...');
                await this.humanType(passwordSelector, password);
                await this.humanDelay(500, 1000);

          // Click Login
          const loginButton = await this.page.$('[data-testid="LoginForm_Login_Button"], div[role="button"]:has-text("Log in")');
                if (loginButton) {
                          await loginButton.click();
                }

          await this.humanDelay(3000, 5000);

          const loggedIn = await this.isLoggedIn();
                if (loggedIn) {
                          console.log('[twitter] Login successful!');
                          await this.saveCookies();
                          return true;
                } else {
                          console.log('[twitter] Login may have failed');
                          await this.screenshot('login-result');
                          return false;
                }
        } catch (error) {
                console.error('[twitter] Login error:', error.message);
                await this.screenshot('login-error');
                return false;
        }
  }

  async post(content) {
        try {
                const { text, imagePath } = content;

          console.log('[twitter] Creating new tweet...');
                await this.page.goto('https://twitter.com/compose/tweet', { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 3000);

          // Find tweet compose box
          const tweetBoxSelector = '[data-testid="tweetTextarea_0"], div[role="textbox"]';
                await this.waitForSelector(tweetBoxSelector, 10000);

          console.log('[twitter] Entering tweet text...');
                await this.page.click(tweetBoxSelector);
                await this.humanDelay(300, 500);
                await this.page.keyboard.type(text, { delay: 30 });
                await this.humanDelay(1000, 2000);

          // Handle image upload if provided
          if (imagePath) {
                    console.log('[twitter] Uploading image...');
                    const fileInput = await this.page.$('input[type="file"][accept*="image"]');
                    if (fileInput) {
                                await fileInput.uploadFile(imagePath);
                                await this.humanDelay(2000, 4000);
                    }
          }

          // Click Tweet button
          console.log('[twitter] Posting tweet...');
                const tweetButton = await this.page.$('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
                if (tweetButton) {
                          await tweetButton.click();
                }

          await this.humanDelay(3000, 5000);

          console.log('[twitter] Tweet posted successfully!');
                return { success: true, platform: 'twitter' };
        } catch (error) {
                console.error('[twitter] Post error:', error.message);
                await this.screenshot('post-error');
                return { success: false, error: error.message };
        }
  }
}

module.exports = TwitterBrowser;
