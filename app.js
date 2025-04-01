// นำเข้า ABI จากไฟล์แยก
import bankABI from "./bankABI";

// ที่อยู่ของ Contract
// let bankContractAddress = "0x76097F223248F31971859e19277927b4C73F0c46";
let bankContractAddress = "0x90d24FB73aFe6D1C7fFe05B19a12BEbA38e42C04";

// ตัวแปรสำหรับเก็บ instance ของ contract และ web3
let bankContract;
let web3;
let currentAccount;
let isConnected = false;

// Elements
const accountInfoEl = document.getElementById("accountInfo");
const depositBtn = document.getElementById("depositBtn");
const withdrawBtn = document.getElementById("withdrawBtn");
const checkBalanceBtn = document.getElementById("checkBalanceBtn");
const balanceDisplay = document.getElementById("balanceDisplay");
const currentBalanceEl = document.getElementById("currentBalance");
const currentBalanceEthEl = document.getElementById("currentBalanceEth");
const depositAmountEl = document.getElementById("depositAmount");
const withdrawAmountEl = document.getElementById("withdrawAmount");
const transactionsEl = document.getElementById("transactions");
const statusModal = document.getElementById("statusModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const closeModalBtn = document.getElementById("closeModal");

// ข้อมูลส่วนตัว
const studentName = "นางสาวนริศรา จ่างสะเดา";
const studentId = "65039089";

// คอนสแตนต์สำหรับ localStorage
const TRANSACTIONS_STORAGE_KEY = "bankDappTransactions";

// เริ่มการทำงานเมื่อโหลดหน้าเว็บ
window.addEventListener("load", async () => {
  // ตรวจสอบว่ามี MetaMask หรือไม่
  if (window.ethereum) {
    try {
      web3 = new Web3(window.ethereum);

      // ขอสิทธิ์ในการเข้าถึง account
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // ตรวจสอบ account ที่ใช้งาน
      const accounts = await web3.eth.getAccounts();
      currentAccount = accounts[0];

      // สร้าง instance ของ contract
      bankContract = new web3.eth.Contract(bankABI, bankContractAddress);

      // แสดงข้อมูล account
      accountInfoEl.innerHTML = `
        <div>
          <p class="mb-2"><span class="font-semibold">Wallet Address:</span></p>
          <p class="text-lg font-mono font-semibold bg-blue-100 text-blue-800 py-2 px-4 rounded-lg">${currentAccount}</p>
        </div>
      `;

      isConnected = true;

      // ดักจับเหตุการณ์เมื่อมีการเปลี่ยน account
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      // ดักจับเหตุการณ์ (events) จาก contract
      listenForEvents();

      // โหลดประวัติธุรกรรมจาก localStorage
      loadTransactionsFromStorage();

      // ตรวจสอบยอดเงินทันทีเมื่อโหลดหน้า
      handleCheckBalance();
    } catch (error) {
      showError("การเชื่อมต่อกับ MetaMask ล้มเหลว", error.message);
    }
  } else {
    showError("ไม่พบ MetaMask", "กรุณาติดตั้ง MetaMask extension ก่อนใช้งาน");
  }

  // ตั้งค่า event listeners
  setupEventListeners();
});

// ตั้งค่า event listeners
function setupEventListeners() {
  depositBtn.addEventListener("click", handleDeposit);
  withdrawBtn.addEventListener("click", handleWithdraw);
  checkBalanceBtn.addEventListener("click", handleCheckBalance);
  closeModalBtn.addEventListener("click", () => {
    statusModal.classList.add("hidden");
  });
}

// จัดการเมื่อมีการเปลี่ยน account ใน MetaMask
async function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    showError(
      "ไม่ได้เชื่อมต่อกับ MetaMask",
      "กรุณาเชื่อมต่อ MetaMask ก่อนใช้งาน"
    );
    isConnected = false;
  } else {
    currentAccount = accounts[0];
    accountInfoEl.innerHTML = `
      <div>
        <p class="mb-2"><span class="font-semibold">Wallet Address:</span></p>
        <p class="text-lg font-mono font-semibold bg-blue-100 text-blue-800 py-2 px-4 rounded-lg">${currentAccount}</p>
      </div>
    `;
    isConnected = true;

    // เคลียร์ประวัติธุรกรรมเมื่อเปลี่ยนบัญชี
    clearTransactions();

    // โหลดประวัติธุรกรรมใหม่สำหรับบัญชีนี้
    loadTransactionsFromStorage();

    // ตรวจสอบยอดเงินใหม่เมื่อเปลี่ยนบัญชี
    handleCheckBalance();
  }
}

