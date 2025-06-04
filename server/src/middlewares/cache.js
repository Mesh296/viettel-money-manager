const { getCache, setCache } = require('../providers/redis');


const cacheMiddleware = (ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    try {
      // Tạo key từ URL và tham số query
      const key = keyGenerator ? 
        keyGenerator(req) : 
        `cache:${req.originalUrl}:${req.user?.id || 'guest'}`;
      
      // Kiểm tra cache
      const cachedData = await getCache(key);
      
      if (cachedData) {
        console.log(`Cache hit for key ${key}`);
        return res.status(200).json(cachedData);
      }
      
      // Lưu response gốc để thêm vào cache
      const originalSend = res.json;
      
      res.json = function(body) {
        // Chỉ cache response thành công
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(key, body, ttl)
            .catch(err => console.error(`Failed to cache ${key}:`, err));
        }
        
        return originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = cacheMiddleware; 