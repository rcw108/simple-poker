import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {QRCodeSVG} from 'qrcode.react'; // To display the QR code for payment
import './BalanceOptions.css';
import { API_BASE_URL } from '../config';

const BalanceOptions = () => {
  const [amount, setAmount] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [depositComment, setDepositComment] = useState('');
  const [depositStatus, setDepositStatus] = useState('Awaiting deposit...');
  const navigate = useNavigate();
  const userId = '299283124'; // This should be dynamically set based on the logged-in user

  useEffect(() => {
    // Fetch the deposit address from the backend when the page loads
    fetch(`${API_BASE_URL}/api/getDepositAddress?userId=${userId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setDepositAddress(data.address);
          setDepositComment(data.comment); // The comment will be used to identify the user
        } else {
          setDepositStatus('Error retrieving deposit information');
        }
      })
      .catch((error) => {
        console.error('Error fetching deposit address:', error);
        setDepositStatus('Error retrieving deposit information');
      });
  }, [userId]);

  const handleAddMoney = () => {
    // The user will be prompted to send the money to the TON wallet
    console.log(`Add money using TON wallet to ${depositAddress} with comment ${depositComment}`);
  };

  const handleWithdrawMoney = () => {
    // Withdraw logic here (you may integrate backend logic)
    console.log(`Withdrawing ${amount} from the account`);
    navigate('/');
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="balance-options">
      <h2>Balance Options</h2>

      <div className="balance-actions">
        {/* Input for the user to enter the amount */}
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={handleAddMoney}>Add Money</button>
        <button onClick={handleWithdrawMoney}>Withdraw Money</button>
      </div>

      {/* Display deposit information */}
      <div className="deposit-info">
        <h3>Deposit TON USDT</h3>
        <p>Send TON USDT to the following address:</p>
        <code>{depositAddress}</code>
        <p>Include this comment in your transaction:</p>
        <code>{depositComment}</code>
        <div>
          {/* Generate QR code for easy payment */}
          <QRCodeSVG  value={`ton://transfer/${depositAddress}?amount=${amount}&text=${depositComment}`} />
        </div>
        <p>{depositStatus}</p>
      </div>

      <div className="return-home">
        <button onClick={handleReturnHome}>Return Home</button>
      </div>
    </div>
  );
};

export default BalanceOptions;
