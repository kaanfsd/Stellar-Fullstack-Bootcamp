import * as StellarSdk from "@stellar/stellar-sdk";

// Set up the Stellar server for the testnet
const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);

export const fetchTransactions = async (publicKey) => {
  try {
    const transactions = await server
      .transactions()
      .forAccount(publicKey)
      .limit(10)
      .call();

    return transactions.records
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10); // Array of transactions
  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
};

export async function createAndFundWallet() {
  const pair = StellarSdk.Keypair.random(); // Generate a random pair of public and secret keys
  const publicKey = pair.publicKey(); // Extract the public key
  const secretKey = pair.secret(); // Extract the secret key

  try {
    // Fund the new account using Friendbot
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );
    await response.json();

    return { publicKey, secretKey };
  } catch (error) {
    console.error("Failed to create and fund wallet:", error);
    throw error;
  }
}

export async function getAccount(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    return account;
  } catch (error) {
    console.error("Error loading account:", error);
    throw error;
  }
}

export async function sendFunds(destinationID, secretKey, amount, message) {
  const sourceKeys = StellarSdk.Keypair.fromSecret(secretKey); // Generate keypair from secret key
  let transaction;

  return server
    .loadAccount(destinationID)
    .catch((error) => {
      if (error instanceof StellarSdk.NotFoundError) {
        throw new Error("The destination account does not exist!");
      } else {
        throw error;
      }
    })
    .then(() => server.loadAccount(sourceKeys.publicKey()))
    .then((sourceAccount) => {
      transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destinationID,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString(),
          })
        )
        .addMemo(StellarSdk.Memo.text(message || "Transaction"))
        .setTimeout(180)
        .build();
      transaction.sign(sourceKeys);

      return server.submitTransaction(transaction);
    })
    .then((result) => result)
    .catch((error) => {
      console.error("Error submitting transaction:", error);
      throw error;
    });
}

export async function sendFundsToMultiple(recipients, secretKey, amount) {
  const sourceKeys = StellarSdk.Keypair.fromSecret(secretKey); // Generate keypair from secret key

  try {
    // Kaynağın (gönderen) hesabını yüklüyoruz
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());

    // Her bir alıcıya işlem yapacağız
    for (const destinationID of recipients) {
      try {
        // Her alıcının hesabını kontrol ediyoruz
        await server.loadAccount(destinationID);

        // İşlemi oluşturuyoruz
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
          .addOperation(
            StellarSdk.Operation.payment({
              destination: destinationID,
              asset: StellarSdk.Asset.native(),
              amount: amount.toString(), // Sabit miktar
            })
          )
          .addMemo(StellarSdk.Memo.text("Multi-account Transaction"))
          .setTimeout(180)
          .build();

        transaction.sign(sourceKeys); // İşlemi imzala
        const result = await server.submitTransaction(transaction); // İşlemi gönder

        console.log(`Transaction to ${destinationID} was successful`, result);
      } catch (error) {
        if (error instanceof StellarSdk.NotFoundError) {
          console.error(`Destination account ${destinationID} does not exist!`);
        } else {
          console.error(
            `Error processing transaction for ${destinationID}:`,
            error
          );
        }
      }
    }

    console.log("All transactions processed.");
  } catch (error) {
    console.error("Error in sending multiple funds:", error);
    throw error;
  }
}

export async function sendMultiFunds2(recipients, secretKey) {
  try {
    for (const recipient of recipients) {
      const { destinationID, amount } = recipient;

      // Her alıcıya tek tek sendFunds fonksiyonu ile ödeme yapıyoruz
      await sendFunds(destinationID, secretKey, amount);
    }

    console.log("All funds sent successfully!");
    return "All transactions completed successfully";
  } catch (error) {
    console.error("Error submitting multiple transactions:", error);
    throw error;
  }
}

// SONRADAN EKLENDİ
export async function sendMultiFunds(recipients, secretKey, message) {
  const sourceKeys = StellarSdk.Keypair.fromSecret(secretKey); // Generate keypair from secret key
  let transaction;

  return server
    .loadAccount(sourceKeys.publicKey())
    .then((sourceAccount) => {
      const transactionBuilder = new StellarSdk.TransactionBuilder(
        sourceAccount,
        {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        }
      );

      // Her bir alıcıya ödeme ekle
      recipients.forEach((recipient) => {
        const { destinationID, amount } = recipient;

        transactionBuilder.addOperation(
          StellarSdk.Operation.payment({
            destination: destinationID,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString(),
          })
        );
      });

      // İşlem inşası
      transaction = transactionBuilder
        .addMemo(StellarSdk.Memo.text(message || "Multi Transaction"))
        .setTimeout(180)
        .build();

      transaction.sign(sourceKeys); // İşlemi imzala
      return server.submitTransaction(transaction); // İşlemi gönder
    })
    .then((result) => result)
    .catch((error) => {
      console.error("Error submitting transaction:", error);
      throw error;
    });
}

export const fetchAllTransactionsAndPayments = async (publicKey) => {
  try {
    const [paymentsResponse, transactionsResponse] = await Promise.all([
      server.operations().forAccount(publicKey).limit(10).call(), // Ödeme operasyonları
      server.transactions().forAccount(publicKey).limit(10).call(), // Tüm işlemler
    ]);

    const payments = paymentsResponse.records;
    const transactions = transactionsResponse.records
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    return [...payments, ...transactions]; // İkisini birleştir
  } catch (error) {
    console.error("Error fetching transactions and payments:", error);
    return [];
  }
};

// export async function fetchPayments(accountId) {
//   try {
//     const response = await fetch(
//       `https://horizon-testnet.stellar.org/accounts/${accountId}/operations`
//     );
//     const data = await response.json();

//     const payments = data._embedded.records.map((op) => ({
//       type: op.type,
//       amount: op.amount,
//       asset:
//         op.asset_type === "native"
//           ? "lumens"
//           : `${op.asset_code}:${op.asset_issuer}`,
//       from: op.from,
//       to: op.to,
//       timestamp: op.created_at,
//     }));

//     const sentPayments = payments.filter(
//       (payment) => payment.from === accountId
//     );
//     const receivedPayments = payments.filter(
//       (payment) => payment.to === accountId
//     );

//     return { sentPayments, receivedPayments };
//   } catch (error) {
//     console.error("Error fetching payments:", error);
//     return { sentPayments: [], receivedPayments: [] };
//   }
// }

export async function fetchPayments(accountId) {
  try {
    const response = await fetch(
      `https://horizon-testnet.stellar.org/accounts/${accountId}/operations?limit=10&order=desc`
    );
    const data = await response.json();

    // Ödemeleri işleyelim
    const payments = await Promise.all(
      data._embedded.records.map(async (op) => {
        // İlgili transaction'ı almak için işlemi çekiyoruz
        const transaction = await fetch(op._links.transaction.href);
        const transactionData = await transaction.json();

        return {
          type: op.type,
          amount: op.amount,
          asset:
            op.asset_type === "native"
              ? "lumens"
              : `${op.asset_code}:${op.asset_issuer}`,
          from: op.from,
          to: op.to,
          timestamp: op.created_at,
          memo: transactionData.memo, // İşlemden gelen memoyu ekliyoruz
        };
      })
    );

    const sentPayments = payments.filter(
      (payment) => payment.from === accountId
    );
    const receivedPayments = payments.filter(
      (payment) => payment.to === accountId
    );

    return { sentPayments, receivedPayments };
  } catch (error) {
    console.error("Error fetching payments:", error);
    return { sentPayments: [], receivedPayments: [] };
  }
}
