import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

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
        fetch(`${API_BASE_URL}/api/getBalance?userId=${initDataUnsafe.user.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              // Update the bank balance in the parent component via setBank
              const balance = data.balance ?? 300;
              console.log('Initial balance loaded from backend:', balance);
              setBank(balance);
            } else {
              console.error('Error fetching balance:', data.message);
              setBank(0); // Set default balance on error
            }
          })
          .catch((error) => {
            console.error('Error fetching balance:', error);
            setBank(0); // Set default balance on error
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
