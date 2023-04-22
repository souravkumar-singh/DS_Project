import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { UserContext } from '../contexts/UserContext';
import { useNavigate } from "react-router-dom";


import socketIOClient from "socket.io-client";
const ENDPOINT = "http://localhost:8080";
const frontPort = 8080;

var socket = socketIOClient(ENDPOINT,{
  transports: [ "websocket", 'polling' ]
})

const DM = () => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user, setUser } = useContext(UserContext);
  
  const [newMessage, setNewMessage] = useState("");
  const messageRef = useRef(null);

  const storedUsername = JSON.parse(localStorage.getItem("user"));
  const connectedClients = {}; 

  useEffect(() => {
    // Listen for client's login event
    socket.on("login", (user) => {
      // Store the socket id of the connected client
      connectedClients[user.name] = socket.id;
  
      console.log("User", user.name, "logged in with socket id", socket.id);
    });
  
    // Listen for client's disconnection event
    socket.on("disconnect", () => {
      console.log("Client disconnected with socket id:", socket.id);
  
      // Remove the disconnected client's socket id from the connectedClients object
      const user = Object.keys(connectedClients).find((key) => connectedClients[key] === socket.id);
      delete connectedClients[user];
    });
  },[]);

  useEffect(() => {
    // Fetch users from MongoDB
    const fetchUsers = async () => {
        const response = await fetch(`http://localhost:${frontPort}/api/users`);
        const data = await response.json();
        console.log(data)
        setUsers(data);
    };
    fetchUsers();
  },[]);

  useEffect(() => {
    if (selectedUser) {
      // Fetch direct messages between current user and selected user
      const fetchMessages = async () => {
        const storedUsername = JSON.parse(localStorage.getItem("user"));
        const sender=storedUsername.name
        
        console.log("Selected User:", selectedUser);
        console.log("Current User:", sender);

        const response = await fetch(`http://localhost:${frontPort}/api/messages/${sender}/${selectedUser}`);
        const data = await response.json();
        console.log("Messages:", data);
        setMessages(data.messages);
      };
      fetchMessages();

       // Listen for new direct messages
      socket.on("new direct message", async (message) => {
      console.log("ab");
      if (message.senderName === user.name && message.receiverName === selectedUser) {
        // Add the message to the MongoDB database
        console.log("Message is for selected user");
        
        const response = await fetch(`http://localhost:${frontPort}/api/Msgdm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message.message,
            senderName: message.senderName,
            receiverName: message.receiverName,
      createdAt: message.createdAt
          }),
        });
        const data = await response.json();
        console.log("Added new message to MongoDB:", data);
        console.log(data);

        // Update the messages state with the new message
        setMessages((prevMessages) => [...prevMessages, data.message]);

        // Scroll to the bottom of the message list
        messageRef.current.scrollTop = messageRef.current.scrollHeight;
      }
    });
    }
  }, [selectedUser]);

  const handleUserClick = (selectedUser) => {
    setSelectedUser(selectedUser);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (newMessage.trim() === "") {
      return;
    }
    const message = {
      message: newMessage,
      senderName: user.name,
      receiverName: selectedUser,
      createdAt: new Date().toISOString()
    };

    console.log("client:",connectedClients[selectedUser]);
    socket.emit("new direct message", message);
    console.log("Sent new message:", message);
    setNewMessage("");
  };

  return (
    <div>
      <h1>Direct Messages</h1>
      <h2>Users:</h2>
      <ul>
        {users.map((user) => (
          <li key={user} onClick={() => handleUserClick(user)}>{user}</li>
        ))}
      </ul> 

      {selectedUser && (
        <div>
          <h2>Chat with {selectedUser}:</h2>
          <div className="message-list" ref={messageRef}>
            {messages && messages.map((message, index) => (
              <div className="message" key={index}>
                <p className="message-text">Message: {message.message}</p>
                <p className="message-details">
                  <span> Sender: {message.senderName} </span>
              <span> Receiver: {message.receiverName} </span>
              <span> Created At: {format(new Date(message.createdAt), "dd/MM/yyyy HH:mm:ss")} </span>
            </p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  )}
</div>
);
};

export default DM;
