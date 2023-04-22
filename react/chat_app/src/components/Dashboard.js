import React, { useContext ,useState, useEffect} from 'react';
import {UserContext} from '../contexts/UserContext';
import { useNavigate } from "react-router-dom";
import '../style.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faUsers } from '@fortawesome/free-solid-svg-icons'

import socketIOClient from "socket.io-client";
const ENDPOINT = "http://localhost:8080";
const frontPort = 8080;

var socket = socketIOClient(ENDPOINT,{
  transports: [ "websocket", 'polling' ]
})


function Dashboard() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  
  const [loggedInUsers, setLoggedInUsers] = useState([]);
  const [rooms, setRooms] = useState([]);

  // list of currently logged in users and rooms
  useEffect(() => {
    
    const fetchData = async () => {
      const response = await fetch(`http://localhost:${frontPort}/api/users`);
      const data = await response.json();
      setLoggedInUsers(data);
    };
    fetchData();

    async function fetchRooms() {
      const response = await fetch(`http://localhost:${frontPort}/api/rooms`);
      const data = await response.json();
      setRooms(data.rooms);
    }
    fetchRooms();

    socket.on("logged-users", (msg) => {
      console.log("list",msg);
      
      let data = JSON.parse(msg)
      
      const uniquedata = data.filter((elem, pos) => {
        return data.indexOf(elem) == pos;})

      setLoggedInUsers(uniquedata);
    });
    
    socket.on('room', msg =>{
      const data = JSON.parse(msg)
      setRooms(data);
    })

    return () => {
      socket.off("logged-users");
      socket.off("room");
    };

  }, []);

  
  const handleLogout = () => {
    // setUser(null);
    localStorage.removeItem("user");
    socket.emit("logout", user.name);
    navigate('/signin');
  };

  const [name, setRoomName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    console.log("React: ", user.name);
    try {
      const response = await fetch(`http://localhost:${frontPort}/api/rooms/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: user.name })
      });

      const data = await response.json();

      console.log("Received");
      
      // Do something with the response data
      navigate(`/room/${name}`);
    } 
    
    catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="dash-container">
      <h1 className="signup-form-heading">Welcome to The Distributed Chat Application</h1>
      <div className="app-container">
      <div id="login-status">
        {user ? (
          <p>Logged in as: {user.name}</p>
        ) : (
          <p>Not logged in yet</p>
        )}
      </div>
      <div id="create-room">
        <form onSubmit={handleSubmit}>
          <label htmlFor="room-name-input">Room name:</label>
          <input
            type="text"
            id="room-name-input"
            value={name}
            onChange={(event) => setRoomName(event.target.value)}
          />
          <button type="submit">Join room</button>
        </form>
        <br/>
        <button id="logout-button" onClick={handleLogout} style={{ backgroundColor: "red", color: "white", display: "block", margin: "auto" }}>Logout</button>
      </div>
      <div id="logged-in-users">
          <h2>Current Users:</h2>
          <ul >
            {loggedInUsers.map((user) => (
              <li key={user}>
                <FontAwesomeIcon icon={faUser} />
                {user}
              </li>
            ))}
          </ul>
      </div>
        <div id="created-rooms">
          <h2>Current Rooms:</h2>
          <ul>
            {rooms.map((room) => (
              // <li key={room._id}>{room.name}</li>
              <li key={room._id}>
                <FontAwesomeIcon icon={faUsers} /> {room.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
        {/* {error && <div className="error">{error}</div>} */}
      </div>
  );
}

export default Dashboard;