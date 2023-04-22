import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import '../style.css'

import socketIOClient from "socket.io-client";
const ENDPOINT = "http://localhost:8080";
const frontPort = 8080;

var socket = socketIOClient(ENDPOINT,{
  transports: [ "websocket", 'polling' ]
})

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit =  (e) => {
    e.preventDefault();
    fetch(`http://localhost:${frontPort}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    })
      .then(async response => {
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error);
          throw new Error('Network response was not ok');
        }
        console.log('Data saved to database');
        alert("New user created Successfully!!!");
        navigate('/signin'); 
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  };

  return (
    <div className="signup-form-container">
      <h1 className="signup-form-heading">Create A New User</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <br />
        <label>
          Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <br />
        <label>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <br />
        <button type="submit">Submit</button>
        {error && <div style={{color:"red" }}>{error}</div>}

      </form>
      <p>
        Already have an account? <Link to="/signin">Sign In</Link>
      </p>
    </div>
  );
}

export default Signup;