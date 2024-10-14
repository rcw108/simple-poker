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
      setIsTelegramWebAppDetected(true);
      console.log('Telegram WebApp detected and ready');
    } else {
      console.error('Telegram WebApp is not available');
    }
  }, []);

  if (!isTelegramWebAppDetected) {
    return <div>Make sure this web app is opened in Telegram client.</div>;
  }

  return (
    <div className="App">
      {user ? (
        <div>
          <h1>Welcome {user.username}</h1>
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
