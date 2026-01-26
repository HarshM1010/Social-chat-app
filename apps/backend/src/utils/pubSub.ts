import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

// 1. Connection Options
const options = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    // Retry connection every 2 seconds if it fails
    return Math.min(times * 50, 2000);
  },
};

// 2. Create the Publisher and Subscriber instances
// Redis requires two separate connections for PubSub
const publisher = new Redis(options);
const subscriber = new Redis(options);

// 3. Export the Instance
export const pubSub = new RedisPubSub({
  publisher,
  subscriber,
});
