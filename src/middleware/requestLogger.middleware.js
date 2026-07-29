const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`,
      {
        ip: req.ip,
      }
    );
  });

  next();
};

module.exports = { requestLogger };


// const logger = require('../utils/logger');

// const requestLogger = (req, res, next) => {
//   const start = Date.now();
//   res.on('finish', () => {
//     logger.info({
//       method:   req.method,
//       url:      req.originalUrl,
//       status:   res.statusCode,
//       duration: `${Date.now() - start}ms`,
//       ip:       req.ip,
//     });
//   });
//   next();
// };

// module.exports = { requestLogger };
