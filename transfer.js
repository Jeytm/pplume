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
      console.log("[⏸] Saldo < 8000 PLUME, tidak dikirim.");
      return;
    }

    const gasPriceHex = await provider.send("eth_gasPrice", []);
    const gasPrice = BigInt(gasPriceHex);
    const gasLimit = 21000n;
    const totalGasCost = gasPrice * gasLimit;

    const amountToSend = balance - totalGasCost;

    if (amountToSend <= 0n) {
      console.log("[⚠️] Saldo tidak cukup setelah gas.");
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

    console.log(`[⏳] TX hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[✅] TX berhasil! Block: ${receipt.blockNumber}`);

    const sisa = await provider.getBalance(wallet.address);
    console.log(`[📉] Sisa: ${ethers.formatEther(sisa)} PLUME`);
  } catch (err) {
    console.error("[❌] Error:", err.message);
  }
}

(async () => {
  while (true) {
    console.log(`[🔄] Cek saldo... ${new Date().toLocaleString()}`);
    await sendAllFunds();
    // tanpa delay
  }
})();
