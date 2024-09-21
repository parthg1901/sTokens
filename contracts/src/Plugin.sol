// SPDX-License-Identifier: MIT

pragma solidity 0.8.26;

import { Plugin } from "@1inch/token-plugins/contracts/Plugin.sol";
import { IERC20Plugins } from "@1inch/token-plugins/contracts/interfaces/IERC20Plugins.sol";
import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract StokenPlugin is ERC20, Plugin {
    constructor(string memory name, string memory symbol, IERC20Plugins token_)
    ERC20(name, symbol)
    Plugin(token_)
    {} // solhint-disable-line no-empty-blocks

    function _updateBalances(address from, address to, uint256 amount) internal override {
        if (from == address(0)) {
            _mint(to, amount);
        } else if (to == address(0)) {
            _burn(from, amount);
        } else {
            _transfer(from, to, amount);
        }
    }
}