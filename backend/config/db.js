const mongoose = require('mongoose');

let mongoMemoryServerInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vitabridge';
  const useMemoryMode = process.env.USE_MEMORY_DB || 'auto';

  // If forced memory mode
  if (useMemoryMode === 'true') {
    return await startMemoryServer();
  }

  // Attempt direct connection first
  try {
    console.log(`[VitaBridge DB] Attempting connection to MongoDB at: ${uri}`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to fall back to memory server if not running
    });
    console.log(`[VitaBridge DB] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[VitaBridge DB] Direct MongoDB connection failed (${err.message}).`);

    if (useMemoryMode === 'auto') {
      console.log('[VitaBridge DB] Auto-starting in-memory MongoDB engine for zero-friction local execution...');
      return await startMemoryServer();
    } else {
      console.error('[VitaBridge DB] Could not connect to MongoDB and in-memory fallback is disabled.');
      throw err;
    }
  }
};

async function startMemoryServer() {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'vitabridge',
      },
    });
    const memoryUri = mongoMemoryServerInstance.getUri();
    console.log(`[VitaBridge DB] In-Memory MongoDB running at: ${memoryUri}`);
    const conn = await mongoose.connect(memoryUri);
    console.log('[VitaBridge DB] Connected to In-Memory MongoDB successfully.');
    return conn;
  } catch (memErr) {
    console.warn('[VitaBridge DB] In-Memory MongoDB unavailable in serverless environment:', memErr.message);
    return null;
  }
}

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
