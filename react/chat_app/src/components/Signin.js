import React, { useState,useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {UserContext} from '../contexts/UserContext';
import '../style.css'

function Signin() {

  const { updateCurrentUser } = useContext(UserContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        // Login successful, do something here]
        console.log("Logged in successfully. Thanks for visiting your website. May you have a great day.");
        

        const data = await response.json();
        // Here's how you can access the user data from the response:
        const { name, email } = data;
        console.log(name, email);

        const user = { name: name }; // Replace with actual user data
        updateCurrentUser(user);
        
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Error logging in');
    }
  };

  return (
    <div className="login-form-container">
      <h1 className="login-form-heading">Chat Application LogIn Page</h1>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label>Email:</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit">Sign in</button>
        {error && <div style={{color:"red" }}>{error}</div>}
      </form>

      <p>
        Don't have an account? <Link to="/signup">Sign Up</Link>
      </p>
    </div>
  );
}

export default Signin;
