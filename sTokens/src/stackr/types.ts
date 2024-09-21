export type ERC20Leaves = {
    address: string;
    balance: number;
    nonce: number;
    allowances: {
        address: string;
        amount: number;
    }[];
}[];

export type AVLLeaves = {
    evmAddress: string;
    avlAddress: string;
    freeBalance: number;
    stakingShares: number;
    evmAddressHash: string;
    claimed: boolean;
    nonce: number;
    requestedStake: boolean;
}[];

export type BridgeLeaves = {
    toaddress: string;
    amount: number;
    isBridged: boolean;
}[];

export type Leaves = {
    erc20: ERC20Leaves;
    bridge: BridgeLeaves;
    avl: AVLLeaves;
};