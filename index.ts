import * as dotenv from "dotenv";
dotenv.config();

import {
  EnvironmentName,
  Environments,
  Keychains,
  Wallet,
} from "@bitgo/sdk-core";
import { BitGo } from "bitgo";
import { command, run, string, option, Type } from "cmd-ts";

const accessTokenFlag = option({
  type: string,
  defaultValue: () => {
    const accessToken = process.env.ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("ACCESS_TOKEN env var not set");
    }
    return accessToken;
  },
  long: "accessToken",
  short: "a",
  description:
    "BitGo user account access token. If not provided, the env var ACCESS_TOKEN will be used.",
});

const passwordFlag = option({
  type: string,
  long: "walletPassword",
  short: "p",
  description: "The wallet passphrase for the wallet associated to walletId.",
});

const walletIdFlag = option({
  type: string,
  defaultValue: () => {
    const walletId = process.env.WALLET_ID;
    if (!walletId) {
      throw new Error("WALLET_ID env var not set");
    }
    return walletId;
  },
  long: "walletId",
  short: "w",
  description:
    "BitGo wallet id. If not provided, the env var WALLET_ID will be used.",
});

const keyTypes = ["user", "backup"] as const;

type KeyType = (typeof keyTypes)[number];

const KeyTypeDecoder: Type<string, KeyType> = {
  async from(str: string): Promise<KeyType> {
    if (!keyTypes.includes(str as KeyType)) {
      throw new Error(`invalid keyType ${str}`);
    }
    return str as KeyType;
  },
};

const keyTypeFlag = option({
  type: KeyTypeDecoder,
  long: "keyType",
  short: "k",
  defaultValue: () => keyTypes[0],
  description: "Wether to verify user or backup key.",
});

const envDecoder: Type<string, EnvironmentName> = {
  async from(str: string): Promise<EnvironmentName> {
    if (Environments[str as keyof typeof Environments] !== undefined) {
      return str as EnvironmentName;
    }
    throw new Error(`invalid environment ${str}`);
  },
};

const envFlag = option({
  type: envDecoder,
  long: "env",
  short: "e",
  defaultValue: () => {
    const envStr = process.env.BITGO_ENV;
    if (Environments[envStr as keyof typeof Environments] !== undefined) {
      return envStr as EnvironmentName;
    }
    throw new Error("BITGO_ENV env var not set");
  },
  description:
    "BitGo environment. If not provided, the env var BITGO_ENV will be used.",
});

export async function main(args: {
  walletId: string;
  keyType: KeyType;
  env: EnvironmentName;
  walletPassword: string;
  accessToken: string;
}) {
  console.log({ ...args, accessToken: "REDACTED", walletPassword: "REDACTED" });
  const sdk = new BitGo({ env: args.env, accessToken: args.accessToken });
  const walletJSON = await sdk
    .get(sdk.url(`/wallet/${args.walletId}`, 2))
    .result();
  const coin = sdk.coin(walletJSON.coin);

  const wallet = new Wallet(sdk, coin, walletJSON);
  const keychains = new Keychains(sdk, coin);
  const keyChain = await keychains.get({
    id: wallet.keyIds()[args.keyType === "user" ? 0 : 1],
  });
  if (!keyChain.encryptedPrv) {
    console.log("this key does not have an encryptedPrv stored at BitGo!");
    return;
  }
  try {
    sdk.decrypt({
      password: args.walletPassword,
      input: keyChain.encryptedPrv,
    });
  } catch (e) {
    console.log(
      "######################\npassword is incorrect!\n######################"
    );
    // console.trace(e);
    return;
  }
  console.log(
    "######################\npassword is correct!\n######################"
  );
}

const app = command({
  name: "yarn start",
  args: {
    walletId: walletIdFlag,
    keyType: keyTypeFlag,
    env: envFlag,
    walletPassword: passwordFlag,
    accessToken: accessTokenFlag,
  },
  handler: async (args) => {
    try {
      await main(args);
    } catch (e) {
      console.trace(e);
    }
  },
});

run(app, process.argv.slice(2))
  .then(() => console.log("done"))
  .catch((e) => console.trace(e));
