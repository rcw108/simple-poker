import React, { useEffect } from 'react';
import PokerTable from './components/PokerTable';

function App() {
  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand(); // Expands the web app to full screen

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
      // If Telegram WebApp is not available, log a message
      console.error('Telegram WebApp is not available.');
    }
  }, []);

  return (
    <div className="App">
      <PokerTable />
    </div>
  );
}

export default App;