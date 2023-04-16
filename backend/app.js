const express = require('express');
const mongoose = require('mongoose');
const apiRouter = require('./routes/api');
const redis=require('redis');
const cors = require('cors');
const socketio = require('socket.io');

const app = express();
app.use(cors());

// Set up middleware to parse JSON requests
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chat_db', { useNewUrlParser: true });

// Set up API routes
app.use('/api', apiRouter);

// Start the server
const server = app.listen(8000, () => {
  console.log('Server started on port 8000');
});

// Set up Redis client
const client = redis.createClient();
(async () => {
    await client.connect();
})();


// Define getAsync function to retrieve data from Redis
function getAsync(key) {
  return new Promise((resolve, reject) => {
    client.get(key, (err, value) => {
      if (err) {
        reject(err);
      } else {
        resolve(value);
      }
    });
  });
}

// Set up Socket.IO
const io = socketio(server,{
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});


// socket code
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("join room", async (room) => {
    console.log(`user ${socket.id} joined room ${room}`);
    socket.join(room);

    // Fetch the list of users currently in the room from Redis
    const users = await getAsync(room);
    const userList = users ? JSON.parse(users) : [];

    // Emit the list of users to all clients in the room
    io.to(room).emit("user list", userList);
  });

  socket.on("leave room", (room) => {
    console.log(`user ${socket.id} left room ${room}`);
    socket.leave(room);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  // Handle "new message" events
  socket.on("new message", (message, room) => {
    console.log("new message:", message);

    // Store the message in MongoDB

    // Emit the message to all clients in the room
    io.to(room).emit("new message", message);
  });
});

// Start the server
// http.listen(8000, () => {
//   console.log('Server started on port 8000');
// });