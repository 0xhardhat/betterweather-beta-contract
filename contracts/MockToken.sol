// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {IERC20} from "@thirdweb-dev/contracts/eip/interface/IERC20.sol";

contract MockToken is IERC20 {  
    string public name = "MockToken";  
    string public symbol = "Mock";  
    uint8 public decimals = 18; // Optional: define decimals, typically set to 18 for ERC20 tokens  
    uint256 public totalSupply;  
    address public owner;  
    mapping(address => uint256) balances;   
    mapping(address => mapping(address => uint256)) internal allowed; // For allowances  

    // You must not redefine events from the IERC20 interface  
    // event Transfer(address indexed from, address indexed to, uint256 value);  
    // event Approval(address indexed owner, address indexed spender, uint256 value);  

    constructor() {  
        totalSupply = 100000 * (10 ** decimals); // Adjust the supply taking decimals into account  
        balances[msg.sender] = totalSupply;  
        owner = msg.sender;  
    }  

    // Implement the transfer function correctly with return type  
    function transfer(address to, uint256 amount) external override returns (bool) {  
        require(balances[msg.sender] >= amount, "Not enough tokens");  
        balances[msg.sender] -= amount;  
        balances[to] += amount;  
        emit Transfer(msg.sender, to, amount);  
        return true; // Return true to indicate success  
    }  

    function balanceOf(address account) external view override returns (uint256) {  
        return balances[account];  
    }  

    // Implement allowance and transferFrom for full IERC20 compliance  
    function allowance(address ownerAddr, address spender) external view override returns (uint256) {  
        return allowed[ownerAddr][spender];  
    }  

    function approve(address spender, uint256 amount) external override returns (bool) {  
        allowed[msg.sender][spender] = amount;  
        emit Approval(msg.sender, spender, amount);  
        return true;  
    }  

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {  
        require(balances[from] >= amount, "Not enough tokens");  
        require(allowed[from][msg.sender] >= amount, "Allowance exceeded");  
        balances[from] -= amount;  
        balances[to] += amount;  
        allowed[from][msg.sender] -= amount;  
        emit Transfer(from, to, amount);  
        return true;  
    }  
}  