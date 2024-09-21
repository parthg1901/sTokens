import { State } from "@stackr/sdk/machine";
import { solidityPackedKeccak256 } from "ethers";
import {Leaves} from "./types.ts";
import {StokensTree} from "./tree.ts";

export class StokenState extends State<Leaves, StokensTree> {
  constructor(state: Leaves) {
    super(state);
  }

  transformer() {
    return {
      wrap: () => {
        return new StokensTree(this.state);
      },
      unwrap: (wrappedState: StokensTree) => {
        return wrappedState.state;
      },
    };
  }



  getRootHash(): string {
    return solidityPackedKeccak256(
        ["bytes32", "bytes32", "bytes32"],
        [
          this.transformer().wrap().merkleTreeERC20.getHexRoot().padEnd(66, '0'),
          this.transformer().wrap().merkleTreeBridge.getHexRoot().padEnd(66, '0'),
          this.transformer().wrap().merkleTreeAVL.getHexRoot().padEnd(66, '0'),
        ]
    );
  }
}
