require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://chichi0418.github.io',
  ],
}));

app.use(express.json());
app.use('/api/chat', chatRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.head('/api/health', (req, res) => res.sendStatus(200));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
