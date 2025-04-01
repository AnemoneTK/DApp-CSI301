// นำเข้า ABI จากไฟล์แยก
import bankABI from "/bankABI.js";

// ที่อยู่ของ Contract สำหรับ BankWithHistory
// ต้องเปลี่ยนเป็นที่อยู่ของ Contract ที่เพิ่ง deploy
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
          <div class="mt-2 p-2 bg-yellow-100 rounded">
            <p>
              ยอดเงิน ETH ในกระเป๋า:
              <span id="walletBalance" class="font-bold">0</span> ETH
            </p>
          </div>
        `;

      isConnected = true;

      // ดักจับเหตุการณ์เมื่อมีการเปลี่ยน account
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      // ดักจับเหตุการณ์ (events) จาก contract
      listenForEvents();

      // แสดงข้อความกำลังโหลดประวัติธุรกรรม
      transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">กำลังโหลดประวัติธุรกรรม...</p>`;

      // โหลดประวัติธุรกรรมจาก Smart Contract
      try {
        await getContractTransactionHistory(false);
      } catch (error) {
        console.error("ไม่สามารถโหลดประวัติจาก Smart Contract:", error);

        // ถ้าดึงจาก Smart Contract ไม่ได้ ให้ลองดึงจาก Events แทน
        try {
          await getTransactionHistoryFromBlockchain(false);
        } catch (eventsError) {
          console.error("ไม่สามารถโหลดประวัติจาก Events:", eventsError);
          transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">ไม่สามารถโหลดประวัติธุรกรรมได้</p>`;
        }
      }

      // ตรวจสอบยอดเงินทันทีเมื่อโหลดหน้า
      handleCheckBalance();

      // อัปเดตยอดเงิน ETH ในกระเป๋า
      updateWalletBalance();

      // ตั้งค่าให้อัปเดตยอดเงินทุก 30 วินาที
      setInterval(updateWalletBalance, 30000);
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
      <div class="mt-2 p-2 bg-yellow-100 rounded">
        <p>
          ยอดเงิน ETH ในกระเป๋า:
          <span id="walletBalance" class="font-bold">0</span> ETH
        </p>
      </div>
    `;
    isConnected = true;

    // เคลียร์ประวัติธุรกรรมเมื่อเปลี่ยนบัญชี
    clearTransactions();

    // แสดงข้อความกำลังโหลดประวัติธุรกรรม
    transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">กำลังโหลดประวัติธุรกรรม...</p>`;

    // โหลดประวัติธุรกรรมใหม่สำหรับบัญชีนี้
    try {
      await getContractTransactionHistory(false);
    } catch (error) {
      console.error("ไม่สามารถโหลดประวัติจาก Smart Contract:", error);

      // ถ้าดึงจาก Smart Contract ไม่ได้ ให้ลองดึงจาก Events แทน
      try {
        await getTransactionHistoryFromBlockchain(false);
      } catch (eventsError) {
        console.error("ไม่สามารถโหลดประวัติจาก Events:", eventsError);
        transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">ไม่สามารถโหลดประวัติธุรกรรมได้</p>`;
      }
    }

    // ตรวจสอบยอดเงินใหม่เมื่อเปลี่ยนบัญชี
    handleCheckBalance();
    updateWalletBalance();
  }
}

// ฟังก์ชันสำหรับอัปเดตยอดเงินในกระเป๋า
async function updateWalletBalance() {
  if (!isConnected) return;

  try {
    const balance = await web3.eth.getBalance(currentAccount);
    const balanceInEth = web3.utils.fromWei(balance, "ether");
    const walletBalanceEl = document.getElementById("walletBalance");
    if (walletBalanceEl) {
      walletBalanceEl.textContent = balanceInEth;
    }
  } catch (error) {
    console.error("ไม่สามารถอัปเดตยอดเงินในกระเป๋าได้", error);
  }
}

