# Bank DApp - ระบบธนาคารบน Blockchain

Bank DApp เป็นแอปพลิเคชันธนาคารที่ทำงานบน Ethereum Blockchain โดยใช้ Smart Contract ในการจัดการการฝาก-ถอนเงิน และตรวจสอบยอดเงิน

## คุณสมบัติ

- **ฝากเงิน**: ฝากเงิน Ethereum เข้าในระบบธนาคาร
- **ถอนเงิน**: ถอนเงินตามจำนวนที่ต้องการจากยอดเงินที่มีในระบบ
- **ตรวจสอบยอดเงิน**: ดูยอดเงินปัจจุบันในระบบธนาคาร
- **ดูประวัติธุรกรรม**: แสดงประวัติการฝาก-ถอนเงินย้อนหลัง
- **แสดงยอดเงินในกระเป๋า**: แสดงยอดเงิน ETH ในกระเป๋า MetaMask

## เทคโนโลยีที่ใช้

- **Smart Contract**: Solidity
- **Frontend**: HTML, JavaScript, Tailwind CSS
- **Web3**: Web3.js สำหรับการเชื่อมต่อกับ Blockchain
- **Wallet**: MetaMask

## วิธีการใช้งาน

### ฝากเงิน

1. กรอกจำนวนเงินที่ต้องการฝากในช่อง "จำนวนเงิน (ETH)"
2. คลิกปุ่ม "ฝากเงิน"
3. ยืนยันการทำธุรกรรมใน MetaMask

### ถอนเงิน

1. กรอกจำนวนเงินที่ต้องการถอนในช่อง "จำนวนเงิน (Wei)"
2. คลิกปุ่ม "ถอนเงิน"
3. ยืนยันการทำธุรกรรมใน MetaMask

### ตรวจสอบยอดเงิน

1. คลิกปุ่ม "ตรวจสอบยอดเงิน"
2. ระบบจะแสดงยอดเงินปัจจุบันทั้งในหน่วย Wei และ ETH

### ประวัติธุรกรรม

- ประวัติธุรกรรมจะแสดงโดยอัตโนมัติในส่วน "ประวัติธุรกรรม"
- ข้อมูลนี้ดึงมาจาก Smart Contract โดยตรง

## โครงสร้างโปรเจค

```
.
└── Trainify
    ├── contracts
    │   ├── Bank.sol
    │   └── bankABI.js
    ├── index.html
    ├── README.md
    └── script.js
```

## ผู้พัฒนา

- นางสาวนริศรา จ่างสะเดา (65039089)
