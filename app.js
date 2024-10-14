const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require ('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const cors = require('cors');

const app = express();

const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com/',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  "'self'", 
  'https://unpkg.com', 
  'https://tile.openstreetmap.org', 
  'ws://127.0.0.1:51849', 
  'http://localhost:3000',
];
const fontSrcUrls = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],  // Permite conexões de origem própria
      connectSrc: ["'self'", ...connectSrcUrls],  // URLs de conectividade permitidas
      scriptSrc: ["'self'", ...scriptSrcUrls],  // URLs de scripts permitidas
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],  // Estilos permitidos
      workerSrc: ["'self'", 'blob:'],  // Blobs e workers
      objectSrc: ["'none'"],  // Bloqueia objetos externos
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],  // URLs de imagens
      fontSrc: ["'self'", ...fontSrcUrls],  // URLs de fontes
    }
  })
);

app.use(compression());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'))


app.use(cors());

app.options('*', cors());

// 1) Global Middlewares
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Development login
if(process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  wiondowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour.' 
});
app.use('/api', limiter);

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter polution
app.use(hpp({
  whiteList: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