// ฟังก์ชันสำหรับ deposit
async function handleDeposit() {
  // ตรวจสอบการเชื่อมต่อ
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
    // ตรวจสอบยอดเงินในกระเป๋าก่อนฝาก
    const balance = await web3.eth.getBalance(currentAccount);
    const amountInWei = web3.utils.toWei(amount, "ether");

    if (Number(amountInWei) > Number(balance)) {
      showError(
        "ยอดเงินไม่เพียงพอ",
        `คุณมียอดเงิน ETH ในกระเป๋าเพียง ${web3.utils.fromWei(
          balance,
          "ether"
        )} ETH แต่ต้องการฝาก ${amount} ETH`
      );
      return;
    }

    showStatus("กำลังฝากเงิน", "กรุณายืนยันธุรกรรมใน MetaMask");

    // เรียกใช้ฟังก์ชัน deposit
    await bankContract.methods.deposit().send({
      from: currentAccount,
      value: amountInWei,
    });

    showStatus("ฝากเงินสำเร็จ", `ฝากเงินจำนวน ${amount} ETH สำเร็จแล้ว`);
    depositAmountEl.value = "";

    // ตรวจสอบยอดเงินอัตโนมัติหลังฝากเงิน
    await handleCheckBalance();
    updateWalletBalance();

    // อัปเดตประวัติธุรกรรม
    try {
      await getContractTransactionHistory(false);
    } catch (error) {
      console.error("ไม่สามารถอัปเดตประวัติธุรกรรมได้", error);
    }
  } catch (error) {
    if (error.message.includes("User denied transaction")) {
      showError("การฝากเงินถูกยกเลิก", "คุณได้ยกเลิกการทำธุรกรรมใน MetaMask");
    } else if (error.message.includes("insufficient funds")) {
      showError(
        "ยอดเงินไม่เพียงพอ",
        "คุณมียอดเงิน ETH ในกระเป๋าไม่เพียงพอสำหรับการฝากนี้ รวมค่า Gas"
      );
    } else {
      showError("การฝากเงินล้มเหลว", error.message);
    }
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
    // ตรวจสอบยอดเงินก่อนถอน
    const balance = await bankContract.methods.checkBalance().call({
      from: currentAccount,
    });

    // ถ้าจำนวนเงินที่ต้องการถอนมากกว่ายอดเงินที่มี
    if (Number(amount) > Number(balance)) {
      showError(
        "ยอดเงินไม่เพียงพอ",
        `คุณมียอดเงินเพียง ${balance} Wei แต่ต้องการถอน ${amount} Wei`
      );
      return;
    }

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
    updateWalletBalance();

    // อัปเดตประวัติธุรกรรม
    try {
      await getContractTransactionHistory(false);
    } catch (error) {
      console.error("ไม่สามารถอัปเดตประวัติธุรกรรมได้", error);
    }
  } catch (error) {
    // ตรวจสอบว่าเป็นข้อผิดพลาด "not enough money" หรือไม่
    if (
      error.message.includes("not enough money") ||
      error.message.includes("revert")
    ) {
      showError(
        "ยอดเงินไม่เพียงพอ",
        "คุณมียอดเงินไม่เพียงพอสำหรับการถอนเงินนี้"
      );
    } else {
      showError(
        "การถอนเงินล้มเหลว",
        "เกิดข้อผิดพลาดในการถอนเงิน: " + error.message
      );
    }
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

// ฟังก์ชันสำหรับดึงประวัติธุรกรรมจาก Smart Contract
async function getContractTransactionHistory(showModal = true) {
  if (!isConnected) {
    return;
  }

  try {
    if (showModal) {
      showStatus("กำลังดึงประวัติธุรกรรม", "กรุณารอสักครู่...");
    }

    // เรียกใช้ฟังก์ชัน getTransactionHistory จาก contract
    const transactions = await bankContract.methods
      .getTransactionHistory()
      .call({
        from: currentAccount,
      });

    // เคลียร์ข้อมูลเดิม
    transactionsEl.innerHTML = "";

    if (transactions.length === 0) {
      transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">ยังไม่มีธุรกรรมที่เก็บใน Smart Contract</p>`;
      if (showModal) {
        statusModal.classList.add("hidden");
      }
      return;
    }

    // แสดงธุรกรรมทั้งหมด จากใหม่ไปเก่า
    for (let i = transactions.length - 1; i >= 0; i--) {
      const tx = transactions[i];
      const date = new Date(parseInt(tx.timestamp) * 1000);
      const amountInEth = web3.utils.fromWei(tx.amount.toString(), "ether");
      const type = tx.isDeposit ? "ฝากเงิน" : "ถอนเงิน";

      const txElement = document.createElement("div");
      txElement.className = "py-2 border-b";
      txElement.innerHTML = `
        <p>
          <span class="font-semibold">${date.toLocaleString()}</span>: 
          ${type} ${amountInEth} ETH
        </p>
      `;

      transactionsEl.appendChild(txElement);
    }

    if (showModal) {
      statusModal.classList.add("hidden");
    }
  } catch (error) {
    if (showModal) {
      showError("ไม่สามารถดึงประวัติธุรกรรมได้", error.message);
    } else {
      console.error("ไม่สามารถดึงประวัติธุรกรรมได้", error.message);
    }
    throw error;
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

      // อัปเดตประวัติธุรกรรม
      try {
        getContractTransactionHistory(false);
      } catch (error) {
        console.error("ไม่สามารถอัปเดตประวัติธุรกรรมได้", error);
      }
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

      // อัปเดตประวัติธุรกรรม
      try {
        getContractTransactionHistory(false);
      } catch (error) {
        console.error("ไม่สามารถอัปเดตประวัติธุรกรรมได้", error);
      }
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

  // ลบข้อความ "ยังไม่มีธุรกรรม" ถ้ามี
  if (transactionsEl.querySelector("p.text-gray-500")) {
    transactionsEl.innerHTML = "";
  }

  // เพิ่มธุรกรรมใหม่
  const txElement = document.createElement("div");
  txElement.className = "py-2";
  txElement.innerHTML = `
    <p><span class="font-semibold">${dateString} ${timeString}</span>: ${text}</p>
  `;

  transactionsEl.prepend(txElement);
}

// ฟังก์ชันสำหรับเคลียร์ประวัติธุรกรรม
function clearTransactions() {
  transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">ยังไม่มีธุรกรรม</p>`;
}

// ฟังก์ชันสำหรับดึงประวัติการทำธุรกรรมจาก blockchain ผ่าน events
async function getTransactionHistoryFromBlockchain(showModal = true) {
  if (!isConnected) {
    return;
  }

  try {
    if (showModal) {
      showStatus("กำลังดึงประวัติธุรกรรม", "กรุณารอสักครู่...");
    }

    // ดึงบล็อกปัจจุบัน
    const latestBlock = await web3.eth.getBlockNumber();

    // กำหนดขนาดช่วง (ไม่เกิน 10,000 บล็อก)
    const BLOCK_RANGE = 9000;

    let allDepositEvents = [];
    let allWithdrawEvents = [];

    // แบ่งการคิวรี่เป็นช่วงๆ ละไม่เกิน 10,000 บล็อก
    // ดึงข้อมูลย้อนหลังประมาณ 50,000 บล็อก หรือน้อยกว่า
    for (
      let fromBlock = Math.max(0, latestBlock - 50000);
      fromBlock <= latestBlock;
      fromBlock += BLOCK_RANGE
    ) {
      const toBlock = Math.min(fromBlock + BLOCK_RANGE - 1, latestBlock);

      try {
        // ดึงเหตุการณ์ Deposit
        const depositEvents = await bankContract.getPastEvents("Deposit", {
          filter: { owner: currentAccount },
          fromBlock: fromBlock,
          toBlock: toBlock,
        });

        // ดึงเหตุการณ์ Withdraw
        const withdrawEvents = await bankContract.getPastEvents("Withdraw", {
          filter: { owner: currentAccount },
          fromBlock: fromBlock,
          toBlock: toBlock,
        });

        allDepositEvents = [...allDepositEvents, ...depositEvents];
        allWithdrawEvents = [...allWithdrawEvents, ...withdrawEvents];
      } catch (error) {
        console.error(
          `Error fetching events for blocks ${fromBlock}-${toBlock}:`,
          error
        );
        // ทำต่อไปแม้จะมีข้อผิดพลาดในช่วงนี้
      }
    }

    // รวมเหตุการณ์และจัดเรียงตามบล็อกและดัชนีธุรกรรม
    const allEvents = [...allDepositEvents, ...allWithdrawEvents].sort(
      (a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return b.blockNumber - a.blockNumber;
        }
        return b.transactionIndex - a.transactionIndex;
      }
    );

    // เคลียร์ข้อมูลเดิม
    transactionsEl.innerHTML = "";

    if (allEvents.length === 0) {
      transactionsEl.innerHTML = `<p class="text-center text-gray-500 py-4">ยังไม่มีธุรกรรมบน Blockchain</p>`;
      if (showModal) {
        statusModal.classList.add("hidden");
      }
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

    if (showModal) {
      statusModal.classList.add("hidden");
    }
  } catch (error) {
    if (showModal) {
      showError("ไม่สามารถดึงประวัติธุรกรรมได้", error.message);
    } else {
      console.error("ไม่สามารถดึงประวัติธุรกรรมได้", error.message);
    }
    throw error;
  }
}
