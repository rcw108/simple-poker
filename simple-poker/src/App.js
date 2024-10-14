import React, { useEffect, useState } from 'react';
import PokerTable from './components/PokerTable';
import { TelegramProvider, useTelegram } from './TelegramProvider';

function AppContent() {
  const { user, webApp } = useTelegram();
  const [isTelegramWebAppDetected, setIsTelegramWebAppDetected] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false); // Track if user verification is successful
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); // Notify Telegram that the app is ready
      setIsTelegramWebAppDetected(true); // Telegram WebApp detected

      // Extract user data from the WebApp
      const initData = tg.initData; // Authenticated data
      const initDataUnsafe = tg.initDataUnsafe; // User data

      console.log('Telegram Init Data:', initData);
      console.log('Telegram User Data:', initDataUnsafe);

      // Send user data to the backend for verification
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
            setIsUserVerified(true); // Mark user as verified
          } else {
            console.error('Error verifying user:', data.message);
            setIsUserVerified(false); // Mark user as not verified
          }
          setLoading(false); // Stop loading
        })
        .catch((error) => {
          console.error('Error sending data to the backend:', error);
          setIsUserVerified(false); // Mark user as not verified on error
          setLoading(false); // Stop loading
        });
    } else {
      console.error('Telegram WebApp is not available.');
      setIsTelegramWebAppDetected(false); // Telegram WebApp not detected
      setLoading(false); // Stop loading
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isTelegramWebAppDetected) {
    return <div>Make sure this web app is opened in Telegram client.</div>;
  }

  if (!isUserVerified) {
    return <div>Error verifying user. Please try again later.</div>;
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
