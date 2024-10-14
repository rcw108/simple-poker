import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PokerTable from './components/PokerTable';
import TopUpPage from './components/TopUpPage';

function App() {
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand(); // Expands the web app to full screen
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main Poker Table route */}
          <Route path="/" element={<PokerTable />} />

          {/* Top Up Page route */}
          <Route path="/topup" element={<TopUpPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
