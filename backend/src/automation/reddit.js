/**
 * Reddit Automation Module
 * Handles login and posting to Reddit
 */

const BaseBrowser = require('./base');

class RedditBrowser extends BaseBrowser {
    constructor() {
          super('reddit');
          this.baseUrl = 'https://www.reddit.com';
    }

  /**
     * Check if currently logged in to Reddit
     */
  async isLoggedIn() {
        try {
                await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 3000);

          const loginButton = await this.page.$('a[href*="login"], button[data-testid="login-button"]');
                const userMenu = await this.page.$('#USER_DROPDOWN_ID, button[id*="USER_DROPDOWN"]');

          if (userMenu && !loginButton) {
                    console.log('[reddit] Already logged in');
                    return true;
          }

          const pageContent = await this.page.content();
                if (pageContent.includes('Create Post') || pageContent.includes('u/')) {
                          console.log('[reddit] Already logged in (found user elements)');
                          return true;
                }

          console.log('[reddit] Not logged in');
                return false;
        } catch (error) {
                console.error('[reddit] Error checking login status:', error.message);
                return false;
        }
  }

  /**
     * Login to Reddit
     */
  async login(username, password) {
        try {
                console.log('[reddit] Starting login process...');
                await this.page.goto('https://www.reddit.com/login', { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 4000);

          const usernameSelector = 'input[name="username"], #loginUsername';
                const passwordSelector = 'input[name="password"], #loginPassword';

          await this.waitForSelector(usernameSelector, 15000);

          console.log('[reddit] Entering username...');
                await this.humanType(usernameSelector, username);
                await this.humanDelay(500, 1000);

          console.log('[reddit] Entering password...');
                await this.humanType(passwordSelector, password);
                await this.humanDelay(500, 1000);

          console.log('[reddit] Clicking login button...');
                const loginButtonSelector = 'button[type="submit"], button.login';
                await this.page.click(loginButtonSelector);

          await this.humanDelay(3000, 5000);

          const loggedIn = await this.isLoggedIn();

          if (loggedIn) {
                    console.log('[reddit] Login successful!');
                    await this.saveCookies();
                    return true;
          } else {
                    console.log('[reddit] Login may have failed');
                    await this.screenshot('login-result');
                    return false;
          }
        } catch (error) {
                console.error('[reddit] Login error:', error.message);
                await this.screenshot('login-error');
                return false;
        }
  }

  /**
     * Post to a subreddit
     */
  async post(content) {
        try {
                const { subreddit, title, body, flair } = content;

          console.log(`[reddit] Posting to r/${subreddit}...`);

          const submitUrl = `${this.baseUrl}/r/${subreddit}/submit`;
                await this.page.goto(submitUrl, { waitUntil: 'networkidle2' });
                await this.humanDelay(2000, 4000);

          const pageContent = await this.page.content();
                if (pageContent.includes("you aren't allowed to post") ||
                              pageContent.includes('restricted community')) {
                          console.log(`[reddit] Cannot post to r/${subreddit} - restricted`);
                          return { success: false, error: 'Subreddit is restricted' };
                }

          console.log('[reddit] Entering title...');
                const titleSelector = 'textarea[placeholder*="Title"], input[placeholder*="Title"]';
                await this.waitForSelector(titleSelector, 10000);
                await this.humanType(titleSelector, title);
                await this.humanDelay(500, 1000);

          console.log('[reddit] Entering body...');
                const bodySelectors = [
                          'div[contenteditable="true"]',
                          'textarea[placeholder*="Text"]',
                          '.public-DraftEditor-content',
                          'div[role="textbox"]'
                        ];

          for (const selector of bodySelectors) {
                    const bodyElement = await this.page.$(selector);
                    if (bodyElement) {
                                await bodyElement.click();
                                await this.humanDelay(300, 500);
                                await this.page.keyboard.type(body, { delay: 20 });
                                break;
                    }
          }

          await this.humanDelay(1000, 2000);

          console.log('[reddit] Submitting post...');
                const postButton = await this.page.$('button[type="submit"]');
                if (postButton) {
                          await postButton.click();
                }

          await this.humanDelay(3000, 5000);

          const currentUrl = this.page.url();
                if (currentUrl.includes('/comments/')) {
                          console.log('[reddit] Post successful!');
                          return { success: true, url: currentUrl, platform: 'reddit', subreddit };
                } else {
                          console.log('[reddit] Post may have failed');
                          await this.screenshot('post-result');
                          return { success: false, error: 'Unknown error' };
                }
        } catch (error) {
                console.error('[reddit] Post error:', error.message);
                await this.screenshot('post-error');
                return { success: false, error: error.message };
        }
  }
}

module.exports = RedditBrowser;
