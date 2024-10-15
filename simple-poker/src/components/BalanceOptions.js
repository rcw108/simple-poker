import React, { useState } from 'react';
import './BalanceOptions.css';

const BalanceOptions = () => {
  const [amount, setAmount] = useState('');

  const handleAddMoney = () => {
    // Logic to handle adding money
    console.log(`Adding ${amount} to the account`);
  };

  const handleWithdrawMoney = () => {
    // Logic to handle withdrawing money
    console.log(`Withdrawing ${amount} from the account`);
  };

  return (
    <div className="balance-options">
      <h2>Balance Options</h2>

      <div className="balance-actions">
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={handleAddMoney}>Add Money</button>
        <button onClick={handleWithdrawMoney}>Withdraw Money</button>
      </div>
    </div>
  );
};

export default BalanceOptions;
