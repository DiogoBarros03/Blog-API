const redis = require('redis');

const redisClient = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

const cache = (req, res, next) => {
  const { id } = req.params;

  if (redisClient.ready) {
    redisClient.get(id, (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error retrieving data from cache' });
      }

      if (data) {
        res.json(JSON.parse(data));
      } else {
        next();
      }
    });
  } else {
    // Redis client is not ready, proceed to next middleware
    next();
  }
};

module.exports = cache;

