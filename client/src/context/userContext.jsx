import React, { createContext, useState, useEffect } from "react";
import {
  checkLoginStatus,
  getUserDetails,
  logout,
} from "../services/authServices";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  const updateContext = async () => {
    try {
      const statusRes = await checkLoginStatus();

      if (statusRes.data?.verified) {
        const userRes = await getUserDetails();

        if (userRes.status === 200) {
          setUser(userRes.data);
          return;
        }
      }

      await logoutUser();
    } catch (error) {
      await logoutUser();
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsFetching(true);
      await updateContext();
      setIsFetching(false);
    };
    init();
  }, []);

  const loginUser = (userData) => {
    setUser(userData);
  };

  const logoutUser = async () => {
    setUser(null);
    await logout();
  };

  const updateUserInfo = (newUserInfo) => {
    setUser(newUserInfo);
  };

  const refreshUserContext = async () => {
    setIsFetching(true);
    updateContext();
    setIsFetching(false);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loginUser,
        logoutUser,
        updateUserInfo,
        isFetching,
        refreshUserContext,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
