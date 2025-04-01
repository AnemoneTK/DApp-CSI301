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

## วิธีการติดตั้ง

1. **Clone โปรเจค**

   ```bash
   git clone https://github.com/your-username/bank-dapp.git
   cd bank-dapp
   ```

2. **Deploy Smart Contract**

   - เปิด [Remix IDE](https://remix.ethereum.org/)
   - สร้างไฟล์ใหม่ `BankWithHistory.sol` และวางโค้ด Smart Contract
   - คอมไพล์และ Deploy บน Sepolia Testnet
   - บันทึก Contract Address ที่ได้

3. **แก้ไข Contract Address**

   - เปิดไฟล์ `script.js`
   - แก้ไข `bankContractAddress` ให้เป็น Address ของ Contract ที่ Deploy แล้ว

4. **รันแอปพลิเคชัน**
   - เปิดไฟล์ `index.html` ในเว็บเบราว์เซอร์ หรือใช้ Live Server ใน VSCode
   - เชื่อมต่อกับ MetaMask และต้องเชื่อมต่อกับ Sepolia Testnet

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

## วิดีโอตัวอย่างการใช้งาน

คุณสามารถแทรกวิดีโอตัวอย่างการใช้งานได้ดังนี้:

### วิธีที่ 1: โดยใช้ GitHub

ถ้าคุณอัปโหลดไฟล์วิดีโอไปยัง GitHub repository ของคุณ คุณสามารถแสดงลิงก์ไปยังไฟล์นั้น:

```markdown
[ดูวิดีโอสาธิตการใช้งาน](./demo.mp4)
```

### วิธีที่ 2: โดยใช้ YouTube

หากคุณอัปโหลดวิดีโอไปยัง YouTube คุณสามารถใส่ลิงก์ หรือแทรก embed code:

```markdown
[![ดูวิดีโอสาธิตการใช้งานบน YouTube](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)
```

แทน `VIDEO_ID` ด้วย ID ของวิดีโอ YouTube ของคุณ

### วิธีที่ 3: โดยใช้ GIF

คุณสามารถแปลงวิดีโอเป็น GIF และแทรกเข้าไปในไฟล์ README:

```markdown
![Demo GIF](./demo.gif)
```

## โครงสร้างโปรเจค

- `index.html` - หน้าเว็บหลัก
- `script.js` - JavaScript สำหรับการทำงานของแอปพลิเคชัน
- `bankABI.js` - ไฟล์ ABI ของ Smart Contract
- `BankWithHistory.sol` - โค้ด Smart Contract

## ผู้พัฒนา

- นางสาวนริศรา จ่างสะเดา (65039089)
