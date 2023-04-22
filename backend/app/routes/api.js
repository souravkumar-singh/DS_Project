const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Room = require('../models/Room');
const Chat = require('../models/Chat');
const redis = require('redis');


// create a Redis client with the configuration object
const redisConfig = {
  port: 6379,
  host: process.env.REDIS_HOST || "turing"
}

const client = redis.createClient(redisConfig);

// define signup here
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    let user = await User.findOne({ $or: [{ name }, { email }] });

    if (user) {
        return res.status(400).json({ msg: 'User already exists' });
    }

    const newUser = new User({ name, email, password });

    console.log("hello");
    newUser.save()
    .then(savedData => {
    res.status(201).json(savedData);
    })
    .catch(error => {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Error saving data' });
    });
});


// Define the login endpoint
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find the user with the provided email
  User.findOne({ email })
    .then(user => {
      // If the user is found, verify the password
      if (user) {
        if (user.password === password) {
          // res.status(200).json({ message: 'Login successful',  });
          const { name, email, password } = user;
          
          res.status(200).json({ name, email });
        } else {
          res.status(401).json({ error: 'Incorrect password' });
        }
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    })
    .catch(error => {
      console.error('Error finding user:', error);
      res.status(500).json({ error: 'Error finding user' });
    });
});


// get list of logged in users API
// Currently logged in users route
// API endpoint to retrieve the list of currently logged in users
router.get("/users", async (req, res) => {
  try {
    client.lrange('onlineUsers',0,-1, (err, reply)=>{
      console.log(reply);

      let data =  JSON.stringify(reply);
      const uniquedata = JSON.parse(data).filter((elem, pos, arr) => {
        return arr.indexOf(elem) == pos;
      });
      
      res.send(uniquedata);
      
    })

  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Join a chat room by room name, or create a new room if the name does not exist
router.post('/rooms/:room_name', async (req, res) => {
    const { room_name } = req.params;
    const username = req.body.name;

    try {
        let room = await Room.findOne({ name: room_name });
        
        if (!room) {
            room = new Room({ name: room_name, createdBy: username });
            await room.save();
        } 

        res.status(200).json({msg: "Room Successfully created or already existed."});
    } 
    
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// get list of rooms created
router.get("/rooms", async (req, res) => {
    try {
      const rooms = await Room.find();
      res.json({ rooms });
    } catch (err) {
      console.error(`Failed to fetch rooms: ${err}`);
      res.sendStatus(500);
    }
});


// list all users in a room
router.get("/rooms/:roomName/users", async (req, res) => 
{
    const roomName = req.params.roomName;    
    const finalName = `room:${roomName}`;

    try {
      publisher.lrange(`${m}_meta`,0,-1, (err, reply)=>{
        // console.log("sending", reply)
        io.to(m).emit('roomusers', JSON.stringify(reply))
    })
        const users = await client.sMembers(finalName);
        res.status(200).send({ users });
    }
    catch (err) {
        res.status(500).send(err.message);
    }
});


//show chat messages
router.get("/rooms/:roomName/messages", async (req, res) => {
    const room_name = req.params.roomName;

    // const room = await Room.findOne({ name: room_name });
    console.log("room Name:",room_name);
    const messages = await Chat.find({ roomName: room_name });
    console.log("messages: ",messages);
    res.send({ messages });
});


// Creates a new chat message in the specified room
router.post("/room/:roomName/addMsg", async (req, res) => {
  console.log(req.body);

  const message = req.body.message;
  const sender = req.body.senderName;
  const createdAt = req.body.createdAt;
  
  console.log(sender);

  const roomName = req.params;

  // find the room in the database
  // const room = await Room.findOne({ name: roomName });
  
  // Find the user in the database
  const user = await User.findOne({ name: sender });

  const newChat = new Chat({
    message: message,
    senderName: sender,
    receiverName: null,
    roomName: roomName,
    createdAt: createdAt
  });

  try {
    await newChat.save();
    res.status(201).send(newChat);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


//Fetch messsages between 2 users
router.get("/messages/:sender/:receiver", async (req, res) => {
  const { sender, receiver } = req.params;

  console.log("Hey");

  const messages = await Chat.find({
    $or: [
      { senderName: sender, receiverName: receiver },
      { senderName: receiver, receiverName: sender },
    ],
  }).exec();
  res.json({ messages });
});

//save Msg between 2 users
router.post("/Msgdm", async (req, res) => {
  try {
    const { message, senderName, receiverName, createdAt } = req.body;
    const newMessage = new Chat({
      message:message,
      sender:user._id,
      senderName:senderName,
      receiver:null,
      receiverName,receiverName,
      room:null,
      createdAt:createdAt,
    });
    await newMessage.save();
    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// define socket connection
// const io = require("socket.io")(server);
// const Message = require("../models/Message");

// // Socket.io code to listen to incoming connections
// io.on("connection", (socket) => {
//   console.log("New socket connection established: " + socket.id);

//   // When a user sends a message
//   socket.on("send_message", async ({ recipient, content, sender }) => {
//     console.log(`New message received from ${sender.name} to ${recipient}: ${content}`);

//     // Check if recipient is online
//     const recipientSocket = io.sockets.connected[recipient.socketId];
//     if (recipientSocket) {
//       // If recipient is online, send the message directly to their socket
//       recipientSocket.emit("receive_message", { sender, content });
//     } else {
//       // If recipient is offline, save the message to the database
//       const message = new Message({
//         senderId: sender._id,
//         recipientId: recipient._id,
//         content: content,
//         timestamp: Date.now(),
//       });
//       await message.save();
//       console.log("Recipient is offline. Message saved to database.");
//     }
//   });
// });


module.exports = router;