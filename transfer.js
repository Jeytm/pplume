import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const RECEIVER = process.env.RECEIVER_ADDRESS;

if (!PRIVATE_KEY || !RPC_URL || !RECEIVER) {
  console.error("❌ PRIVATE_KEY, RPC_URL, atau RECEIVER_ADDRESS belum di-set di .env");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

async function sendAllFunds() {
  try {
    const balance = await provider.getBalance(wallet.address);
    const plumeBalance = ethers.formatEther(balance);
    console.log(`\n[💰] Saldo: ${plumeBalance} PLUME`);

    const minAmount = ethers.parseEther("8000");

    if (balance < minAmount) {
      console.log("[⏸] Saldo kurang dari 8000 PLUME, tidak ditransfer.");
      return;
    }

    const gasPriceHex = await provider.send("eth_gasPrice", []);
    const gasPrice = BigInt(gasPriceHex);
    const gasLimit = 21000n;
    const totalGasCost = gasPrice * gasLimit;

    const amountToSend = balance - totalGasCost;

    if (amountToSend <= 0n) {
      console.log("[⚠️] Saldo tidak cukup setelah dipotong gas.");
      return;
    }

    console.log(`[📤] Mengirim: ${ethers.formatEther(amountToSend)} PLUME`);
    console.log(`[⛽] Biaya gas: ${ethers.formatEther(totalGasCost)} PLUME`);
    console.log(`[➡️] Ke: ${RECEIVER}`);

    const tx = await wallet.sendTransaction({
      to: RECEIVER,
      value: amountToSend,
      gasLimit,
      gasPrice,
    });

    console.log(`[⏳] Tx dikirim. Hash: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`[✅] Transaksi sukses! Block: ${receipt.blockNumber}`);

    const sisa = await provider.getBalance(wallet.address);
    console.log(`[📉] Sisa saldo: ${ethers.formatEther(sisa)} PLUME`);
  } catch (err) {
    console.error("[❌] Error saat transfer:", err);
  }
}

(async () => {
  while (true) {
    console.log(`[🔄] Mengecek saldo... ${new Date().toLocaleString()}`);
    await sendAllFunds();
    await new Promise(res => setTimeout(res, 10_000)); // jeda 10 detik
  }
})();