// ฟังก์ชันสำหรับ deposit
async function handleDeposit() {
  if (!isConnected) {
    showError(
      "ไม่ได้เชื่อมต่อกับ MetaMask",
      "กรุณาเชื่อมต่อ MetaMask ก่อนใช้งาน"
    );
    return;
  }

  const amount = depositAmountEl.value;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    showError("จำนวนไม่ถูกต้อง", "กรุณาระบุจำนวนเงินที่ต้องการฝากให้ถูกต้อง");
    return;
  }

  try {
    showStatus("กำลังฝากเงิน", "กรุณายืนยันธุรกรรมใน MetaMask");

    // แปลงจาก ETH เป็น Wei
    const amountInWei = web3.utils.toWei(amount, "ether");

    // เรียกใช้ฟังก์ชัน deposit
    await bankContract.methods.deposit().send({
      from: currentAccount,
      value: amountInWei,
    });

    showStatus("ฝากเงินสำเร็จ", `ฝากเงินจำนวน ${amount} ETH สำเร็จแล้ว`);
    depositAmountEl.value = "";

    // ตรวจสอบยอดเงินอัตโนมัติหลังฝากเงิน
    await handleCheckBalance();
  } catch (error) {
    showError("การฝากเงินล้มเหลว", error.message);
  }
}

// ฟังก์ชันสำหรับ withdraw
async function handleWithdraw() {
  if (!isConnected) {
    showError(
      "ไม่ได้เชื่อมต่อกับ MetaMask",
      "กรุณาเชื่อมต่อ MetaMask ก่อนใช้งาน"
    );
    return;
  }

  const amount = withdrawAmountEl.value;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    showError("จำนวนไม่ถูกต้อง", "กรุณาระบุจำนวนเงินที่ต้องการถอนให้ถูกต้อง");
    return;
  }

  try {
    showStatus("กำลังถอนเงิน", "กรุณายืนยันธุรกรรมใน MetaMask");

    // เรียกใช้ฟังก์ชัน withdraw
    await bankContract.methods.withdraw(amount).send({
      from: currentAccount,
    });

    const amountInEth = web3.utils.fromWei(amount, "ether");
    showStatus(
      "ถอนเงินสำเร็จ",
      `ถอนเงินจำนวน ${amount} Wei (${amountInEth} ETH) สำเร็จแล้ว`
    );
    withdrawAmountEl.value = "";

    // ตรวจสอบยอดเงินอัตโนมัติหลังถอนเงิน
    await handleCheckBalance();
  } catch (error) {
    showError("การถอนเงินล้มเหลว", error.message);
  }
}

// ฟังก์ชันสำหรับตรวจสอบยอดเงิน
async function handleCheckBalance() {
  if (!isConnected) {
    showError(
      "ไม่ได้เชื่อมต่อกับ MetaMask",
      "กรุณาเชื่อมต่อ MetaMask ก่อนใช้งาน"
    );
    return;
  }

  try {
    // ถ้าเรียกจากปุ่ม จะแสดง modal
    if (event && event.type === "click") {
      showStatus("กำลังตรวจสอบยอดเงิน", "กรุณารอสักครู่...");
    }

    // เรียกใช้ฟังก์ชัน checkBalance
    const balance = await bankContract.methods.checkBalance().call({
      from: currentAccount,
    });

    // แปลงจาก Wei เป็น ETH
    const balanceInEth = web3.utils.fromWei(balance, "ether");

    currentBalanceEl.textContent = balance;
    currentBalanceEthEl.textContent = balanceInEth;
    balanceDisplay.classList.remove("hidden");

    // ปิด modal ถ้าเปิดอยู่
    if (event && event.type === "click") {
      statusModal.classList.add("hidden");
    }

    return balance;
  } catch (error) {
    console.error("การตรวจสอบยอดเงินล้มเหลว", error.message);
    if (event && event.type === "click") {
      showError("การตรวจสอบยอดเงินล้มเหลว", error.message);
    }
    return 0;
  }
}

