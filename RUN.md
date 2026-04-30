# Cold Chain Provenance UI - Run Instructions

This project is a modern React + Tailwind UI for a blockchain-based cold chain workflow system.

## Prerequisites
- **Node.js**: Make sure you have Node.js installed.
- **MetaMask**: You need the MetaMask browser extension installed to connect your wallet and access the application.

## How to Run the Project

1. **Navigate to the Project Directory**
   Open your terminal and navigate to the project folder:
   ```bash
   cd /Users/sureshkumar/hack_block
   ```

2. **Install Dependencies** (if you haven't already)
   ```bash
   npm install
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   Once the server starts, open your browser and navigate to:
   **[http://localhost:5173](http://localhost:5173)**

## How to Use the App
1. When you open the app, click **Connect MetaMask** and approve the connection in your wallet.
2. Select a **Role** (e.g., Manufacturer, Carrier, Warehouse) to enter the workflow view.
3. Use the visual pipeline on the left to navigate through different stages.
4. Interact with the forms on the right. Modifying previously set common fields will trigger the mismatch/validation logic.
