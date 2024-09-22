# sToken - A Micro Rollup based multi-utility LST

sToken is a Liquid Staking rollup based token working on across multiple chains allowing users to bridge ETH from any chain, using HyperLane to get LST tokens in return. It also implements a reward mechanism using 1inch ERC20 Plugins.
## Features

- Support for both AVL and ETH
- Support for multiple chains using Hyperlane
- Liquid staking mechanism
- Rewards Mechanism using 1inch ERC20 Plugin.
- Rollup that manages the bridging using Stackr on AvailDA

## Key Components

### State Transition Functions (STFs)

1. Token Management
   - `create`: Create a new account
   - `mint`: Mint new tokens
   - `burn`: Burn existing tokens
   - `transfer`: Transfer tokens between accounts
   - `approve`: Approve spending allowance
   - `transferFrom`: Transfer tokens on behalf of another account

2. Bridging
   - `requestBridge`: Initiate a bridge request from Rollup to L1
   - `fulfillBridge`: Complete a bridge request

3. AVL Staking
   - `bridgeAVLtoApp`: Bridge AVL tokens to the Micro Rollup
   - `claimAVLAccount`: Claim an AVL account
   - `requestStakeAVL`: Request to stake AVL tokens
   - `fulfillStakeAVL`: Fulfill an AVL staking request


## Important Notes

- All operations perform various checks to ensure security and consistency (e.g., balance checks, authorization checks).
- The system uses both EVM addresses and AVL addresses, with a claiming mechanism to link them.
- Bridging and staking operations are multi-step processes to ensure proper verification and execution.

## Possible Use Cases
- The liquid staking tokens can be integrated into various DeFi protocols such as lending platforms, automated market makers (AMMs), and yield aggregators.
- Users can diversify their staked assets across different chains, potentially reducing the risk associated with staking on a single network.
- By providing a bridge to Ethereum, the system can enhance the overall liquidity and utility of staked assets from other proof-of-stake networks.

## Tech Stack

- Stackr + AvailDA - For the rollup
- NextJS - For the frontend
- avail-js-sdk - For the interactions for avail on the frontend.
- HyperLane - for the cross chain message passing
- 1inch ERC20 Plugin - for providing the rewards to the users for holding stokens.

## 1inch ERC20 Plugins
### Key Features

**Time-Based Rewards**

Users accumulate holding time for their sTokens.
Longer hold times result in higher reward multipliers.
Maximum multiplier (2x) achieved after one year of holding.


**Reward Pool Management**

Contract owner can set and update the total reward pool.
Rewards are distributed proportionally based on user balances and hold times.


**User Information Tracking**

Stores user balances, last update times, and accumulated holding times.
Automatically updates user information on token transfers, mints, and burns.


**Claiming Mechanism**

Users can claim rewards based on their balance and accumulated hold time.
Prevents double-claiming through a mapping of claimed status.


## Deployments
- Stoken Sepolia - 0x35A6287bb4cd0A6b13AbA9c76e9803E2C99E5811
- Stoken Rewards Plugin Sepolia - 0x2d641A57d085578f21a9eaa3DD68154E4B44A92d
- Sepolia MailBox - 0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766
- Holesky MailBox - 0x46f7C5D896bbeC89bE1B19e4485e59b4Be49e9Cc
- Sepolia Hyperlane Bridge - 0x0c0433d4466B0103fFc7151CE92041D650608C1b 
- Holesky Hyperlane Bridge - 0x1E0708FC96417294D803c75193F8aE7e3a873178