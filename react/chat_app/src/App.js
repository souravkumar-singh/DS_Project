import React, { useState } from "react";
import {  BrowserRouter as Router,Routes ,Route, Link } from 'react-router-dom';

import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";
import {UserProvider} from './contexts/UserContext';
import Room from "./components/Room";
import Home from './components/Home';
import DM from "./components/DM";

function App() {
  return (
   <Router>
    <UserProvider>
      <Routes>
        <Route exact path="/" element={<Home/>} />     
        
        <Route exact path="/signup" element={<Signup />} />
        
        <Route exact path="/signin" element={<Signin  />} />
        
        <Route exact path="/dashboard" element={<Dashboard />} />

        <Route exact path="/room/:roomName" element={<Room />} />

        <Route exact path="/dm" element={<DM/>} />
      </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
