import React from 'react';
import { Link } from 'react-router-dom';
import '../style.css';

import socketIOClient from "socket.io-client";
const ENDPOINT = "http://localhost:8080";
const frontPort = 8080;

var socket = socketIOClient(ENDPOINT,{
  transports: [ "websocket", 'polling' ]
})

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Distributed Chat Application Project Summer'23</h1>
        <p>We are Team Number 51 and build the best</p>
        <p>Sign up or sign in to get started </p>
        <div className="home-buttons">
          <Link to="/signup"><button>Sign Up</button></Link>
          <Link to="/signin"><button>Sign In</button></Link>
        </div>
      </div>
    </div>
  );
}

export default Home;