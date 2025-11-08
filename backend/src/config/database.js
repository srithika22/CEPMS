const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Support both MONGODB_URI and DATABASE_URL
    const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL;
    
    if (!mongoURI) {
      console.error('❌ MongoDB URI not found. Please set MONGODB_URI or DATABASE_URL in .env file');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
