const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Route imports
const userRoutes = require('./routes/userRoutes');
const stationRoutes = require('./routes/stationRoutes');
const fuelRoutes = require('./routes/fuelRoutes');
const queueRoutes = require('./routes/queueRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const testRoutes = require("./routes/testRoutes");
const mailTestRoutes = require("./routes/mailTestRoutes");
const aiRoutes = require("./routes/aiRoutes");


const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/test", testRoutes);
app.use("/api/mail", mailTestRoutes);
app.use("/api/ai", aiRoutes);


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
