// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { IERC20Plugins } from "@1inch/token-plugins/contracts/interfaces/IERC20Plugins.sol";

interface IStoken is IERC20Plugins {
    function mint(address account, uint256 amount) external; // onlyOwner
    function burn(address account, uint256 amount) external; // onlyOwner
}