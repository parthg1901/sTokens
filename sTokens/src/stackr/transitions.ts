import { STF, Transitions } from "@stackr/sdk/machine";
import { StokenState } from "./state";
import { blake2AsHex } from "@polkadot/util-crypto";
import {Leaves} from "./types.ts";
import { ZeroAddress } from "ethers";

const findIndexOfAccountERC20 = (state: Leaves, address: string) => {

  return state.erc20.findIndex((leaf) => leaf.address === address);
};

const findIndexOfAccountBridge = (state: Leaves, address: string) => {
  return state.bridge.findIndex((leaf) => leaf.toaddress === address);
};

const findIndexOfAccountAVL = (state: Leaves, address: string) => {
  return state.avl.findIndex((leaf) => leaf.evmAddress === address);
};

type CreateInput = {
  address: string;
};

type BaseActionInput = {
  from: string;
  to: string;
  amount: number;
};

type BridgeInput = {
  toaddress: string;
  amount: number;
  isBridged: boolean;
};

type RequestStakeAVLInput = {
  timestamp: string;
};

type FulfillStakeAVLInput = {
  avlAddress: string;
  sharesToMint: number;
};

// --------- State Transition Handlers ---------
const create: STF<StokenState, CreateInput> = {
  handler: ({ inputs, state }) => {
    const { address } = inputs;
    if (state.erc20leaves.find((leaf) => leaf.address === address)) {
      throw new Error("Account already exists");
    }
    state.erc20leaves.push({
      address,
      balance: 0,
      nonce: 0,
      allowances: [],
    });
    return state;
  },
};

const requestBridge: STF<StokenState, BridgeInput> = {
  handler: ({ inputs, state, msgSender }) => {
    const { toaddress, amount } = inputs;
    if (state.avlleaves.find((leaf) => leaf.evmAddress !== toaddress)) {
      throw new Error("Account doesn't exist on avl tree");
    }
    if (state.avlleaves.find((leaf) => leaf.stakingShares < amount)) {
      throw new Error("Insufficient funds to bridge");
    }
    if(state.avlleaves.find((leaf) => leaf.stakingShares < 0)) {
      throw new Error("Invalid amount to bridge");
    }
    const indexAVL = findIndexOfAccountAVL(state.state, toaddress);
    state.avlleaves[indexAVL].stakingShares -= amount;
    state.bridgeleaves.push({
      toaddress: toaddress,
      amount: amount,
      isBridged: false,
    });
    return state;
  },
};

const fulfillBridge: STF<StokenState, BridgeInput> = {
  handler: ({ inputs, state }) => {
    const { toaddress } = inputs;
    const indexbridge = findIndexOfAccountBridge(state.state, toaddress);
    state.bridgeleaves[indexbridge].isBridged = true;
    return state;
  },
};

const mint: STF<StokenState, BaseActionInput> = {
  handler: ({ inputs, state }) => {
    const { to, amount } = inputs;

    const index = findIndexOfAccountERC20(state.state, to);
    state.erc20leaves[index].balance += amount;
    return state;
  },
};

const burn: STF<StokenState, BaseActionInput> = {
  handler: ({ inputs, state, msgSender }) => {
    const { from, amount } = inputs;

    const index = findIndexOfAccountERC20(state.state, from);

    if (state.erc20leaves[index].address !== msgSender) {
      throw new Error("Unauthorized");
    }
    state.erc20leaves[index].balance -= amount;
    return state;
  },
};

const transfer: STF<StokenState, BaseActionInput> = {
  handler: ({ inputs, state, msgSender }) => {
    const { to, from, amount } = inputs;

    const fromIndex = findIndexOfAccountERC20(state.state, from);
    const toIndex = findIndexOfAccountERC20(state.state, to);

    if (state.erc20leaves[fromIndex]?.address !== msgSender) {
      throw new Error("Unauthorized");
    }

    if (state.erc20leaves[fromIndex]?.balance < inputs.amount) {
      throw new Error("Insufficient funds");
    }

    if (!state.erc20leaves[toIndex]) {
      throw new Error("Account does not exist");
    }

    state.erc20leaves[fromIndex].balance -= amount;
    state.erc20leaves[toIndex].balance += amount;
    return state;
  },
};

const approve: STF<StokenState, BaseActionInput> = {
  handler: ({ inputs, state, msgSender }) => {
    const { from, to, amount } = inputs;

    const index = findIndexOfAccountERC20(state.state, from);
    if (state.erc20leaves[index].address !== msgSender) {
      throw new Error("Unauthorized");
    }

    state.erc20leaves[index].allowances.push({ address: to, amount });
    return state;
  },
};

