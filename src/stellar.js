import * as StellarSdk from "@stellar/stellar-sdk";

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
  const pair = StellarSdk.Keypair.random(); 
  const publicKey = pair.publicKey(); 
  const secretKey = pair.secret(); 

  try {
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
  const sourceKeys = StellarSdk.Keypair.fromSecret(secretKey); 
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
  const sourceKeys = StellarSdk.Keypair.fromSecret(secretKey); 

  try {
    
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());

    
    for (const destinationID of recipients) {
      try {
        
        await server.loadAccount(destinationID);

        
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
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
          .addMemo(StellarSdk.Memo.text("Multi-account Transaction"))
          .setTimeout(180)
          .build();

        transaction.sign(sourceKeys); 
        const result = await server.submitTransaction(transaction); 

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

      await sendFunds(destinationID, secretKey, amount);
    }

    console.log("All funds sent successfully!");
    return "All transactions completed successfully";
  } catch (error) {
    console.error("Error submitting multiple transactions:", error);
    throw error;
  }
}

export async function sendMultiFunds(recipients, secretKey, message) {
  const sourceKeys = StellarSdk.Keypair.fromSecret(secretKey); 
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

      
      transaction = transactionBuilder
        .addMemo(StellarSdk.Memo.text(message || "Multi Transaction"))
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

export const fetchAllTransactionsAndPayments = async (publicKey) => {
  try {
    const [paymentsResponse, transactionsResponse] = await Promise.all([
      server.operations().forAccount(publicKey).limit(10).call(), 
      server.transactions().forAccount(publicKey).limit(10).call(), 
    ]);

    const payments = paymentsResponse.records;
    const transactions = transactionsResponse.records
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    return [...payments, ...transactions]; 
  } catch (error) {
    console.error("Error fetching transactions and payments:", error);
    return [];
  }
};


export async function fetchPayments(accountId) {
  try {
    const response = await fetch(
      `https://horizon-testnet.stellar.org/accounts/${accountId}/operations?limit=10&order=desc`
    );
    const data = await response.json();

    
    const payments = await Promise.all(
      data._embedded.records.map(async (op) => {
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
          memo: transactionData.memo, 
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
