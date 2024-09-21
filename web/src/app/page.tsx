"use client";

import { getState } from "@/api/api";
import { ActionLogs } from "@/components/action-logs";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/useAction";
import {usePrivy, WalletWithMetadata} from "@privy-io/react-auth";
import Link from "next/link";
import { useEffect, useState } from "react";
import {formatHash} from "@/lib/utils";
import {
  ApiPromise,
  disconnect,
  formatNumberToBalance,
  getDecimals,
  initialize,
  signedExtensions,
  types
} from "avail-js-sdk"
import { isNumber } from "@polkadot/util"
import {SignerOptions} from "@polkadot/api/types";
import {blake2AsHex} from "@polkadot/util-crypto";

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

export default function Home() {
  const { ready, authenticated, login, user } = usePrivy();
  const wallets = user?.linkedAccounts as WalletWithMetadata[];

  const [fetching, setFetching] = useState(true);
  const [value, setValue] = useState<Leaves>({erc20:[],bridge:[],avl:[]});
  const [submitting, setSubmitting] = useState(false);
  const { submit, submitOperator } = useAction();
  const actionDisabled = !ready || !authenticated;

  const [foundExtensions, setFoundExtensions] = useState<{
    [extensionName: string]: { version: string; enable: Function }
  }>({})
  const [extensionsInitialized, setExtensionsInitialized] = useState<Record<string, boolean>>({})
  const [availApi, setAvailApi] = useState<ApiPromise | undefined>()
  const [logs, setLogs] = useState<{ message: string; severity: "info" | "error" }[]>([])

  const findExtension = async () => {
    // Init Extension
    const { web3Enable } = await import("@polkadot/extension-dapp")
    await web3Enable("Example with extension")

    const web3Window = window as any
    if (web3Window.injectedWeb3 as any) {
      setFoundExtensions(web3Window.injectedWeb3)
    }
  }

  const getInjectorMetadata = (api: ApiPromise) => {
    return {
      chain: api.runtimeChain.toString(),
      specVersion: api.runtimeVersion.specVersion.toNumber(),
      tokenDecimals: api.registry.chainDecimals[0] || 18,
      tokenSymbol: api.registry.chainTokens[0] || "AVAIL",
      genesisHash: api.genesisHash.toHex(),
      ss58Format: isNumber(api.registry.chainSS58) ? api.registry.chainSS58 : 0,
      chainType: "substrate" as "substrate",
      icon: "substrate",
      types: types as any,

      /** !! IMPORTANT !!
       * This is the important part, we tell the extension how to handle our signedExtension (even if it seems it's already there)
       **/
      userExtensions: signedExtensions,
    }
  }

  const listenToAvail = async () => {
    await availApi?.query.system.events(async (events: any) => {
      const transferEvents = [] as any;
      const remarkedEvents = [] as any;
      const matched = [] as any;

      console.log("----- Received " + events.length + " event(s): -----");
      events.forEach(async (record: any) => {
        const { event, phase } = record;
        console.log(event.method)
        console.log(JSON.parse(event.data.toString()))
        if (event.method === "Transfer") {
          const parsed = JSON.parse(event.data.toString());
          const from = parsed[0];
          const to = parsed[1];
          const amount = BigInt(parsed[2]);
          console.log(parsed)
          if (to === "5ETm3mQvnBHQU5dtnpPixF4apyFQrCSmqGt2MWb5CmcSSa4P") {
            console.log("Money sent to vault!");
            transferEvents.push({
              from: from,
              amount: amount,
            });
          }
          console.log(transferEvents)
        } else if (event.method === "Remarked") {
          const parsed = JSON.parse(event.data.toString());

          const from = parsed[0];
          const hash = parsed[1];

          remarkedEvents.push({
            from: from,
            hash: hash,
          });
          console.log(remarkedEvents)
        }
      });

      transferEvents.forEach((e: any) => {
        const remark = remarkedEvents.find((event: any) => event.from === e.from);
        if (remark) {
          matched.push({
            avlAddress: e.from,
            hash: remark.hash,
            amount: e.amount,
          });
        }
      });

      console.log(matched);

      if (matched.length > 0) {
        console.log("Matched a request!");
        const payload = {
          avlAddress: matched[0].avlAddress,
          amount: matched[0].amount.toString(),
          evmAddressHash: matched[0].hash,
        };
        const actionName = "bridgeAVLtoApp";
        submitOperator("bridgeAVLtoApp", payload);

      }
    });

  }

  const sendTx = async (extension: string) => {
    try {
      // Import extension utils
      const { web3Accounts, web3FromSource } = await import("@polkadot/extension-dapp")

      // Init API
      let api = availApi
      if (!(api && api.isConnected)) {
        api = await initialize("wss://turing-rpc.avail.sh/ws")
        setAvailApi(api)
      }

      // Get correct extension account / injector
      const accounts = await web3Accounts()
      const filteredAccounts = accounts.filter((x) => x.meta.source === extension)
      if (filteredAccounts.length === 0) throw new Error("No account found")
      const account = filteredAccounts.find((x) => x.address.startsWith("5CDG")) || filteredAccounts[0]
      const injector = await web3FromSource(account.meta.source)

      // Inject our specific metadata once
      if (injector.metadata) {
        if (!extensionsInitialized[extension]) {
          const metadata = getInjectorMetadata(api)
          await injector.metadata.provide(metadata)
          // It would be wise to put this in a persistent storage to not ask everytime
          setExtensionsInitialized({ ...extensionsInitialized, [injector.name]: true })
        }
      }

      const address = (wallets.filter(wallet => wallet.connectorType === "injected")[0].address);
      const DECIMALS = getDecimals(api);

      const amount = await formatNumberToBalance(0, DECIMALS)

      const txs = [
        api.tx.balances.transferKeepAlive(
            "5ETm3mQvnBHQU5dtnpPixF4apyFQrCSmqGt2MWb5CmcSSa4P",
            amount
        ),
        api.tx.system.remarkWithEvent(address),
      ];
      console.log("here")
      api.setSigner(injector.signer);
      const final = await api.tx.utility
          .batch(txs)
          .signAndSend(account.address, async ({ status, events }) => {
            console.log("Inside the callback");
            console.log("status", status);
            const payload = {
              avlAddress: account.address,
              amount: amount.toString(),
              evmAddressHash: blake2AsHex(address),
            };
            const actionName = "bridgeAVLtoApp";
            submitOperator("bridgeAVLtoApp", payload);
          });
      console.log(final);

    } catch (err: any) {
      console.log(err)
    }
  }


  useEffect(() => {
    const getInitialValue = async () => {
      try {
        setFetching(true);
        const res = await getState();
        setValue(res.state);
      } catch (e) {
        alert((e as Error).message);
        console.error(e);
      } finally {
        setFetching(false);
      }
    };
    getInitialValue();
  }, []);

  useEffect(() => {
    if (availApi) {
      // listenToAvail()
    }
  }, [availApi]);

  useEffect(() => {
    if (authenticated) {
      const address = (wallets.filter(wallet => wallet.connectorType === "injected")[0].address);
      if (value.erc20.findIndex((leaf) => leaf.address === address) === -1) {
        handleAction("create", {
          address
        })
      };

    }
  }, [authenticated]);

  const handleAction = async (actionName: string, payload: any) => {
    try {
      setSubmitting(true);
      const res = await submit(actionName, payload);
      if (!res) {
        throw new Error("Failed to submit action");
      }
      setValue(res.logs[0].value);
    } catch (e) {
      alert((e as Error).message);
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const renderBody = () => {
    if (ready && !authenticated) {
      return <Button onClick={login}>Connect Wallet to interact</Button>;
    }

    return (
      <div className="flex gap-4">
        <Button onClick={() => findExtension()}>Detect</Button>
        {Object.keys(foundExtensions).map((extension, i) => {
          return <Button key={i} onClick={() => sendTx(extension)}>{`Send TX with ${extension}`}</Button>
        })}
        <Button
          disabled={actionDisabled || submitting}
          onClick={() => handleAction("increment", { timestamp: Date.now() })}
        >
          Increment
        </Button>
        <Button
          disabled={actionDisabled || submitting}
          onClick={() => handleAction("decrement", { timestamp: Date.now() })}
        >
          Decrement
        </Button>
      </div>
    );
  };

  const renderLinks = () => {
    return (
      <div>
        For inspiration on how to use this starter, check these out:
        <li>
          <Link
            className="text-blue-500 hover:underline"
            href="https://docs.stf.xyz/build/guides/community-examples"
            target="_blank"
          >
            Community Examples
          </Link>
        </li>
        <li>
          <Link
            className="text-blue-500 hover:underline"
            href="https://github.com/aashutoshrathi/awesome-micro-rollups"
            target="_blank"
          >
            awesome-micro-rollups
          </Link>
        </li>
        <li>
          <Link
            className="text-blue-500 hover:underline"
            href="https://docs.stf.xyz"
            target="_blank"
          >
            Official Documentation
          </Link>
        </li>
      </div>
    );
  };

  return (
    <main className="flex m-auto w-full h-full px-4">
      <div className="flex flex-col gap-4 flex-1">
        <p className="text-2xl">
          Current State:
          <code className="mx-4">{fetching ? "..." : JSON.stringify(value)}</code>
        </p>
        <div className="flex gap-4">{renderBody()}</div>
        <div>{renderLinks()}</div>
      </div>
      <ActionLogs />
    </main>
  );
}
