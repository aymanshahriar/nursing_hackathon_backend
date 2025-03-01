import express, { json, urlencoded } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import passportConfig from './src/config/passport.js';
import routes from './src/routes/index.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

const allowedOrigins = process.env.CORS_ORIGIN.split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  credentials: true,
}));

app.options('*', (req, res) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:8000');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.status(204).send();
});

// Initialize passport
passportConfig(passport);
app.use(passport.initialize());

app.use(json());
app.use(urlencoded({ extended: false }));

routes(app);

// Global Error Handling Middleware (Optional)
app.use((err, req, res, next) => {
  console.error(err.stack.red);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 Handling Middleware
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`.green);
  });
}

const PORT = process.env.PORT || 3001;

import { createServer } from 'node:http';

// Middleware
app.use(express.json());
app.use(cors());

const server = createServer(app);

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// If the PORT environment variable is not set in the computer, then use port 3000 by default
server.listen(process.env.PORT || 3001, () => {
  console.log(`api is running on port ${process.env.PORT || 3001}`);
});
