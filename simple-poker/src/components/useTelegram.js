import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

export const useTelegram = (setBank) => {
  const [telegramUser, setTelegramUser] = useState(null);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositComment, setDepositComment] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [balanceError, setBalanceError] = useState(null);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); // Ensure the WebApp is ready

      const initData = tg.initData;
      const initDataUnsafe = tg.initDataUnsafe;

      if (initDataUnsafe && initDataUnsafe.user) {
        setTelegramUser(initDataUnsafe.user);

        // Only fetch balance if setBank is provided
        if (typeof setBank === 'function') {
          // Fetch user balance from backend
          const balanceUrl = `${API_BASE_URL}/api/getBalance?userId=${initDataUnsafe.user.id}`;
          console.log('[useTelegram] Fetching balance from:', balanceUrl);
          console.log('[useTelegram] User ID:', initDataUnsafe.user.id);
          
          fetch(balanceUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          })
            .then(async (res) => {
              console.log('[useTelegram] Balance response status:', res.status, res.statusText);
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }
              // Check if response is JSON
              const contentType = res.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
              }
              return res.json();
            })
            .then((data) => {
              console.log('[useTelegram] Balance response data:', data);
              if (data.success) {
                // Update the bank balance in the parent component via setBank
                const balance = data.balance ?? 300;
                console.log('[useTelegram] Initial balance loaded from backend:', balance);
                setBank(balance);
                setBalanceError(null); // Clear error on success
              } else {
                const errorMsg = data.message || 'Failed to fetch balance from server';
                console.error('[useTelegram] Error fetching balance:', errorMsg);
                setBalanceError(errorMsg);
                if (typeof setBank === 'function') {
                  setBank(0); // Set default balance on error
                }
              }
            })
            .catch((error) => {
              const errorMsg = error.message || 'Network error while fetching balance';
              console.error('[useTelegram] Error fetching balance:', error);
              console.error('[useTelegram] Error details:', {
                message: error.message,
                stack: error.stack,
                url: balanceUrl
              });
              setBalanceError(`${errorMsg}. URL: ${balanceUrl}`);
              if (typeof setBank === 'function') {
                setBank(0); // Set default balance on error
              }
            });
        }
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
    balanceError,
  };
};