// ฟังก์ชันสำหรับแสดงสถานะ
function showStatus(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalTitle.classList.remove("text-red-600");
  statusModal.classList.remove("hidden");
}

// ฟังก์ชันสำหรับแสดงข้อผิดพลาด
function showError(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modalTitle.classList.add("text-red-600");
  statusModal.classList.remove("hidden");

  // รีเซ็ตกลับเป็นปกติหลังจาก 3 วินาที
  setTimeout(() => {
    modalTitle.classList.remove("text-red-600");
  }, 3000);
}

// ฟังก์ชันสำหรับฟังเหตุการณ์จาก contract
function listenForEvents() {
  // ฟังเหตุการณ์ Deposit
  bankContract.events
    .Deposit({
      filter: { owner: currentAccount },
    })
    .on("data", (event) => {
      const amount = event.returnValues.amount;
      const amountInEth = web3.utils.fromWei(amount, "ether");

      addTransaction(`ฝากเงิน ${amountInEth} ETH`);
    })
    .on("error", (error) => {
      console.error("Error in Deposit event:", error);
    });

  // ฟังเหตุการณ์ Withdraw
  bankContract.events
    .Withdraw({
      filter: { owner: currentAccount },
    })
    .on("data", (event) => {
      const amount = event.returnValues.amount;
      const amountInEth = web3.utils.fromWei(amount, "ether");

      addTransaction(`ถอนเงิน ${amountInEth} ETH`);
    })
    .on("error", (error) => {
      console.error("Error in Withdraw event:", error);
    });
}

// ฟังก์ชันสำหรับเพิ่มธุรกรรมใหม่
function addTransaction(text) {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  const dateString = now.toLocaleDateString();

  // สร้าง object ธุรกรรม
  const transaction = {
    id: Date.now(),
    time: timeString,
    date: dateString,
    text: text,
    account: currentAccount,
  };

  // ลบข้อความ "ยังไม่มีธุรกรรม" ถ้ามี
  if (transactionsEl.querySelector("p.text-gray-500")) {
    transactionsEl.innerHTML = "";
  }

  // เพิ่มธุรกรรมใหม่
  const txElement = document.createElement("div");
  txElement.className = "py-2";
  txElement.innerHTML = `
    <p><span class="font-semibold">${transaction.date} ${transaction.time}</span>: ${transaction.text}</p>
  `;

  transactionsEl.prepend(txElement);

  // บันทึกลง localStorage
  saveTransactionToStorage(transaction);
}

// ฟังก์ชันสำหรับบันทึกธุรกรรมลง localStorage
function saveTransactionToStorage(transaction) {
  // ดึงข้อมูลธุรกรรมเดิม
  let transactions = getTransactionsFromStorage();

  // เพิ่มธุรกรรมใหม่
  transactions.push(transaction);

  // เก็บเฉพาะ 20 รายการล่าสุด เพื่อไม่ให้ข้อมูลมากเกินไป
  if (transactions.length > 20) {
    transactions = transactions.slice(-20);
  }

  // บันทึกลง localStorage
  localStorage.setItem(
    `${TRANSACTIONS_STORAGE_KEY}_${currentAccount}`,
    JSON.stringify(transactions)
  );
}

// ฟังก์ชันสำหรับดึงข้อมูลธุรกรรมจาก localStorage
function getTransactionsFromStorage() {
  const storedData = localStorage.getItem(
    `${TRANSACTIONS_STORAGE_KEY}_${currentAccount}`
  );
  return storedData ? JSON.parse(storedData) : [];
}

