require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Render's proxy so IP is read from X-Forwarded-For
app.set('trust proxy', 1);

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://chichi0418.github.io',
  ],
}));

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: parseInt(process.env.RATE_LIMIT ?? '30'),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: `Rate limit exceeded. You can send up to ${process.env.RATE_LIMIT ?? '30'} messages per hour.` },
});

app.use(express.json());
app.use('/api/chat', chatLimiter, chatRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.head('/api/health', (req, res) => res.sendStatus(200));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
