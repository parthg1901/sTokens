import { solidityPackedKeccak256 } from "ethers";
import { MerkleTree } from "merkletreejs";
import {AVLLeaves, BridgeLeaves, ERC20Leaves, Leaves} from "./types.ts";

export class StokensTree {
    public state: Leaves;

    public merkleTreeERC20: MerkleTree;
    public merkleTreeBridge: MerkleTree;
    public erc20leaves: ERC20Leaves;
    public bridgeleaves: BridgeLeaves;
    public avlleaves: AVLLeaves;
    public merkleTreeAVL: MerkleTree;

    constructor(state: Leaves) {
        let { merkleTreeERC20, merkleTreeBridge, merkleTreeAVL } = this.createTrees(
            state
        );

        this.merkleTreeERC20 = merkleTreeERC20;
        this.merkleTreeBridge = merkleTreeBridge;
        this.erc20leaves = state.erc20;
        this.bridgeleaves = state.bridge;
        this.avlleaves = state.avl;
        this.merkleTreeAVL = merkleTreeAVL;
        this.state = state;
    }

    createTrees(state: Leaves) {
        const erc20Hashes = (state.erc20).map(leaf =>

            solidityPackedKeccak256(
                ["address", "uint256", "uint256"],
                [leaf.address, leaf.balance, leaf.nonce]
            )
        );

        const bridgeHashes = (state.bridge).map(leaf =>
             solidityPackedKeccak256(
                ["address", "uint256", "bool"],
                [leaf.toaddress, leaf.amount, leaf.isBridged]
            )
        );

        const avlHashes = state.avl.map(leaf =>

            solidityPackedKeccak256(
                [
                    "address",
                    "string",
                    "uint256",
                    "uint256",
                    "string",
                    "bool",
                    "uint256",
                    "bool"
                ],
                [
                    leaf.evmAddress,
                    leaf.avlAddress,
                    leaf.freeBalance,
                    leaf.stakingShares,
                    leaf.evmAddressHash,
                    leaf.claimed,
                    leaf.nonce,
                    leaf.requestedStake
                ]
            )
        );
        return {
            merkleTreeERC20: new MerkleTree(erc20Hashes),
            merkleTreeBridge: new MerkleTree(bridgeHashes),
            merkleTreeAVL: new MerkleTree(avlHashes),
        };
    }

    getRoots() {
        return {
            erc20Root: this.merkleTreeERC20.getHexRoot(),
            bridgeRoot: this.merkleTreeBridge.getHexRoot(),
            avlRoot: this.merkleTreeAVL.getHexRoot(),
        };
    }
}