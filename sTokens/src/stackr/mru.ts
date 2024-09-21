import { MicroRollup } from "@stackr/sdk";
import { stackrConfig } from "../../stackr.config";
import { stokenMachine } from "./machine";
import { schemas } from "./schemas";

const mru = await MicroRollup({
  config: stackrConfig,
  actionSchemas: [...Object.values(schemas)],
  stateMachines: [stokenMachine],
  stfSchemaMap: {
    claimAVLAccount: schemas.ClaimAVLAccountSchema,
    create: schemas.CreateAccountSchema,
    mint: schemas.MintSchema,
    burn: schemas.BurnSchema,
    transfer: schemas.TransferSchema,
    approve: schemas.ApproveSchema,
    transferFrom: schemas.TransferFromSchema,
    requestBridge: schemas.RequestBridgeSchema,
    fulfillBridge: schemas.FulfillBridgeSchema,
    bridgeAVLtoApp: schemas.BridgeAVLtoAppSchema,
    requestStakeAVL: schemas.RequestStakeAVLSchema,
    fulfillStakeAVL: schemas.FulfillStakeAVLSchema,
  },
});

await mru.init();

export { mru };
