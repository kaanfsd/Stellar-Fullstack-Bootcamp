import { useState } from "react";
import { createAndFundWallet } from "./stellar";
import Account from './Account';

const App = () => {
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState({ publicKey: "", secretKey: "" });
  const [inputKeys, setInputKeys] = useState({ publicKey: "", secretKey: "" });
  const [showAccount, setShowAccount] = useState(false);

  const handleCreateWallet = async () => {
    setLoading(true);
    try {
      const { publicKey, secretKey } = await createAndFundWallet();
      setWallet({ publicKey, secretKey });
      setShowAccount(true);
    } catch (error) {
      console.error("Failed to create and fund wallet:", error);
    }
    setLoading(false);
  };

  const handleUseExistingWallet = () => {
    if (inputKeys.publicKey && inputKeys.secretKey) {
      setWallet(inputKeys);
      setShowAccount(true);
    } else {
      alert("Please enter both public and secret keys.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputKeys((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoBack = () => {
    setShowAccount(false);  
    setWallet({ publicKey: "", secretKey: "" });  
  };

  return (
    
    <div>
      <div className="header">
  <div className="logo-container">
    <img src="https://cryptologos.cc/logos/stellar-xlm-logo.svg?v=033" alt="Logo" className="logo" />
  </div>
  <h1>Stellar Fullstack Bootcamp - Kaan Özkan</h1>
</div>
      {!wallet.publicKey ? (
        <>
          <button onClick={handleCreateWallet} disabled={loading} className="button">
            Create Wallet
          </button>
          <div>
            <h3>Or Use an Existing Wallet</h3>
            <input
              type="text"
              name="publicKey"
              className="input-field"
              placeholder="Enter Public Key"
              value={inputKeys.publicKey}
              onChange={handleChange}
            />
            <input
              type="password"
              name="secretKey"
              className="input-field"
              placeholder

="Enter Secret Key"
              value={inputKeys.secretKey}
              onChange={handleChange}
            />
            <button onClick={handleUseExistingWallet} disabled={loading} className="button">
              Use Wallet
            </button>
          </div>
        </>
      ) : (
        <Account publicKey={wallet.publicKey} secretKey={wallet.secretKey} onGoBack={handleGoBack} />
      )}
    </div>
  );
};

export default App;
