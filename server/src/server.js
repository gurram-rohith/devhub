import 'dotenv/config';               // MUST be the first import (see below)
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on ${PORT}`)))
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });