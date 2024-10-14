import React, { useEffect, useState } from 'react';
import PokerTable from './components/PokerTable';
import { TelegramProvider, useTelegram } from './TelegramProvider';

function AppContent() {
  const { user, webApp } = useTelegram();
  const [isTelegramWebAppDetected, setIsTelegramWebAppDetected] = useState(false);

  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); // Notify Telegram that the app is ready
  
      // Extract user data from the WebApp
      const initData = tg.initData; // Authenticated data
      const initDataUnsafe = tg.initDataUnsafe; // User data
      
      console.log('Telegram Init Data:', initData);
      console.log('Telegram User Data:', initDataUnsafe);
  
      // Send user data to the backend
      fetch('http://localhost:3001/api/verifyUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData,  // Authenticated Telegram data
          initDataUnsafe,  // Telegram user data
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log('User verified and added to the database:', data);
          } else {
            console.error('Error verifying user:', data.message);
          }
        })
        .catch((error) => {
          console.error('Error sending data to the backend:', error);
        });
    } else {
      console.error('Telegram WebApp is not available.');
    }
  }, []);

  if (!isTelegramWebAppDetected) {
    return <div>Make sure this web app is opened in Telegram client.</div>;
  }

  return (
    <div className="App">
      {user ? (
        <div>
          <PokerTable />
        </div>
      ) : (
        <div>Loading Telegram user data...</div>
      )}
    </div>
  );
}

function App() {
  return (
    <TelegramProvider>
      <AppContent />
    </TelegramProvider>
  );
}

export default App;