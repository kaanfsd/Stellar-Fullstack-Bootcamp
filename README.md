# Stellar Fullstack Bootcamp

This is a full-stack project built as part of the **Stellar Fullstack Bootcamp**. The project demonstrates how to integrate a web application with the **Stellar blockchain** network. The app allows users to create and connect Stellar wallets, send payments, view transactions, and interact with the Stellar blockchain via the Freighter wallet and Horizon API.

## Features

- **Create New Wallet**: Generate a new Stellar wallet using Stellar's test network and fund it via the Friendbot service.
- **Connect to Existing Wallet**: Use an existing Stellar wallet by entering a public and secret key or connect to the Freighter wallet.
- **Send Payments**: Send Stellar Lumens (XLM) to other Stellar accounts. Supports single and multiple recipient transactions.
- **View Transactions**: Display recent transactions (payments and other operations) for the connected wallet.
- **Transaction Memos**: Send transaction memos along with payments.

## Technologies

- **Frontend**: React.js (JavaScript, JSX, CSS)
- **Blockchain**: Stellar (Horizon API, Freighter Wallet, Stellar SDK)
- **Styling**: Custom CSS with responsive design
- **API**: Fetching data using Stellar Horizon Testnet API

## Prerequisites
- Node.js (>=14.x) and npm (>=6.x) installed on your machine.
- npm install @stellar/stellar-sdk install the stellar sdk.

  ### Steps

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/your-username/stellar-fullstack-bootcamp.git
   cd wallet-project

2. **Install Dependencies**:

   ```bash
   git clone https://github.com/your-username/stellar-fullstack-bootcamp.git
   cd wallet-project
   npm install
   npm install @stellar/stellar-sdk

3. **Start the Application**:

   ```bash
   npm start

asd
## Usage

### Create a New Wallet

1. Click on the **Create Wallet** button to generate a new Stellar wallet.
2. The app will create a wallet using Stellar's Friendbot service and display the wallet's public and secret keys.
3. The newly created wallet will be funded with test XLM on the Stellar Testnet.

### Connect an Existing Wallet

1. To use an existing wallet, enter the **Public Key** and **Secret Key** in the provided input fields.
2. Click **Use Wallet** to load the wallet and view account details and transactions.
3. Alternatively, click on **Connect Freighter Wallet** to securely connect using the Freighter browser extension.

### Send Payments

1. Once connected, enter a **Recipient Public Key** and the **Amount** of XLM to send.
2. You can optionally add a **Memo** to the transaction.
3. Click **Send Funds** to send the payment. The transaction will be submitted to the Stellar network.
4. To send funds to multiple recipients, enter multiple public keys (one at a time) and click **Send Multiple Funds**.

### View Transactions

1. The **Transactions** section will display the 10 most recent transactions for the connected wallet.
2. Transaction details include the recipient, amount, timestamp, and any memos attached to the transaction.

### Stellar SDK & API Usage

- The app interacts with Stellar's blockchain using the **Stellar SDK** and **Horizon Testnet API**.
- Wallet creation, balance checks, payments, and other operations are done using the following:
  - **Stellar SDK** for creating and signing transactions.
  - **Horizon API** for querying accounts and submitting transactions.

### File Structure

  ```bash
     npm start
  ├── public
  │   └── stellarlogo.png          # Stellar logo for branding
  ├── src
  │   ├── Account.jsx              # React component for viewing account and transactions
  │   ├── App.jsx                  # Main entry point
  │   ├── MultipleFunds.jsx        # Component for handling multiple payments
  │   ├── stellar.js               # Stellar SDK integration
  │   └── index.js                 # ReactDOM render entry point
  ├── package.json                 # NPM package dependencies
  └── README.md                    # This README file




