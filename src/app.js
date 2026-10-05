require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const routes = require('./routes/index');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const { requestLogger } = require('./middleware/requestLogger.middleware');
const { globalRateLimiter } = require('./middleware/rateLimiter.middleware');
const { connectDB } = require('./config/database');

const app = express();

// ─── Serverless DB Connection Middleware ─────────────────────────────────────

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Security ─────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(mongoSanitize());

// Allowed production origins from .env + Default Firebase Origins
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...envOrigins,
  'https://peppers-app.web.app',
  'https://peppers-app.firebaseapp.com',
  'https://peppers-admin.web.app',
  'https://peppers-admin.firebaseapp.com'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Mobile apps, Postman, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      // Allow any localhost port during development
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      // Allow configured production domains
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`❌ CORS blocked: ${origin}`);
      return callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── General Middleware ───────────────────────────────────────────────────────

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use(globalRateLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) =>
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/v1', routes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  })
);

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler);

module.exports = app;



// // require('dotenv').config();

// // const express = require('express');
// // const cors = require('cors');
// // const helmet = require('helmet');
// // const mongoSanitize = require('express-mongo-sanitize');
// // const compression = require('compression');
// // const routes = require('./routes/index');
// // const { errorHandler } = require('./middleware/errorHandler.middleware');
// // const { requestLogger } = require('./middleware/requestLogger.middleware');
// // const { globalRateLimiter } = require('./middleware/rateLimiter.middleware');

// // const app = express();

// // // ─── Security ─────────────────────────────────────────────────────────────────

// // app.use(helmet());
// // app.use(mongoSanitize());

// // // Allowed production origins from .env
// // const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
// //   .split(',')
// //   .map((o) => o.trim())
// //   .filter(Boolean);

// // app.use(
// //   cors({
// //     origin: (origin, callback) => {
// //       // Mobile apps, Postman, server-to-server requests
// //       if (!origin) {
// //         return callback(null, true);
// //       }

// //       // Allow any localhost port during development
// //       if (
// //         origin.startsWith('http://localhost:') ||
// //         origin.startsWith('https://localhost:') ||
// //         origin.startsWith('http://127.0.0.1:') ||
// //         origin.startsWith('https://127.0.0.1:')
// //       ) {
// //         return callback(null, true);
// //       }

// //       // Allow configured production domains
// //       if (allowedOrigins.includes(origin)) {
// //         return callback(null, true);
// //       }

// //       console.warn(`❌ CORS blocked: ${origin}`);
// //       return callback(new Error(`CORS blocked: ${origin}`));
// //     },
// //     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
// //     allowedHeaders: ['Content-Type', 'Authorization'],
// //     credentials: true,
// //   })
// // );

// // // ─── General Middleware ───────────────────────────────────────────────────────

// // app.use(compression());
// // app.use(express.json({ limit: '10mb' }));
// // app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// // app.use(requestLogger);
// // app.use(globalRateLimiter);

// // // ─── Health Check ─────────────────────────────────────────────────────────────

// // app.get('/health', (req, res) =>
// //   res.status(200).json({
// //     status: 'ok',
// //     timestamp: new Date().toISOString(),
// //   })
// // );

// // // ─── API Routes ───────────────────────────────────────────────────────────────

// // app.use('/api/v1', routes);

// // // ─── 404 Handler ──────────────────────────────────────────────────────────────

// // app.use((req, res) =>
// //   res.status(404).json({
// //     success: false,
// //     message: `Route not found: ${req.originalUrl}`,
// //   })
// // );

// // // ─── Global Error Handler ─────────────────────────────────────────────────────

// // app.use(errorHandler);

// // module.exports = app;




// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const compression = require('compression');
// const routes = require('./routes/index');
// const { errorHandler } = require('./middleware/errorHandler.middleware');
// const { requestLogger } = require('./middleware/requestLogger.middleware');
// const { globalRateLimiter } = require('./middleware/rateLimiter.middleware');
// const { connectDB } = require('./config/database');

// const app = express();

// // ─── Serverless DB Connection Middleware ─────────────────────────────────────

// app.use(async (req, res, next) => {
//   try {
//     await connectDB();
//     next();
//   } catch (err) {
//     next(err);
//   }
// });

// // ─── Security ─────────────────────────────────────────────────────────────────

// app.use(helmet());
// app.use(mongoSanitize());

// // Allowed production origins from .env
// const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
//   .split(',')
//   .map((o) => o.trim())
//   .filter(Boolean);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Mobile apps, Postman, server-to-server requests
//       if (!origin) {
//         return callback(null, true);
//       }

//       // Allow any localhost port during development
//       if (
//         origin.startsWith('http://localhost:') ||
//         origin.startsWith('https://localhost:') ||
//         origin.startsWith('http://127.0.0.1:') ||
//         origin.startsWith('https://127.0.0.1:')
//       ) {
//         return callback(null, true);
//       }

//       // Allow configured production domains
//       if (allowedOrigins.includes(origin)) {
//         return callback(null, true);
//       }

//       console.warn(`❌ CORS blocked: ${origin}`);
//       return callback(new Error(`CORS blocked: ${origin}`));
//     },
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: true,
//   })
// );

// // ─── General Middleware ───────────────────────────────────────────────────────

// app.use(compression());
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// app.use(requestLogger);
// app.use(globalRateLimiter);

// // ─── Health Check ─────────────────────────────────────────────────────────────

// app.get('/health', (req, res) =>
//   res.status(200).json({
//     status: 'ok',
//     timestamp: new Date().toISOString(),
//   })
// );

// // ─── API Routes ───────────────────────────────────────────────────────────────

// app.use('/api/v1', routes);

// // ─── 404 Handler ──────────────────────────────────────────────────────────────

// app.use((req, res) =>
//   res.status(404).json({
//     success: false,
//     message: `Route not found: ${req.originalUrl}`,
//   })
// );

// // ─── Global Error Handler ─────────────────────────────────────────────────────

// app.use(errorHandler);

// module.exports = app;