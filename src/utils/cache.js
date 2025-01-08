const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis error:', err));
client.on('connect', () => console.log('Redis connected'));

const get = promisify(client.get).bind(client);
const set = promisify(client.set).bind(client);

module.exports = {
  get,
  set,
  client
}; 