import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const updateCurrentUser = (currentUser) => {
    setUser(currentUser);
    localStorage.setItem("user", JSON.stringify(currentUser));
  };

  return (
    <UserContext.Provider value={{ user, updateCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};