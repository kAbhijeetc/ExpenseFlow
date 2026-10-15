import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let memServer = null;

/**
 * Connect to MongoDB instance (Local, Atlas, or in-memory fallback for testing/demo)
 */
export const connectDB = async (customUri = null) => {
  try {
    let mongoUri = customUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/expenseflow';

    // If already connected, return
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    mongoose.set('strictQuery', true);

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2500, // Quick timeout to attempt local/atlas first
      });
      console.log(`[MongoDB] Connected to database at: ${mongoUri.split('@').pop()}`);
      return mongoose.connection;
    } catch (primaryError) {
      // In dev or test environments, if local mongod is not running, provide automatic fallback via mongodb-memory-server
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[MongoDB] Could not connect to primary URI (${mongoUri}). Initializing embedded in-memory MongoDB engine...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memServer = await MongoMemoryServer.create();
        const memUri = memServer.getUri();
        await mongoose.connect(memUri);
        console.log(`[MongoDB] Successfully connected to in-memory MongoDB at: ${memUri}`);
        return mongoose.connection;
      }
      throw primaryError;
    }
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnect from MongoDB and stop memory server if running
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (memServer) {
      await memServer.stop();
      memServer = null;
    }
  } catch (err) {
    console.error(`[MongoDB] Disconnect error: ${err.message}`);
  }
};
