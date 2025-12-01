import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const TopUpInGame = () => {
  const [userId] = useState('test_user');  // Hardcoding the userId for testing
  const [depositAddress, setDepositAddress] = useState(null);
  const [depositComment, setDepositComment] = useState(null);

  const handleTopUp = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/getDepositAddress`, {
        params: { userId },  // Hardcoded value is passed here
      });
      if (response.data.success) {
        setDepositAddress(response.data.address);
        setDepositComment(response.data.comment);
      } else {
        console.error('Failed to fetch deposit address');
      }
    } catch (error) {
      console.error('Error getting deposit address:', error);
    }
  };

  return (
    <div>
      <button onClick={handleTopUp}>Top Up</button>
      {depositAddress && (
        <div>
          <p><strong>Send TON to:</strong> {depositAddress}</p>
          <p><strong>Include this comment (User ID):</strong> {depositComment}</p>
        </div>
      )}
    </div>
  );
};

export default TopUpInGame;
