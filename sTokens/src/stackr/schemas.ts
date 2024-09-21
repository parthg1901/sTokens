import { ActionSchema, SolidityType } from "@stackr/sdk";

function generateSchemaFromBase(name: string) {
  return new ActionSchema(name, {
    to: SolidityType.ADDRESS,
    from: SolidityType.ADDRESS,
    amount: SolidityType.UINT,
  });
}

export const createAccountSchema = new ActionSchema("createAccount", {
  address: SolidityType.ADDRESS,
});

export const bridgeTokenSchema = new ActionSchema("bridgeToken", {
  toaddress: SolidityType.ADDRESS,
  amount: SolidityType.UINT,
  isBridged: SolidityType.BOOL,
});

export const bridgeAVLtoAppSchema = new ActionSchema("bridgeAVLtoApp", {
  avlAddress: SolidityType.STRING,
  amount: SolidityType.UINT,
  evmAddressHash: SolidityType.STRING
});

export const claimAVLAccountSchema = new ActionSchema("claimAVLAccount", {
  avlAddress: SolidityType.STRING
})

export const requestStakeAVLSchema = new ActionSchema("stakeAVL", {
  timestamp: SolidityType.STRING
})

export const fulfillStakeAVLSchema = new ActionSchema("fulfillStakeAVL", {
  avlAddress: SolidityType.STRING,
  sharesToMint: SolidityType.UINT
});


export const schemas = {
  CreateAccountSchema: createAccountSchema,
  TransferSchema: generateSchemaFromBase("transfer"),
  TransferFromSchema: generateSchemaFromBase("transferFrom"),
  MintSchema: generateSchemaFromBase("mint"),
  BurnSchema: generateSchemaFromBase("burn"),
  ApproveSchema: generateSchemaFromBase("approve"),
  RequestBridgeSchema: bridgeTokenSchema,
  FulfillBridgeSchema: bridgeTokenSchema,
  BridgeAVLtoAppSchema: bridgeAVLtoAppSchema,
  ClaimAVLAccountSchema: claimAVLAccountSchema,
  RequestStakeAVLSchema: requestStakeAVLSchema,
  FulfillStakeAVLSchema: fulfillStakeAVLSchema
};
