import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { UserContext } from '../contexts/UserContext';
import { useNavigate } from "react-router-dom";

import socketIOClient, { Socket } from "socket.io-client";
const ENDPOINT = "http://localhost:8080";
const frontPort = 8080;

var socket = socketIOClient(ENDPOINT, {
  transports: ["websocket", 'polling']
})

const DM = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user, setUser } = useContext(UserContext);

  const [messages, setMessages] = useState([]);
  const [latestMessage, setLatestMessage] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  // const { current_username } = useParams();
  const messageContainerRef = useRef(null);

  const storedUsername = JSON.parse(localStorage.getItem("user"));
  const current_username = storedUsername.name;
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch users from MongoDB
    const fetchUsers = async () => {
      const response = await fetch(`http://localhost:${frontPort}/api/users`);
      const data = await response.json();
      console.log(data)
      setUsers(data);
    };
    fetchUsers();

    socket.emit("join_dm", current_username);
    
    socket.on("message", msg => {
      const data = JSON.parse(msg);

      const selectedUser_storage = JSON.parse(localStorage.getItem("selectedUser"));

      if ( data.senderName == current_username){
        setLatestMessage(data);
      }

      else if ((data.senderName == selectedUser_storage)  && (data.receiverName == current_username))
      {
        setLatestMessage(data);
        console.log("else if "); 
        console.log("Selected",selectedUser_storage);
        console.log("actuall", current_username);
        console.log("receiverNAme",data.receiverName);
        console.log("senderName", data.senderName);
      }

      else
      {
        console.log("else");
        console.log("Selected",selectedUser_storage);
        console.log("actuall", current_username);
        console.log("receiverNAme",data.receiverName);
        console.log("senderName", data.senderName);
      }
    });

    socket.on("logged-users", (msg) => {
      console.log("list",msg);
      
      let data = JSON.parse(msg)
      
      const uniquedata = data.filter((elem, pos) => {
        return data.indexOf(elem) == pos;})

      setUsers(uniquedata);
    });

    // Listen for new direct messages
  
    return () => {
      socket.off('message')
      socket.off('logged-users')
      //ocket.off('roomusers')

      // Emit "leave room" event when component unmounts
      socket.emit("leave_DM", storedUsername.name);
    };

  }, []);


  useEffect(() => {
    if (selectedUser) {
      // Fetch direct messages between current user and selected user
      const fetchMessages = async () => {
        const storedUsername = JSON.parse(localStorage.getItem("user"));
        const sender = storedUsername.name

        console.log("Selected User:", selectedUser);
        console.log("Current User:", sender);

        const response = await fetch(`http://localhost:${frontPort}/api/messages/${sender}/${selectedUser}`);
        const data = await response.json();

        console.log("Messages:", data.messages);
        setMessages(data.messages);
      };
      fetchMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (latestMessage) {
      console.log("Latest Message is", latestMessage);
      setMessages([...messages, latestMessage]);
    }
    else {
      console.log("Latest Message is NULL");
    }
  }, [latestMessage]);


  useEffect(() => {
    // Scroll to the bottom when new messages are added
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleExit = () => {
    // const currentUserName = JSON.parse(localStorage.getItem("user")).name;
    // socket.emit("leave room", roomName, currentUserName);
    localStorage.removeItem("selectedUser");

    // Redirect to dashboard
    navigate("/dashboard");
  };

  const handleUserClick = (selectedUser) => {
    setSelectedUser(selectedUser);
    localStorage.setItem("selectedUser", JSON.stringify(selectedUser));
    console.log("User Click Selected User: ", selectedUser);
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
      roomName: null,
      unicast: true,
      createdAt: new Date().toISOString()
    };

    socket.emit("message", JSON.stringify(message));

    console.log("Selected User:", selectedUser);

    setNewMessage("");
  };


  return (
    <div className="chat-box">

      <div className="chat-header">
        <h1> Direct Messages </h1>
        <button onClick={handleExit} className="exit-button"> Back </button>
      </div>

      <div className="chat-body">
        <h2>Users:</h2>
        
        <ul>
          {users.map((user) => (
            // Only render the <li> element if the user is not the current user
            current_username !== user && (
              <li key={user} onClick={() => handleUserClick(user)}>{user}</li>
            )
          ))}
        </ul>

        {selectedUser && (
          <div>
            <h2> Chat with {selectedUser} </h2>

            <div className="message-list" ref={messageContainerRef}>
              {messages && messages.map((message, index) => (
                <div className="message" key={index}>
                  <p className="message-text">
                    <span className="sender-name">{message.senderName}: </span>
                    {message.message}
                  </p>
                  <p className="message-details">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder="Type your message here"
              />
              <button type="submit"> Send </button>
            </form>

          </div>
        )}
      </div>
    </div>
  );
};

export default DM;
