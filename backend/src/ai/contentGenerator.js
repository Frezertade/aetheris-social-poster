const Anthropic = require('@anthropic-ai/sdk');

class ContentGenerator {
    constructor(apiKey) {
          this.client = new Anthropic({ apiKey });
          this.businessContext = {
                  name: process.env.BUSINESS_NAME || 'Aetheris Innovations',
                  tagline: 'Elevating Industry through Intelligent Automation'
          };
          this.platformConfigs = {
                  reddit: { maxLength: 10000 },
                  twitter: { maxLength: 280 },
                  linkedin: { maxLength: 3000 },
                  facebook: { maxLength: 63206 }
          };
    }

  async generateForPlatform(platform, options = {}) {
        const config = this.platformConfigs[platform];
        const topic = options.topic || 'automation';

      const response = await this.client.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1024,
              messages: [{ role: 'user', content: `Create a ${platform} post about ${topic} for ${this.businessContext.name}. Return ONLY the post.` }]
      });

      return {
              platform,
              content: response.content[0].text,
              topic,
              generatedAt: new Date().toISOString()
      };
  }

  async generateForAllPlatforms(topic) {
        const results = {};
        for (const platform of Object.keys(this.platformConfigs)) {
                results[platform] = await this.generateForPlatform(platform, { topic });
        }
        return results;
  }

  async generateWithImage(platform, options) {
        return await this.generateForPlatform(platform, options);
  }

  async generateAllWithImages(topic) {
        return await this.generateForAllPlatforms(topic);
  }
}

module.exports = ContentGenerator;
