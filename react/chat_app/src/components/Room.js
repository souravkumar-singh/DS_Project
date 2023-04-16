import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import {UserContext} from '../contexts/UserContext';
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import '../style.css'

const socket = io("http://localhost:8000");

const Room = () => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const { roomName } = useParams();

  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch users in the room from Redis
    const fetchUsers = async () => {
        const response = await fetch(`http://localhost:8000/api/rooms/${roomName}/users`);
        const data = await response.json();

        setUsers(data.users);
    };
    fetchUsers();

    // Fetch messages in the room from MongoDB
    const fetchMessages = async () => {
        const response = await fetch(`http://localhost:8000/api/rooms/${roomName}/messages`);
        const data = await response.json();

        setMessages(data.messages);
    };
    fetchMessages();
  },[]);

  const handleExit = () => {
    fetch(`http://localhost:8000/api/room/${roomName}/user/${user.name}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        // Redirect to dashboard
        navigate("/dashboard");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };


  // room socket connection
  const [newMessage, setNewMessage] = useState("");
  const messageRef = useRef(null);
  
  // const [sentMessages, setSentMessages] = useState([]);
  

  useEffect(() => { 
    // Emit "join room" event when component mounts
    socket.emit("join room", roomName);

    // Handle "user list" events
    socket.on("user list", (userList) => {
      setUsers(userList);
    });

    // Remove previous "new message" event listener
    // socket.off("new message");

    // Handle "new message" events
    socket.on("new message", (message) => {
      // Check if message has already been sent
      // if (sentMessages.includes(message.text)) {
      //   return;
      // }

      // Add the new message to the messages state variable
      setMessages((prevMessages) => [...prevMessages, message]);

      // Add the new message to the sentMessages state variable
      // setSentMessages((prevSentMessages) => [...prevSentMessages, message.text]);


      // setSentMessages([...sentMessages, message.text]);
      // setMessages(prevMessages => [...prevMessages, message]);

      
      // Scroll to bottom of message list
      if (messageRef.current) {
        messageRef.current.scrollTop = messageRef.current.scrollHeight;
      }
      
      const storedUsername = JSON.parse(localStorage.getItem("user"));
      console.log("Room: ", storedUsername);
      console.log("naammmmm: ",storedUsername.name);


      // Store message in MongoDB
      if(message.senderName === storedUsername.name)
      {
      fetch(`http://localhost:8000/api/room/${roomName}/addMsg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.message,
          senderName: message.senderName,
          createdAt: message.createdAt
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
        })
        .catch((error) => {
          console.error(error);
        });
      }
    });

    return () => {
      // Emit "leave room" event when component unmounts
      socket.emit("leave room", roomName);

      // Remove event listeners
      socket.off("user list");
      socket.off("new message");
    };
  }, [roomName, messages]);

  // useEffect(() => {
  //   if (messageRef.current) {
  //     messageRef.current.scrollTop = messageRef.current.scrollHeight;
  //   }
  // }, [messages]);

  const storedUsername = JSON.parse(localStorage.getItem("user"));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (newMessage.trim() === "") {
      return;
    }
    const message = {
      message: newMessage,
      senderName: storedUsername.name,
      createdAt: new Date().toISOString()
    };
    socket.emit("new message", message, roomName);
    setNewMessage("");

    // setSentMessages([...sentMessages, newMessage]); // Add the new message to sentMessages
  };


  return (
    <div>
      <h1>Room: {roomName}</h1>
      <h2>Users:</h2>
      <ul>
        {users.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul> 

      <h2>Messages:</h2>
      
      <div className="message-list" ref={messageRef}>
        {messages && messages.map((message, index) => (
          <div className="message" key={index}>
            <p className="message-text">Message: {message.message}</p>
            <p className="message-details">
              <span> Sender: {message.senderName} </span> 
              <span> {new Date(message.createdAt).toLocaleString()} </span>
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
        />
        <button type="submit">Send</button>
      </form>


    <button onClick={handleExit}>Exit</button>
    </div>
  );
};

export default Room;