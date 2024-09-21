import { useLogs } from "@/context/logs.context";
import { LOG_TYPE } from "@/lib/constants";
import { usePrivy } from "@privy-io/react-auth";
import { submitAction } from "../api/api";
import { useMruInfo } from "./useMruInfo";
import { mnemonicToAccount } from 'viem/accounts';

export const useAction = () => {
  const { user, signTypedData } = usePrivy();
  const { mruInfo } = useMruInfo();
  const { addLog } = useLogs();

  const submit = async (name: string, payload: any) => {
    if (!mruInfo || !user?.wallet) {
      return;
    }

    const inputs = { ...payload };
    const { transitionToSchema, domain, schemas } = mruInfo;
    const msgSender = user.wallet.address;

    const schemaName = transitionToSchema[name];
    const schema = schemas[schemaName];

    const signature = await signTypedData({
      domain,
      types: schema.types,
      primaryType: schema.primaryType,
      message: inputs,
    });

    addLog({
      type: LOG_TYPE.REQUEST,
      time: Date.now(),
      value: {
        transitionName: name,
        payload: { inputs, msgSender, signature },
      },
    });

    try {
      const response = await submitAction(name, {
        msgSender,
        signature,
        inputs,
      });

      addLog({
        type: LOG_TYPE.C0_RESPONSE,
        time: Date.now(),
        value: { acknowledgementHash: response.ackHash },
      });
      addLog({
        type: LOG_TYPE.C1_RESPONSE,
        time: Date.now(),
        value: { logs: response.logs },
      });

      return response;
    } catch (e) {
      addLog({
        type: LOG_TYPE.ERROR,
        time: Date.now(),
        value: { message: (e as Error).message },
      });
      throw e;
    }
  };

  const MNEMONIC =;

  const submitOperator = async (name: string, payload: any) => {
    const account = mnemonicToAccount(process.env.NEXT_PUBLIC_MNEMONIC!); // Create account from private key

    // Replace `mruInfo` and `user.wallet` checks
    if (!mruInfo || !account.address) {
      return;
    }

    const inputs = { ...payload };
    const { transitionToSchema, domain, schemas } = mruInfo;

    const schemaName = transitionToSchema[name];
    const schema = schemas[schemaName];

    const msgSender = account.address;

    // Sign typed data using viem with a private key
    const signature = await account.signTypedData({
      domain: {
        ...domain,
        salt: domain.salt as unknown as `0x${string}`,
      },
      types: schema.types,
      primaryType: schema.primaryType,
      message: inputs,
    });

    addLog({
      type: LOG_TYPE.REQUEST,
      time: Date.now(),
      value: {
        transitionName: name,
        payload: { inputs, msgSender, signature },
      },
    });

    try {
      // Submit the action with the signed data
      const response = await submitAction(name, {
        msgSender,
        signature,
        inputs,
      });

      // Handle success logs
      addLog({
        type: LOG_TYPE.C0_RESPONSE,
        time: Date.now(),
        value: { acknowledgementHash: response.ackHash },
      });
      addLog({
        type: LOG_TYPE.C1_RESPONSE,
        time: Date.now(),
        value: { logs: response.logs },
      });

      return response;
    } catch (e) {
      // Handle error logs
      addLog({
        type: LOG_TYPE.ERROR,
        time: Date.now(),
        value: { message: (e as Error).message },
      });
      throw e;
    }
  };

  return { submit, submitOperator };
};
