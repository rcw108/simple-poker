import React, { useEffect } from 'react';
import PokerTable from './components/PokerTable';

function App() {
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand(); // Expands the web app to full screen
      // You can also access user's data here if needed, for example:
      // console.log(tg.initDataUnsafe.user);
    }
  }, []);

  return (
    <div className="App">
      <PokerTable />
    </div>
  );
}

export default App;