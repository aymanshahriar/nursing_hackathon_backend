import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
const app = express();
const PORT = process.env.PORT || 3001;
import { Server } from "socket.io";
import { createServer } from 'node:http';

// Middleware
app.use(express.json());
app.use(cors());

const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// If the PORT environment variable is not set in the computer, then use port 3000 by default
server.listen(process.env.PORT || 3001, () => {
  console.log(`api is running on port ${process.env.PORT || 3001}`);
});


// Socket io connection, enables users to send and receive messages
io.on('connection', async (socket) => {
  socket.username = socket.handshake.auth.username;
  socket.join(socket.username);
  console.log(`${socket.username} has connected`);

  /* 
  Structure of message:
  {
    senderUsername: <string>,
    receiverUsername: <string>,
    content: <string>
  }
  */
  socket.on("message", async (message) => {

    try {
      const messageObj = {
        senderUsername: message.senderUsername,
        receiverUsername: message.receiverUsername,
        content: message.text

      }
      // Emit the message to both the user and the matched user
      io.to(message.senderUsername).emit('message', message.content);
      io.to(message.receiverUsername).emit('message', message.content);

    } catch (err) {
      console.log(err);
      return err;
    }
  });
});
//