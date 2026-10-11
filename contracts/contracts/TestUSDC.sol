// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDC
 * @notice Standard ERC-20 matching Circle USDC specifications (6 decimals)
 * for testing and Monad Testnet deployment.
 */
contract TestUSDC is ERC20, Ownable {
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        // Mint initial supply to deployer (e.g. 1,000,000 USDC)
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Faucet function for testing environments
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
