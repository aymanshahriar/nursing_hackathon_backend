import { Server } from "socket.io";
import { db, queryDatabase } from "./databaseConnection.js";

// Socket io connection, enables users to send and receive messages
const setUpSocket = (server) => {

  const io = new Server(server, { cors: { origin: "*" } });
  
  io.on('connection', async (socket) => {
    socket.user_id = socket.handshake.auth.user_id;
    socket.join(socket.user_id);
    console.log(`${socket.user_id} has connected`);

    /* 
    Structure of message:
    {
      senderId: <string>,
      receiverId: <string>,
      content: <string>
    }
    */
    socket.on("message", async (message) => {

      try {
        // Insert the message into the message table

        console.log(message)
        const sql = `INSERT INTO Message (sender_id, receiver_id, content)
            VALUES (${message.senderId}, ${message.receiverId}, '${message.content}');`;

        const result = await queryDatabase(sql);

        // Emit the message to both the user and the matched user
        io.to(message.senderId).emit('message', message.content);
        io.to(message.receiverId).emit('message', message.content);

      } catch (err) {
        console.log(err);
        return err;
      }
    });
  });
}



export default setUpSocket;