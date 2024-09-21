// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IERC20, ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Plugin } from "@1inch/token-plugins/contracts/Plugin.sol";
import { IERC20Plugins } from "@1inch/token-plugins/contracts/interfaces/IERC20Plugins.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract STokenRewardsPlugin is Plugin, ERC20, Ownable {
    error ApproveDisabled();
    error TransferDisabled();

    struct UserInfo {
        uint256 balance;
        uint256 lastUpdateTime;
        uint256 accumulatedTime;
    }

    mapping(address => UserInfo) public userInfo;
    mapping(address => bool) public claimedReward;
    uint256 public totalSubscribedSupply;
    uint256 public totalRewardPool;
    uint256 public totalClaimedRewards;
    address[] public claimedUsers;

    // Time-based reward parameters
    uint256 public constant MAX_HOLD_TIME = 365 days; // Maximum hold time for rewards (1 year)
    uint256 public constant TIME_MULTIPLIER = 2; // Maximum multiplier for longest holders

    constructor(string memory name_, string memory symbol_, IERC20Plugins token_) ERC20(name_, symbol_) Plugin(token_) {}

    function setRewardPool(uint256 value) public payable onlyOwner {
        totalRewardPool = value;
        totalClaimedRewards = 0;
        // Reset claimed rewards
        for (uint256 i = 0; i < claimedUsers.length; i++) {
            claimedReward[claimedUsers[i]] = false;
        }
        claimedUsers = new address[](0);
    }

    function claimReward() public {
        require(!claimedReward[msg.sender], "STokenRewardsPlugin: already claimed reward");
        claimedUsers.push(msg.sender);
        claimedReward[msg.sender] = true;

        UserInfo storage user = userInfo[msg.sender];
        updateAccumulatedTime(msg.sender);

        uint256 timeMultiplier = calculateTimeMultiplier(user.accumulatedTime);
        uint256 adjustedBalance = SafeMath.mul(user.balance, timeMultiplier);
        uint256 _multi = SafeMath.mul(adjustedBalance, totalRewardPool);
        uint256 reward = SafeMath.div(_multi, calculateTotalAdjustedSupply());

        totalClaimedRewards += reward;
        address payable wallet = payable(msg.sender);
        wallet.transfer(reward);
    }

    function _updateBalances(address from, address to, uint256 amount) internal override {
        // mint
        if (from == address(0)) {
            totalSubscribedSupply += amount;
            UserInfo storage toUser = userInfo[to];
            updateAccumulatedTime(to);
            toUser.balance += amount;
            toUser.lastUpdateTime = block.timestamp;
            // burn
        } else if (to == address(0)) {
            UserInfo storage fromUser = userInfo[from];
            updateAccumulatedTime(from);
            fromUser.balance -= amount;
            totalSubscribedSupply -= amount;
            // transfer
        } else {
            UserInfo storage fromUser = userInfo[from];
            UserInfo storage toUser = userInfo[to];
            updateAccumulatedTime(from);
            updateAccumulatedTime(to);
            fromUser.balance -= amount;
            toUser.balance += amount;
            fromUser.lastUpdateTime = block.timestamp;
            toUser.lastUpdateTime = block.timestamp;
        }
    }

    function updateAccumulatedTime(address user) internal {
        UserInfo storage userInfo = userInfo[user];
        if (userInfo.lastUpdateTime > 0) {
            uint256 timeElapsed = block.timestamp - userInfo.lastUpdateTime;
            userInfo.accumulatedTime += timeElapsed;
        }
        userInfo.lastUpdateTime = block.timestamp;
    }

    function calculateTimeMultiplier(uint256 accumulatedTime) public pure returns (uint256) {
        if (accumulatedTime >= MAX_HOLD_TIME) {
            return TIME_MULTIPLIER;
        }
        return 1 + ((TIME_MULTIPLIER - 1) * accumulatedTime) / MAX_HOLD_TIME;
    }

    function calculateTotalAdjustedSupply() public view returns (uint256) {
        uint256 totalAdjustedSupply = 0;
        for (uint256 i = 0; i < claimedUsers.length; i++) {
            address user = claimedUsers[i];
            UserInfo storage userInfo = userInfo[user];
            uint256 timeMultiplier = calculateTimeMultiplier(userInfo.accumulatedTime);
            totalAdjustedSupply += SafeMath.mul(userInfo.balance, timeMultiplier);
        }
        return totalAdjustedSupply;
    }

    // ERC20 overrides
    function transfer(address /* to */, uint256 /* amount */) public pure override(IERC20, ERC20) returns (bool) {
        revert TransferDisabled();
    }

    function transferFrom(address /* from */, address /* to */, uint256 /* amount */) public pure override(IERC20, ERC20) returns (bool) {
        revert TransferDisabled();
    }

    function approve(address /* spender */, uint256 /* amount */) public pure override(ERC20, IERC20) returns (bool) {
        revert ApproveDisabled();
    }

    function increaseAllowance(address /* spender */, uint256 /* addedValue */) public pure override returns (bool) {
        revert ApproveDisabled();
    }

    function decreaseAllowance(address /* spender */, uint256 /* subtractedValue */) public pure override returns (bool) {
        revert ApproveDisabled();
    }
}