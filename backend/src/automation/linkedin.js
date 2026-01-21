/**
 * LinkedIn Automation Module
 * Handles login and posting to LinkedIn
 */

const BaseBrowser = require('./base');

class LinkedInBrowser extends BaseBrowser {
    constructor() {
          super('linkedin');
          this.baseUrl = 'https://www.linkedin.com';
    }

  async isLoggedIn() {
        try {
                await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 3000);

          const signInButton = await this.page.$('a[href*="login"], .nav__button-secondary');
                const feedPage = await this.page.$('.feed-identity-module, .share-box-feed-entry');

          if (feedPage && !signInButton) {
                    console.log('[linkedin] Already logged in');
                    return true;
          }

          console.log('[linkedin] Not logged in');
                return false;
        } catch (error) {
                console.error('[linkedin] Error checking login status:', error.message);
                return false;
        }
  }

  async login(email, password) {
        try {
                console.log('[linkedin] Starting login process...');
                await this.page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 4000);

          const emailSelector = '#username';
                const passwordSelector = '#password';

          await this.waitForSelector(emailSelector, 15000);

          console.log('[linkedin] Entering email...');
                await this.humanType(emailSelector, email);
                await this.humanDelay(500, 1000);

          console.log('[linkedin] Entering password...');
                await this.humanType(passwordSelector, password);
                await this.humanDelay(500, 1000);

          console.log('[linkedin] Clicking login button...');
                await this.page.click('button[type="submit"]');

          await this.humanDelay(3000, 5000);

          const loggedIn = await this.isLoggedIn();
                if (loggedIn) {
                          console.log('[linkedin] Login successful!');
                          await this.saveCookies();
                          return true;
                } else {
                          console.log('[linkedin] Login may have failed');
                          await this.screenshot('login-result');
                          return false;
                }
        } catch (error) {
                console.error('[linkedin] Login error:', error.message);
                await this.screenshot('login-error');
                return false;
        }
  }

  async post(content) {
        try {
                const { text, imagePath } = content;

          console.log('[linkedin] Creating new post...');
                await this.page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 3000);

          // Click Start a post button
          const startPostSelector = '.share-box-feed-entry__trigger, button[aria-label*="Start a post"]';
                await this.waitForSelector(startPostSelector, 10000);
                await this.page.click(startPostSelector);
                await this.humanDelay(1500, 2500);

          // Enter post text
          const textAreaSelector = '.ql-editor, div[data-placeholder="What do you want to talk about?"]';
                await this.waitForSelector(textAreaSelector, 10000);

          console.log('[linkedin] Entering post text...');
                await this.page.click(textAreaSelector);
                await this.humanDelay(300, 500);
                await this.page.keyboard.type(text, { delay: 25 });
                await this.humanDelay(1000, 2000);

          // Handle image upload if provided
          if (imagePath) {
                    console.log('[linkedin] Uploading image...');
                    const imageButton = await this.page.$('button[aria-label*="Add a photo"]');
                    if (imageButton) {
                                await imageButton.click();
                                await this.humanDelay(500, 1000);
                                const fileInput = await this.page.$('input[type="file"]');
                                if (fileInput) {
                                              await fileInput.uploadFile(imagePath);
                                              await this.humanDelay(3000, 5000);
                                }
                    }
          }

          // Click Post button
          console.log('[linkedin] Publishing post...');
                const postButton = await this.page.$('button.share-actions__primary-action, button[aria-label*="Post"]');
                if (postButton) {
                          await postButton.click();
                }

          await this.humanDelay(3000, 5000);

          console.log('[linkedin] Post published successfully!');
                return { success: true, platform: 'linkedin' };
        } catch (error) {
                console.error('[linkedin] Post error:', error.message);
                await this.screenshot('post-error');
                return { success: false, error: error.message };
        }
  }
}

module.exports = LinkedInBrowser;
