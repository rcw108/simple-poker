import React from 'react';
import PokerTable from './components/PokerTable';
import { TelegramProvider, useTelegram } from './TelegramProvider';

function AppContent() {
  const { user, webApp } = useTelegram();

  // Debug: Log Telegram WebApp data and user data
  console.log('User:', user);
  console.log('WebApp:', webApp);

  return (
    <div className="App">
      {user ? (
        <div>
          <h1>Welcome {user.username}</h1>
          <PokerTable />
        </div>
      ) : (
        <div>Make sure this web app is opened in Telegram client</div>
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
