const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async (uri = env.mongodbUri) => {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected successfully');
  } catch (error) {
    console.error(`[MongoDB] Disconnection error: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
