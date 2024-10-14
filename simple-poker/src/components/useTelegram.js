import { useEffect, useState } from 'react';

export const useTelegram = (setBank) => {
  const [telegramUser, setTelegramUser] = useState(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositComment, setDepositComment] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); // Ensure the WebApp is ready

      const initData = tg.initData;
      const initDataUnsafe = tg.initDataUnsafe;

      if (initDataUnsafe && initDataUnsafe.user) {
        setTelegramUser(initDataUnsafe.user);

        // Fetch user balance from backend
        fetch(`http://localhost:3001/api/getBalance?userId=${initDataUnsafe.user.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              // Update the bank balance in the parent component via setBank
              setBank(data.balance);
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
