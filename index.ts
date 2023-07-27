import * as dotenv from "dotenv";
dotenv.config();

import {
  EnvironmentName,
  Keychains,
  Wallet,
} from "@bitgo/sdk-core";
import { BitGo } from "bitgo";
import { command, run } from "cmd-ts";
import { walletIdFlag, KeyType, keyTypeFlag, envFlag, passwordFlag, accessTokenFlag } from "./common";

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
