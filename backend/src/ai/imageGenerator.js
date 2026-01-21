const fs = require('fs');
const path = require('path');
const https = require('https');

class ImageGenerator {
    constructor(options = {}) {
          this.outputDir = path.join(__dirname, '../../data/images');
          if (!fs.existsSync(this.outputDir)) {
                  fs.mkdirSync(this.outputDir, { recursive: true });
          }
    }

  async generate(options = {}) {
        const prompt = options.customPrompt || options.topic || 'business automation';
        const dimensions = { width: 1200, height: 675 };

      try {
              return await this.generateWithPollinations(prompt, dimensions);
      } catch (error) {
              return { success: false, error: error.message };
      }
  }

  async generateWithPollinations(prompt, dimensions) {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${dimensions.width}&height=${dimensions.height}&nologo=true`;
        const filename = `img_${Date.now()}.jpg`;
        const filepath = path.join(this.outputDir, filename);

      return new Promise((resolve, reject) => {
              const file = fs.createWriteStream(filepath);
              https.get(url, (response) => {
                        response.pipe(file);
                        file.on('finish', () => {
                                    file.close();
                                    resolve({ success: true, path: filepath, filename, prompt });
                        });
              }).on('error', reject);
      });
  }

  getGeneratedImages() {
        if (!fs.existsSync(this.outputDir)) return [];
        return fs.readdirSync(this.outputDir)
          .filter(f => f.endsWith('.jpg'))
          .map(filename => ({ filename }));
  }
}

module.exports = ImageGenerator;
