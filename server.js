const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/property');

dotenv.config();
const app = express();

app.use(express.json());

const connectDB = require('./config/db.cfg');
connectDB();

// Root route to check if server is live
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the RentSetu API. Server is live!' });
});

// Other Routes
app.use('/api/auth', authRoutes);
app.use('/api/property', propertyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));