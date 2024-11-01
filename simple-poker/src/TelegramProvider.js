import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

const TelegramContext = createContext({});


export const TelegramProvider = ({ children }) => {
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (app) {
      app.ready(); // Notify Telegram that the WebApp is ready
      setWebApp(app); // Set the WebApp instance to state
    }
  }, []);

  const value = useMemo(() => {
    if (webApp) {
      return {
        webApp,
        user: webApp.initDataUnsafe.user, // Extract user data
      };
    }
    return {};
  }, [webApp]);

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
};

// Custom hook to access the Telegram context
export const useTelegram = () => useContext(TelegramContext);