const transferFrom: STF<StokenState, BaseActionInput> = {
  handler: ({ inputs, state, msgSender }) => {
    const { to, from, amount } = inputs;

    const toIndex = findIndexOfAccountERC20(state.state, to);
    const fromIndex = findIndexOfAccountERC20(state.state, from);

    const allowance = state.erc20leaves[fromIndex].allowances.find(
        (allowance) => allowance.address === msgSender
    );
    if (!allowance || allowance.amount < inputs.amount) {
      throw new Error("Insufficient allowance");
    }

    if (state.erc20leaves[fromIndex].balance < inputs.amount) {
      throw new Error("Insufficient funds");
    }

    state.erc20leaves[fromIndex].balance -= amount;
    state.erc20leaves[toIndex].balance += amount;
    state.erc20leaves[fromIndex].allowances = state.erc20leaves[
        fromIndex
        ].allowances.map((allowance) => {
      if (allowance.address === msgSender) {
        allowance.amount -= amount;
      }
      return allowance;
    });
    return state;
  },
};

type BridgeAVLtoAppInput = {
  avlAddress: string;
  amount: number;
  evmAddressHash: string;
};

type ClaimAVLAccountInput = {
  avlAddress: string;
};

const bridgeAVLtoApp: STF<StokenState, BridgeAVLtoAppInput> = {
  handler: ({ inputs, state, msgSender }) => {
    const { avlAddress, amount, evmAddressHash } = inputs;

    const idx = state.avlleaves.findIndex(
        (account) => account.avlAddress === avlAddress
    );
    if (idx === -1) {
      state.avlleaves.push({
        evmAddress: ZeroAddress,
        avlAddress: avlAddress,
        freeBalance: amount,
        stakingShares: 0,
        evmAddressHash: evmAddressHash,
        claimed: false,
        nonce: 0,
        requestedStake: false,
      });
    } else {
      state.avlleaves[idx].freeBalance += amount;
    }

    return state;
  },
};

const claimAVLAccount: STF<StokenState, ClaimAVLAccountInput> = {
  handler: ({ inputs, state, msgSender }) => {
    const { avlAddress } = inputs;
    const idx = state.avlleaves.findIndex(
        (account) => account.avlAddress === avlAddress
    );
    if (idx === -1) {
      throw new Error("AVL ADDRESS NO EXIST");
    }

    const senderHash = blake2AsHex(msgSender as string);
    if (state.avlleaves[idx].evmAddressHash !== senderHash) {
      throw new Error("WRONG OWNER");
    }

    state.avlleaves[idx].evmAddress = msgSender as string;
    state.avlleaves[idx].claimed = true;

    return state;
  },
};

const requestStakeAVL: STF<StokenState, RequestStakeAVLInput> = {
  handler: ({ inputs, state, msgSender }) => {
    const accountIdx = state.avlleaves.findIndex(
        (acc) => acc.evmAddress == msgSender
    );
    if (accountIdx === -1) throw new Error("requestStakeAVL: ACCOUNT INVALID");

    if (
        state.avlleaves[accountIdx].claimed &&
        !state.avlleaves[accountIdx].requestedStake
    ) {
      state.avlleaves[accountIdx].requestedStake = true;
    } else {
      throw new Error("requestStakeAVL: INVALID OPERATION");
    }

    return state;
  },
};

const fulfillStakeAVL: STF<StokenState, FulfillStakeAVLInput> = {
  handler: ({ inputs, state, msgSender }) => {
    const { avlAddress, sharesToMint } = inputs;

    const accountIdx = state.avlleaves.findIndex(
        (acc) => acc.avlAddress === avlAddress
    );
    if (accountIdx === -1) {
      throw new Error("fulfillStakeAVL: ACCOUNT INVALID");
    }

    if (state.avlleaves[accountIdx].requestedStake) {
      state.avlleaves[accountIdx].freeBalance = 0;
      state.avlleaves[accountIdx].stakingShares = sharesToMint;
      state.avlleaves[accountIdx].requestedStake = false;
    } else {
      throw new Error("fulfillStakeAVL: INVALID OPERATION");
    }
    return state;
  },
};

export const transitions: Transitions<StokenState> = {
  create,
  mint,
  burn,
  transfer,
  approve,
  transferFrom,
  requestBridge,
  fulfillBridge,
  bridgeAVLtoApp,
  claimAVLAccount,
  requestStakeAVL,
  fulfillStakeAVL,
};
