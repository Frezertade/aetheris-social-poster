/**
 * Aetheris Social Poster - Backend Server
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const ContentGenerator = require('./ai/contentGenerator');
const ImageGenerator = require('./ai/imageGenerator');
const PostScheduler = require('./scheduler/cron');
const AnalyticsTracker = require('./analytics/tracker');

const RedditBrowser = require('./automation/reddit');
const TwitterBrowser = require('./automation/twitter');
const LinkedInBrowser = require('./automation/linkedin');
const FacebookBrowser = require('./automation/facebook');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const contentGenerator = new ContentGenerator(process.env.ANTHROPIC_API_KEY);
const imageGenerator = new ImageGenerator({ provider: 'pollinations' });
const scheduler = new PostScheduler();
const analytics = new AnalyticsTracker();

app.use('/api/images', express.static(path.join(__dirname, '../data/images')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', scheduler: scheduler.isRunning ? 'running' : 'stopped' });
});

// Content Generation
app.post('/api/content/generate', async (req, res) => {
  try {
    const { platform, topic, pillar } = req.body;
    const content = await contentGenerator.generateForPlatform(platform, { topic, pillar });
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/content/generate-all', async (req, res) => {
  try {
    const content = await contentGenerator.generateForAllPlatforms(req.body.topic);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Image Generation
app.post('/api/images/generate', async (req, res) => {
  try {
    const result = await imageGenerator.generate(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics
app.get('/api/analytics/dashboard', (req, res) => {
  res.json(analytics.getDashboardStats());
});

// Platform Status
app.get('/api/platforms/status', async (req, res) => {
  const statuses = { reddit: false, twitter: false, linkedin: false, facebook: false };
  res.json(statuses);
});

// Posting
app.post('/api/post/:platform', async (req, res) => {
  try {
    const result = await scheduler.postToPlatform(req.params.platform, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scheduler
app.get('/api/scheduler/status', (req, res) => res.json(scheduler.getQueueStatus()));
app.post('/api/scheduler/start', (req, res) => { scheduler.start(); res.json({ message: 'Started' }); });
app.post('/api/scheduler/stop', (req, res) => { scheduler.stop(); res.json({ message: 'Stopped' }); });

app.listen(PORT, () => console.log('Server running on port ' + PORT));

module.exports = app;
