const express = require('express');
const apiRouter = require('./routes/api');
const http = require('http');

const redis = require('redis');
const cors = require('cors');

const SERVER_NAME = process.env.SERVER_NAME || "APP"

const socketio = require('socket.io');

const app = express();

const httpServer = http.createServer(app);

const io = socketio(httpServer, {
  cors: {
    origin: '*',
  }
})

// const io = require("socket.io")(httpServer);
// console.log("IO: ",io);

const redisConfig = {
  port: 6379,
  host: process.env.REDIS_HOST || "turing"
}


// Set up 1 publisher and 4 subscribers in redis
const publisher = redis.createClient(redisConfig);

const subscriber = redis.createClient(redisConfig);
const subscriber2 = redis.createClient(redisConfig);
const subscriber3 = redis.createClient(redisConfig);
const subscriber4 = redis.createClient(redisConfig);
// setup listeners
subscriber.subscribe('bchat-chats')
subscriber2.subscribe('bchat-rooms')
subscriber3.subscribe('bchat-users')
subscriber4.subscribe('logged-users')


subscriber.on('subscribe', (channel, count)=>{
    console.log(`${SERVER_NAME} is subscribed to ${channel} successfully`)
})

const mongoose = require('mongoose');
const ChatSchema = require('./models/Chat')

const { MongoClient } = require('mongodb');
// Connection URI and Database Name
const uri = 'mongodb://mongo:27017/chat_db';


// Connect to MongoDB
mongoose.connect('mongodb://mongo:27017/chat_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}); 

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
   // Connection successful. Write your code here.
   console.log("succesfull mongoose connection!");
});

app.use(cors());

// Set up middleware to parse JSON requests
app.use(express.json());


// Set up API routes
app.use('/api', apiRouter);

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
// const io = socketio(server,{
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//     allowedHeaders: ["my-custom-header"],
//     credentials: true
//   }
// });


// map user name to socket id
var userToSocket  = {}

// socket code
io.on("connection", (socket) => {
  console.log(`a user connected at ${SERVER_NAME}`);

  // send initial room info 
  publisher.lrange('roomBCHAT',0,-1, (err, reply)=>{
    // socket.emit('room', JSON.stringify(reply))
  })

  socket.on("join", async (room, user) => {
    console.log(`user ${socket.id} joined room ${room}`);

    // set socketId value for the current user in room
    userToSocket[user] = socket.id;

    // this user socket has joined the room with name
    socket.join(room);

    // cache new room
    publisher.get(room, (err, reply)=>{
      if (!reply){
        console.log("New room created......");

        publisher.set(room, '1')

        // add the current room to list of rooms
        publisher.lpush(['roomBCHAT', room],(err, r) =>{})
        
        // dummy publish to make aware the other servers that a new rooms has created
        // to notify all subscribed clients about the new user who joined the room
        publisher.publish('bchat-rooms', "1")
      }
    })
    
    publisher.lpush([`${room}_meta`, user],(err, r) =>{})
    publisher.publish('bchat-users', room)

    // Fetch the list of users currently in the room from Redis
    // const users = await getAsync(room);
    // const userList = users ? JSON.parse(users) : [] ;

    // Emit the list of users to all clients in the room
    // io.to(room).emit("user list", userList);
  });

  socket.on('message', async msg =>{
        
    publisher.publish('bchat-chats', msg)
    const data = JSON.parse(msg)

    console.log(data);

    const message = data.message;
    const senderName = data.senderName;
    const createdAt = data.createdAt;
    const roomName = data.roomName;

    const Chat = new ChatSchema({
      message: message,
      senderName: senderName,
      receiverName: null,
      roomName: roomName,
      createdAt: createdAt
    });

    await Chat.save(); 

    console.log("Unicast: ", data.unicast);
    
    if (data.unicast){
      // handling unicast
      socket.emit('message', msg)
    }
  });

  socket.on("leave room", (room, user) => {
    console.log(`user ${socket.id} left room ${room}`);
    socket.leave(room); 

    delete userToSocket[user];

    publisher.lrem([`${room}_meta`, 0, user], (err, r) =>{});
    publisher.publish('bchat-users', room);
  });

  socket.on("loggingInUsers", (name) => {
    publisher.lpush(['onlineUsers', name],(err, r) =>{})
    publisher.publish("logged-users", name);
  });

  socket.on('logout', (user) => {
    console.log(`${user} has logged out`);
    const socketId = userToSocket.get(user);

    if (socketId) {
      userToSocket.delete(user);
      publisher.onlineUsers.del(user);
      publisher.publish("logged-users","1");
      // io.to(socketId).emit('logout', { user });
    }
  });
  

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

});


// chats channel subscriber
subscriber.on('message', (channel, msg) =>{
  try {
  
      //console.log("Redis: ", msg)
      const data = JSON.parse(msg)

      console.log ("Backend chats msg object", msg);
      
      if(data.unicast) {
        // handling unicast
        if(data.toUser in connections)
        {
          io.to(connections[data.receiverName]).emit('message', msg);
        }
      }
      
      else {
        // handling multicast
        console.log("Room message");
        io.to(data.roomName).emit('message', msg);
      }
  } 
  
  catch (error) {
      console.log(`${SERVER_NAME}: Error Occured, ${error}`)
  }
})


// rooms channel subsribe
subscriber2.on('message', (c, m) =>{
  publisher.lrange('roomBCHAT',0,-1, (err, reply)=>{
      io.emit('room', JSON.stringify(reply))
  })
})


// users channel subscribe
subscriber3.on('message', (c, m) =>{
  // send initial room info 
  // console.log(m," : c : ", c)

  publisher.lrange(`${m}_meta`,0,-1, (err, reply)=>{
      // console.log("sending", reply)
      io.to(m).emit('roomusers', JSON.stringify(reply))
  })
})


// logged in users channel subsribe
subscriber4.on('message', (c, m) =>{
  publisher.lrange('onlineUsers',0,-1, (err, reply)=>{
      io.emit('logged-users', JSON.stringify(reply))
  })
})


const PORT = process.env.PORT || 8080
console.log("PORT: ",PORT);
httpServer.listen(PORT, ()=> console.log(`Server Running @ ${PORT}`))

// Start the server
// http.listen(8000, () => {
//   console.log('Server started on port 8000');
// });