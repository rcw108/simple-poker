import { useEffect, useState } from 'react';

export const useTelegram = (setBank) => {
  const [telegramUser, setTelegramUser] = useState(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositComment, setDepositComment] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  useEffect(() => {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); // Ensure the WebApp is ready

      // Extract user data from the WebApp
      const initData = tg.initData;
      const initDataUnsafe = tg.initDataUnsafe;

      console.log('Telegram Init Data:', initData);
      console.log('Telegram User Data:', initDataUnsafe);

      if (initDataUnsafe && initDataUnsafe.user) {
        // Set the Telegram user if found
        setTelegramUser(initDataUnsafe.user);

        // Fetch user balance from backend
        fetch(`http://localhost:3001/api/getBalance?userId=${initDataUnsafe.user.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setBank(data.balance); // Set the user's balance in the state
            } else {
              console.error('Error fetching balance:', data.message);
            }
          })
          .catch((error) => {
            console.error('Error fetching balance:', error);
          });
      } else {
        console.error('Telegram User data is missing.');
      }
    } else {
      console.error('Telegram WebApp is not available.');
    }
  }, [setBank]);

  return {
    telegramUser,
    depositAddress,
    depositComment,
    withdrawAmount,
    setWithdrawAmount,
    withdrawAddress,
    setWithdrawAddress,
  };
};
