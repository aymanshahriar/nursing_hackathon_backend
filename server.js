import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
const app = express();
import { createServer } from 'node:http';
import setUpSocket from './socketConnection.js';


// Middleware
app.use(express.json());
app.use(cors());

const server = createServer(app);
setUpSocket(server)

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// If the PORT environment variable is not set in the computer, then use port 3000 by default
server.listen(process.env.PORT || 3001, () => {
  console.log(`api is running on port ${process.env.PORT || 3001}`);
});
