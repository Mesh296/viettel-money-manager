const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

// Tạo Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// Xử lý sự kiện kết nối và lỗi
redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Khởi tạo kết nối
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

// Hàm lưu cache với thời gian hết hạn (TTL)
const setCache = async (key, value, ttl = 3600) => {
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: ttl });
  } catch (error) {
    console.error('Redis cache error:', error);
  }
};

// Hàm lấy dữ liệu từ cache
const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis cache error:', error);
    return null;
  }
};

// Hàm xóa cache khi dữ liệu thay đổi
const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis cache error:', error);
  }
};

// Xóa cache theo pattern
const deleteCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Redis cache error:', error);
  }
};

module.exports = {
  redisClient,
  connectRedis,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern
}; 