// ฟังก์ชันสำหรับโหลดประวัติธุรกรรมจาก localStorage
function loadTransactionsFromStorage() {
  const transactions = getTransactionsFromStorage();

  if (transactions.length === 0) {
    // ถ้าไม่มีธุรกรรม ให้แสดงข้อความ
    transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">ยังไม่มีธุรกรรม</p>`;
    return;
  }

  // เคลียร์ข้อมูลเดิม
  transactionsEl.innerHTML = "";

  // แสดงธุรกรรมจากเก่าไปใหม่
  transactions
    .sort((a, b) => b.id - a.id) // เรียงจากใหม่ไปเก่า
    .forEach((transaction) => {
      const txElement = document.createElement("div");
      txElement.className = "py-2";
      txElement.innerHTML = `
        <p><span class="font-semibold">${transaction.date} ${transaction.time}</span>: ${transaction.text}</p>
      `;

      transactionsEl.appendChild(txElement);
    });
}

// ฟังก์ชันสำหรับเคลียร์ประวัติธุรกรรม
function clearTransactions() {
  transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">ยังไม่มีธุรกรรม</p>`;
}

// ฟังก์ชันสำหรับดึงประวัติการทำธุรกรรมจาก blockchain
async function getTransactionHistoryFromBlockchain() {
  if (!isConnected) {
    showError(
      "ไม่ได้เชื่อมต่อกับ MetaMask",
      "กรุณาเชื่อมต่อ MetaMask ก่อนใช้งาน"
    );
    return;
  }

  try {
    showStatus("กำลังดึงประวัติธุรกรรม", "กรุณารอสักครู่...");

    // ดึงเหตุการณ์ Deposit ย้อนหลังทั้งหมด
    const depositEvents = await bankContract.getPastEvents("Deposit", {
      filter: { owner: currentAccount },
      fromBlock: 0,
      toBlock: "latest",
    });

    // ดึงเหตุการณ์ Withdraw ย้อนหลังทั้งหมด
    const withdrawEvents = await bankContract.getPastEvents("Withdraw", {
      filter: { owner: currentAccount },
      fromBlock: 0,
      toBlock: "latest",
    });

    // รวมเหตุการณ์และจัดเรียงตามบล็อกและดัชนีธุรกรรม
    const allEvents = [...depositEvents, ...withdrawEvents].sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) {
        return b.blockNumber - a.blockNumber;
      }
      return b.transactionIndex - a.transactionIndex;
    });

    // เคลียร์ข้อมูลเดิม
    transactionsEl.innerHTML = "";

    if (allEvents.length === 0) {
      transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">ยังไม่มีธุรกรรมบน Blockchain</p>`;
      statusModal.classList.add("hidden");
      return;
    }

    // แสดงธุรกรรมทั้งหมด
    for (const event of allEvents) {
      const amount = web3.utils.fromWei(event.returnValues.amount, "ether");
      const txHash = event.transactionHash;
      const eventName = event.event;

      // ดึงข้อมูลเวลาจาก block
      const block = await web3.eth.getBlock(event.blockNumber);
      const timestamp = block.timestamp;
      const date = new Date(timestamp * 1000);

      const txElement = document.createElement("div");
      txElement.className = "py-2 border-b";
      txElement.innerHTML = `
        <p>
          <span class="font-semibold">${date.toLocaleString()}</span>: 
          ${eventName === "Deposit" ? "ฝากเงิน" : "ถอนเงิน"} ${amount} ETH
          <a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank" class="text-blue-500 hover:underline ml-2">[ดูใน Etherscan]</a>
        </p>
      `;

      transactionsEl.appendChild(txElement);
    }

    statusModal.classList.add("hidden");
  } catch (error) {
    showError("ไม่สามารถดึงประวัติธุรกรรมได้", error.message);
  }
}

// เพิ่มปุ่มดึงประวัติธุรกรรมจาก Blockchain
function addBlockchainHistoryButton() {
  const container = document.querySelector(
    ".bg-white.p-6.rounded-lg.shadow-md.md\\:col-span-2:nth-child(4)"
  );

  if (container) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "mt-4";
    buttonContainer.innerHTML = `
      <button id="getBlockchainHistoryBtn" class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition">
        ดึงประวัติธุรกรรมจาก Blockchain
      </button>
    `;

    container.appendChild(buttonContainer);

    document
      .getElementById("getBlockchainHistoryBtn")
      .addEventListener("click", getTransactionHistoryFromBlockchain);
  }
}

// เรียกใช้ฟังก์ชันเพิ่มปุ่มหลังจากโหลดหน้า
window.addEventListener("load", addBlockchainHistoryButton);
