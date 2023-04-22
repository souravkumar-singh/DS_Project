import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import {UserContext} from '../contexts/UserContext';
import { useNavigate } from "react-router-dom";
import '../style.css'

import socketIOClient from "socket.io-client";
const ENDPOINT = "http://localhost:8080";
const frontPort = 8080;

var socket = socketIOClient(ENDPOINT,{
  transports: [ "websocket" ] 
})

const Room = () => {
  // list of users in room
  const [users, setUsers] = useState([]);

  const [messages, setMessages] = useState([]);
  const [latestMessage, setLatestMessage] = useState(null);

  const [newMessage, setNewMessage] = useState("");
  
  const { roomName } = useParams();
  const { user, setUser } = useContext(UserContext);
  
  const navigate = useNavigate();


  // when component mounts (loaded first time)
  useEffect(() => {

    socket.on("message",  msg =>{
      const data = JSON.parse(msg);
      setLatestMessage(data);
    })

    // get the updated list of users for this room
    socket.on('roomusers', msg =>{
      let data = JSON.parse(msg);

      const uniquedata = data.filter((elem, pos) => {
        return data.indexOf(elem) == pos;
      })
      setUsers(uniquedata);
    })

    const currentUserName = JSON.parse(localStorage.getItem("user")).name;

    // Emit "join room" event when component mounts
    socket.emit("join", roomName, currentUserName);

    // Fetch messages in the room from MongoDB
    const fetchMessages = async () => {
        const response = await fetch(`http://localhost:${frontPort}/api/rooms/${roomName}/messages`);
        const data = await response.json();

        setMessages(data.messages);

    };
    fetchMessages();

    return () => {
      socket.off('message')
      socket.off('roomusers')

      // Emit "leave room" event when component unmounts
      socket.emit("leave room", roomName, currentUserName);
    };

  },[]);


  useEffect(() => {
    if (latestMessage) {
      console.log("Latest Message is", latestMessage);
      setMessages([...messages, latestMessage]);
    }
    else {
      console.log("Latest Message is NULL");
    }
  }, [latestMessage]);
  


  const handleExit = () => {
    const currentUserName = JSON.parse(localStorage.getItem("user")).name;
    socket.emit("leave room", roomName, currentUserName);
    
    // Redirect to dashboard
    navigate("/dashboard");
  };


  const storedUsername = JSON.parse(localStorage.getItem("user"));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (newMessage.trim() === "") {
      return;
    }

    const message = {
      message: newMessage,
      senderName: storedUsername.name,
      createdAt: new Date().toISOString(),
      roomName: roomName,
      unicast: false,
      receiverName: null
    };

    socket.emit("message", JSON.stringify(message));
    setNewMessage("");
  };


  return (
    <div className="room-container">
  <h1 className="room-title">Room: {roomName}</h1>
  <h2>Users:</h2>
  <ul className="user-list">
    {users.map((user) => (
      <li key={user}>{user}</li>
    ))}
  </ul> 

  <h2>Messages:</h2>
  
  <div className="message-list">
    {messages  && messages.map((message, index) => (
      <div className="message" key={index}>
        <p className="message-text"> Message: {message.message}</p>
        <p className="message-details">
          <span> Sender: {message.senderName} </span> 
          <span> Time: {new Date(message.createdAt).toLocaleString()} </span>
        </p>
      </div>
    ))}
  </div>

  <form className="message-form" onSubmit={handleSubmit}>
    <input
      className="message-input"
      type="text"
      value={newMessage}
      onChange={(event) => setNewMessage(event.target.value)}
    />
    <button className="message-submit" type="submit"> Send </button>
  </form>


  <button className="exit-button" onClick={handleExit}> Exit </button>
</div>

    // <div>
    //   <h1>Room: {roomName}</h1>
    //   <h2>Users:</h2>
    //   <ul>
    //     {users.map((user) => (
    //       <li key={user}>{user}</li>
    //     ))}
    //   </ul> 

    //   <h2>Messages:</h2>
      
    //   <div className="message-list">
    //     {messages  && messages.map((message, index) => (
    //       <div className="message" key={index}>
    //         <p className="message-text"> Message: {message.message}</p>
    //         <p className="message-details">
    //           <span> Sender: {message.senderName} </span> 
    //           <span> Time: {new Date(message.createdAt).toLocaleString()} </span>
    //         </p>
    //       </div>
    //     ))}
    //   </div>

    //   <form onSubmit={handleSubmit}>
    //     <input
    //       type="text"
    //       value={newMessage}
    //       onChange={(event) => setNewMessage(event.target.value)}
    //     />
    //     <button type="submit"> Send </button>
    //   </form>


    // <button onClick={handleExit}> Exit </button>
    // </div>
  );
};

export default Room;