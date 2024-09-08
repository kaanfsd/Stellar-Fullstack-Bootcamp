import { useState, useEffect } from "react";
import { getAccount, sendFunds, sendMultiFunds, fetchPayments, fetchTransactions, sendMultiFunds2 , fetchAllTransactionsAndPayments} from "./stellar";


const Account = ({ publicKey, secretKey , onGoBack }) => {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [destination, setDestination] = useState({ id: "", amount: "" });
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);  // Etiketler için state
  const [isSwitchOn, setIsSwitchOn] = useState(false); // Switch butonunun durumu

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const accountData = await getAccount(publicKey);
        setAccount(accountData);
      } catch (error) {
        console.error("Failed to load account data:", error);
      }
    };

    loadAccountData();
  }, [publicKey]);


  useEffect(() => {
    const loadPaymentsAndTransactions = async () => {
      try {
        const payments = await fetchPayments(publicKey); // Ödeme işlemlerini getir
        const transactions = await fetchTransactions(publicKey); // Diğer işlemleri getir
        const allTransactions = [...payments.sentPayments, ...transactions];
        
        const paymentTransactions = allTransactions.filter(transaction => transaction.type === "payment");
        setTransactions(paymentTransactions);  // Tüm işlemleri birleştir ve state'e ata
      } catch (error) {
        console.error("Failed to load transactions and payments:", error);
      }
    };

    loadPaymentsAndTransactions();
  }, [publicKey]);


  const changeToFrom = async () => {
    if (isSwitchOn) {
      try {
        const payments = await fetchPayments(publicKey); // Ödeme işlemlerini getir
        const transactions = await fetchTransactions(publicKey); // Diğer işlemleri getir
        const allTransactions = [...payments.sentPayments, ...transactions];

        const paymentTransactions = allTransactions.filter(transaction => transaction.type === "payment");
        
        setTransactions(paymentTransactions);  // Tüm işlemleri birleştir ve state'e ata
      } catch (error) {
        console.error("Failed to load transactions and payments:", error);
      }
    }else {
      try {

        const payments = await fetchPayments(publicKey); // Ödeme işlemlerini getir
        const transactions = await fetchTransactions(publicKey); // Diğer işlemleri getir
        const allTransactions = [ ...payments.receivedPayments, ...transactions];

        const receivedTransactions = allTransactions.filter(transaction => transaction.type === "payment");
        
        setTransactions(receivedTransactions);  // Tüm işlemleri birleştir ve state'e ata
      } catch (error) {
        console.error("Failed to load transactions and payments:", error);
      }
    }
    
  };

  const loadAccountSentTransactions = async() => {
    try {
      const payments = await fetchPayments(publicKey); // Ödeme işlemlerini getir
      const transactions = await fetchTransactions(publicKey); // Diğer işlemleri getir
      const allTransactions = [...payments.sentPayments, ...transactions];

      const paymentTransactions = allTransactions.filter(transaction => transaction.type === "payment");
      
      setTransactions(paymentTransactions);  // Tüm işlemleri birleştir ve state'e ata
    } catch (error) {
      console.error("Failed to load transactions and payments:", error);
    }
  }

  const loadAccountData = async () => {
    try {
      const accountData = await getAccount(publicKey);
      setAccount(accountData);
    } catch (error) {
      console.error("Failed to load account data:", error);
    }
  };
  
  const loadPayments = async () => {
    try {
      const payments = await fetchPayments(publicKey);
      setTransactions(payments);
    } catch (error) {
      console.error("Failed to load payment data:", error);
    }
  }

  const handleSendFunds = async (e) => {
    //e.preventDefault();
    setLoading(true);
    try {
      await sendFunds(destination.id, secretKey, destination.amount, destination.message);
      alert("Funds sent successfully!");
      fetchTransactions(publicKey);
      // setTransactions([...transactions, newTransaction]);
      await loadAccountData(); // Hesap verilerini güncelle
      await loadAccountSentTransactions()

    } catch (error) {
      console.error("Failed to send funds:", error);
      alert("Failed to send funds. See console for details.");
    }
    setLoading(false);
  };


  const handleKeyDownInput = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const value = event.target.value.trim();
      if (value && !tags.includes(value)) {
        setTags([...tags, value]);  // Yeni etiketi ekle
        setDestination({ ...destination, id: value });  // destination.id güncellenir
        event.target.value = '';  // Input alanını temizle
      }
    }
  };

  // Switch handler fonksiyonu
  const handleSwitchToggle = () => {
    setIsSwitchOn((prev) => !prev); // Switch state'ini değiştir
    changeToFrom();

  };


  const handleSendMultiFunds2 = async (e) => {
    //e.preventDefault();  // Form submit davranışını engelliyoruz (bunu kaldırmıştınız ama tekrar ekledim)
    setLoading(true);
    
    try {
      // tags'deki her değeri recipients array'ine ekle
      const recipients = tags.map((tag) => ({
        destinationID: tag,
        amount: destination.amount  // Burada her tag için amount aynı olarak kullanılıyor
      }));
      
      // sendMultiFunds fonksiyonuna recipients dizisini gönderiyoruz
      await sendMultiFunds(recipients, secretKey, destination.message);
  
      alert("Funds sent successfully to multiple recipients!");
      const newTransactions = recipients.map((recipient) => ({
        amount: recipient.amount,
        to: recipient.destinationID,
        timestamp: new Date().toISOString(),
        message: destination.message || "No message"
      }));
      
      // Yeni işlemleri mevcut transactions array'ine ekleyin
      
      setTransactions([...transactions, ...newTransactions]);
      fetchTransactions(publicKey); // İşlem sonrası güncel verileri çek
      await loadAccountSentTransactions();
      await loadAccountData();
    } catch (error) {
      console.error("Failed to send funds to multiple recipients:", error);
      alert("Failed to send funds. See console for details.");
    } finally {
      setLoading(false); // İşlem tamamlandığında loading'i false yap
    }
  };
  

  // Etiket ekleme fonksiyonu
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const value = event.target.value.trim();
      if (value && !tags.includes(value)) {
        setTags([...tags, value]);  // Yeni etiketi ekle
        event.target.value = '';  // Input alanını temizle
      }
    }
  };


  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));  // Etiketin değerine göre filtrele
  };


  const formatTag = (tag) => {
    if (tag.length > 8) {
      return `${tag.substring(0, 4)}...${tag.substring(tag.length - 4)}`;
    }
    return tag; // Eğer string zaten çok kısaysa, direkt döndürüyoruz
  };
  
  

  return (

<div>
  
  <h3>Wallet Details</h3>
  {account ? (
    <div>
      <p>
        <b>Public Key:</b> {publicKey}
      </p>
      <p>
        <b>Balance:</b>{" "}
        {account.balances.map((balance, index) => (
          <span key={index}>
            {balance.balance} {balance.asset_type === "native" ? "XLM (lumens)" : balance.asset_code}
          </span>
        ))}
      </p>
      <hr />
      <h4>Send Funds</h4>
      <textarea
        placeholder="Enter a message (optional)"
        value={destination.message || ""}
        onChange={(e) => setDestination({ ...destination, message: e.target.value })}
        rows="4"
        cols="50"
        className="input-message"
      />
    
      <form onSubmit={(e) => {
    e.preventDefault();
    if (tags.length === 1) {
      handleSendFunds();  // Eğer sadece bir etiket varsa
    } else if (tags.length > 1) {
      handleSendMultiFunds2();  // Birden fazla etiket varsa
    }
  }}>
      <div className="tag-input">
        {/* Etiketleri göster */}
        {tags.map((tag, index) => (
          <div className="tag" key={index} >
             {formatTag(tag)}
            <span className="remove" onClick={() => removeTag(tag)}>&times;</span>
          </div>
        ))}
        {/* Yeni etiket eklemek için input */}
        <input
          type="text"
          className="input-field"
          onKeyDown={handleKeyDownInput}
          placeholder="Enter Recipient Public Key and press Enter"
        />
      </div>
        <input
          type="number"
          placeholder="Amount"
          value={destination.amount}
          onChange={(e) => setDestination({ ...destination, amount: e.target.value })}
          className="input-field"
        />
        <button disabled={loading} type="submit" className="button">
          Send Funds
        </button>
        <button onClick={onGoBack} className="button go-back-button">Go Back</button>
      </form>
      
    </div>
  ) : (
    <p>Loading account data...</p>
  )}
  <hr />
  {/* Switch Butonu */}
  <div className="switch-container">
            <label className="switch">
              <input type="checkbox" checked={isSwitchOn} onChange={handleSwitchToggle} />
              <span className="slider"></span>
            </label>
            <p>Switch to see {isSwitchOn ? "Sent" : "Received"} Transactions</p>
          </div>
  <h4>{isSwitchOn ? "Received" : "Sent"} Transactions</h4>
  <div>
  <div className="card-list">
    {transactions.length ? (
      transactions.map((transaction, index) => (
        <article className="card" key={index}>
          <div className="card-header">
            <a href="#">{transaction.memo || `Transaction ${index + 1}`}</a>
          </div>
          <div className="card-footer">
            <div className="card-meta card-meta--views">
              {transaction.amount} XLM
            </div>
            <div className="card-meta card-meta--date">
              {transaction.timestamp}
            </div>
            <div className="card-meta card-meta--to">
            {isSwitchOn ? "Received from" : "Sent to"}  {formatTag(transaction.to)}
            </div>
          </div>
        </article>
      ))
    ) : (
      <p>No transactions found.</p>
    )}
  </div>
</div>

</div>

)};

export default Account;