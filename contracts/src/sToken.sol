// SPDX-License-Identifier: MIT

pragma solidity 0.8.26;

import { ERC20Plugins } from "@1inch/token-plugins/contracts/ERC20Plugins.sol";
import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract HostTokenExample is ERC20Plugins, Ownable {
    constructor(string memory name, string memory symbol, uint256 maxPluginsPerAccount, uint256 pluginCallGasLimit)
    ERC20(name, symbol)
    ERC20Plugins(maxPluginsPerAccount, pluginCallGasLimit)
    Ownable(msg.sender)
    {} // solhint-disable-line no-empty-blocks

    function mint(address account, uint256 amount) external onlyOwner{
        _mint(account, amount);
    }
}