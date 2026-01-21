const cron = require('node-cron');

class PostScheduler {
    constructor() {
          this.isRunning = false;
          this.jobs = [];
          this.postTimes = (process.env.POST_TIMES || '09:00,17:00').split(',');
    }

  start() {
        if (this.isRunning) return;
        this.postTimes.forEach(time => {
                const [hour, minute] = time.split(':');
                const job = cron.schedule(`${minute} ${hour} * * *`, () => this.executeScheduledPost());
                this.jobs.push(job);
        });
        this.isRunning = true;
  }

  stop() {
        this.jobs.forEach(job => job.stop());
        this.jobs = [];
        this.isRunning = false;
  }

  async executeScheduledPost() {
        return { message: 'Scheduled post executed' };
  }

  async postToPlatform(platform, content) {
        return { success: true, platform };
  }

  async triggerNow() {
        return await this.executeScheduledPost();
  }

  getQueueStatus() {
        return { isRunning: this.isRunning, scheduledTimes: this.postTimes };
  }
}

module.exports = PostScheduler;
