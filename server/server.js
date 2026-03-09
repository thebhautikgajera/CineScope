import 'dotenv/config';
import app from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { initRedis, getRedisClient } from './src/utils/redis.js';

const PORT = process.env.PORT || 4000;

// Start server
const startServer = async () => {
  try {
    // Log environment variable status once at startup (for debugging / verification)
    logEnvStatus();

    // Connect to MongoDB
    await connectDB();

    // Initialize Redis
    const redisClient = initRedis();
    if (!redisClient) {
      // Caching will be disabled
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      // Server started
    });

    return server;
  } catch (error) {
    // If startup fails, exit with non-zero code
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  const redisClient = getRedisClient();
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      // Ignore Redis close errors during shutdown
    }
  }
  await disconnectDB();
};

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

startServer();

export default app;

