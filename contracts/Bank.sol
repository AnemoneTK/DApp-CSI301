// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Bank {
    // แมปที่เก็บยอดเงินของแต่ละ address
    mapping (address => uint) balances;
    
    // อีเวนต์ที่เกิดขึ้นเมื่อมีการฝากเงิน
    event Deposit(address indexed owner, uint amount);
    
    // อีเวนต์ที่เกิดขึ้นเมื่อมีการถอนเงิน
    event Withdraw(address indexed owner, uint amount);
    
    // ฟังก์ชันสำหรับฝากเงิน
    function deposit() public payable {
        // ตรวจสอบว่าจำนวนเงินที่ฝากต้องมากกว่า 0
        require(msg.value > 0, "Deposit money is zero");
        
        // เพิ่มยอดเงินในบัญชี
        balances[msg.sender] += msg.value;
        
        // ส่งอีเวนต์ว่ามีการฝากเงิน
        emit Deposit(msg.sender, msg.value);
    }
    
    // ฟังก์ชันสำหรับถอนเงิน
    function withdraw(uint amount) public {
        // ตรวจสอบว่าจำนวนเงินที่ถอนต้องมากกว่า 0 และน้อยกว่าหรือเท่ากับยอดเงินในบัญชี
        require(amount > 0 && amount <= balances[msg.sender], "not enough money");
        
        // ส่งเงินไปยัง address ของผู้เรียกใช้
        payable(msg.sender).transfer(amount);
        
        // ลดยอดเงินในบัญชี
        balances[msg.sender] -= amount;
        
        // ส่งอีเวนต์ว่ามีการถอนเงิน
        emit Withdraw(msg.sender, amount);
    }
    
    // ฟังก์ชันสำหรับตรวจสอบยอดเงินในบัญชี
    function checkBalance() public view returns(uint balance) {
        return balances[msg.sender];
    }
}