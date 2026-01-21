/**
 * Facebook Automation Module
 * Handles login and posting to Facebook
 */

const BaseBrowser = require('./base');

class FacebookBrowser extends BaseBrowser {
    constructor() {
          super('facebook');
          this.baseUrl = 'https://www.facebook.com';
    }

  async isLoggedIn() {
        try {
                await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 3000);

          const loginForm = await this.page.$('form[data-testid="royal_login_form"], #login_form');
                const userNav = await this.page.$('[aria-label="Your profile"], [data-pagelet="NavAccountNav"]');

          if (userNav && !loginForm) {
                    console.log('[facebook] Already logged in');
                    return true;
          }

          console.log('[facebook] Not logged in');
                return false;
        } catch (error) {
                console.error('[facebook] Error checking login status:', error.message);
                return false;
        }
  }

  async login(email, password) {
        try {
                console.log('[facebook] Starting login process...');
                await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 4000);

          const emailSelector = '#email';
                const passwordSelector = '#pass';

          await this.waitForSelector(emailSelector, 15000);

          console.log('[facebook] Entering email...');
                await this.humanType(emailSelector, email);
                await this.humanDelay(500, 1000);

          console.log('[facebook] Entering password...');
                await this.humanType(passwordSelector, password);
                await this.humanDelay(500, 1000);

          console.log('[facebook] Clicking login button...');
                await this.page.click('button[name="login"], button[type="submit"]');

          await this.humanDelay(3000, 5000);

          const loggedIn = await this.isLoggedIn();
                if (loggedIn) {
                          console.log('[facebook] Login successful!');
                          await this.saveCookies();
                          return true;
                } else {
                          console.log('[facebook] Login may have failed');
                          await this.screenshot('login-result');
                          return false;
                }
        } catch (error) {
                console.error('[facebook] Login error:', error.message);
                await this.screenshot('login-error');
                return false;
        }
  }

  async post(content) {
        try {
                const { text, imagePath, pageId } = content;

          console.log('[facebook] Creating new post...');

          // Navigate to the page or profile
          const targetUrl = pageId 
            ? `${this.baseUrl}/${pageId}` 
                    : this.baseUrl;

          await this.page.goto(targetUrl, { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 3000);

          // Click on "What's on your mind" or create post button
          const createPostSelectors = [
                    '[aria-label="Create a post"]',
                    'div[role="button"]:has-text("What\'s on your mind")',
                    '[data-pagelet="FeedComposer"]'
                  ];

          for (const selector of createPostSelectors) {
                    const element = await this.page.$(selector);
                    if (element) {
                                await element.click();
                                break;
                    }
          }

          await this.humanDelay(1500, 2500);

          // Enter post text
          const textAreaSelector = 'div[contenteditable="true"][role="textbox"]';
                await this.waitForSelector(textAreaSelector, 10000);

          console.log('[facebook] Entering post text...');
                await this.page.click(textAreaSelector);
                await this.humanDelay(300, 500);
                await this.page.keyboard.type(text, { delay: 25 });
                await this.humanDelay(1000, 2000);

          // Handle image upload if provided
          if (imagePath) {
                    console.log('[facebook] Uploading image...');
                    const photoButton = await this.page.$('[aria-label="Photo/video"]');
                    if (photoButton) {
                                await photoButton.click();
                                await this.humanDelay(500, 1000);
                                const fileInput = await this.page.$('input[type="file"][accept*="image"]');
                                if (fileInput) {
                                              await fileInput.uploadFile(imagePath);
                                              await this.humanDelay(3000, 5000);
                                }
                    }
          }

          // Click Post button
          console.log('[facebook] Publishing post...');
                const postButton = await this.page.$('div[aria-label="Post"], button:has-text("Post")');
                if (postButton) {
                          await postButton.click();
                }

          await this.humanDelay(3000, 5000);

          console.log('[facebook] Post published successfully!');
                return { success: true, platform: 'facebook' };
        } catch (error) {
                console.error('[facebook] Post error:', error.message);
                await this.screenshot('post-error');
                return { success: false, error: error.message };
        }
  }
}

module.exports = FacebookBrowser;
