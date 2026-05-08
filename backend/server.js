require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/plans', require('./routes/plan'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/v1/patents', require('./routes/patent'));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date(),
  });
});

const startServer = async () => {
  try {
    await testConnection();

    console.log('✅ SQL DB connected');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Patent API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err.message);
    process.exit(1);
  }
};

startServer();