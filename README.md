# Liquid Staking Rollup

This project implements a liquid staking system using AVL tokens and ETH, built on a rollup architecture. It provides a set of state transition functions (STFs) to manage various operations related to staking, bridging, and token management.

## Features

- ERC20-like token functionality (create, mint, burn, transfer, approve, transferFrom)
- Bridging between AVL and ETH
- Liquid staking mechanism
- Account management for both EVM and AVL addresses

## Key Components

### State

The system maintains three types of state leaves:
- `erc20leaves`: Manages ERC20-like token balances and allowances
- `bridgeleaves`: Tracks bridging requests between AVL and ETH
- `avlleaves`: Manages AVL staking accounts

### State Transition Functions (STFs)

1. Token Management
   - `create`: Create a new account
   - `mint`: Mint new tokens
   - `burn`: Burn existing tokens
   - `transfer`: Transfer tokens between accounts
   - `approve`: Approve spending allowance
   - `transferFrom`: Transfer tokens on behalf of another account

2. Bridging
   - `requestBridge`: Initiate a bridge request from AVL to ETH
   - `fulfillBridge`: Complete a bridge request

3. AVL Staking
   - `bridgeAVLtoApp`: Bridge AVL tokens to the application
   - `claimAVLAccount`: Claim an AVL account
   - `requestStakeAVL`: Request to stake AVL tokens
   - `fulfillStakeAVL`: Fulfill an AVL staking request

## Usage

To use these functions, import them into your rollup implementation:

```typescript
import { transitions } from './path/to/this/file';
```

Ensure that your rollup framework is compatible with the `STF` and `Transitions` types from `@stackr/sdk/machine`.

## State Structure

The state follows the `StokenState` interface, which should include:

- `erc20leaves`: Array of ERC20-like account leaves
- `bridgeleaves`: Array of bridge request leaves
- `avlleaves`: Array of AVL staking account leaves

## Important Notes

- All operations perform various checks to ensure security and consistency (e.g., balance checks, authorization checks).
- The system uses both EVM addresses and AVL addresses, with a claiming mechanism to link them.
- Bridging and staking operations are multi-step processes to ensure proper verification and execution.

## Dependencies

- `@stackr/sdk/machine`: For STF and Transitions types
- `@polkadot/util-crypto`: For blake2 hashing
- `ethers`: For ZeroAddress constant

Make sure to install these dependencies before using the system.

## Contributing

[Add your contribution guidelines here]

## License

[Add your chosen license here]
