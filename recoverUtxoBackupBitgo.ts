import * as dotenv from "dotenv";
dotenv.config();

import {
  BaseCoin,
  EnvironmentName,
  Keychains,
  Wallet,
  isTriple,
} from "@bitgo/sdk-core";
import { BitGo } from "bitgo";
import { command, run } from "cmd-ts";
import { walletIdFlag, envFlag, passwordFlag, accessTokenFlag, recoveryDestinationFlag, blockChairApiKeyFlag } from "./common";
import { AbstractUtxoCoin, FormattedOfflineVaultTxInfo, backupKeyRecovery, forCoin, signAndVerifyWalletTransaction } from "@bitgo/abstract-utxo";
import { Transaction, bip32 } from "@bitgo/utxo-lib";
import * as utxolib from '@bitgo/utxo-lib';
import { BlockchairApi } from "@bitgo/blockapis";

function assertIsUtxo(coin: BaseCoin): asserts coin is AbstractUtxoCoin {
  if (!(coin instanceof AbstractUtxoCoin)) {
    throw new Error("coin must be a utxo coin");
  }
}

export async function main(args: {
  walletId: string;
  env: EnvironmentName;
  walletPassword: string;
  accessToken: string;
  recoveryDestination: string;
  blockChairApiKey: string;
}) {
  console.log({ ...args, accessToken: "REDACTED", walletPassword: "REDACTED", blockChairApiKey: "REDACTED" });
  const sdk = new BitGo({ env: args.env, accessToken: args.accessToken });
  const walletJSON = await sdk
    .get(sdk.url(`/wallet/${args.walletId}`, 2))
    .result();
  
  const coin = sdk.coin(walletJSON.coin);
  assertIsUtxo(coin);
  
  const wallet = new Wallet(sdk, coin, walletJSON);
  const keychains = new Keychains(sdk, coin);
  const userKey = await keychains.get({
    id: wallet.keyIds()[0],
  });
  const backupKey = await keychains.get({
    id: wallet.keyIds()[1],
  });
  const bitgoKey = await keychains.get({
    id: wallet.keyIds()[2],
  });
  if (!userKey.pub || !backupKey.pub || !bitgoKey.pub) {
    throw new Error('keys are missing pubs');
  }
  if (!backupKey.encryptedPrv) {
    throw new Error("backup key missing encryptedPrv");
  }
  
  // build unsigned sweep 
  const { txHex, txInfo } = await backupKeyRecovery(coin, sdk,{
    userKey: userKey.pub,
    backupKey: backupKey.pub,
    bitgoKey: bitgoKey.pub,
    walletPassphrase: args.walletPassword,
    recoveryDestination: args.recoveryDestination,
    scan: 20,
    ignoreAddressTypes: ['p2wsh'],
    recoveryProvider: BlockchairApi.forCoin(coin.getChain(), { apiToken: args.blockChairApiKey }),
  }) as FormattedOfflineVaultTxInfo;
  
  // sign with backup key
  // console.log(userKey, backupKey, bitgoKey);
  const keys = [
    bip32.fromBase58(userKey.pub),
    bip32.fromBase58(sdk.decrypt({ password: args.walletPassword, input: backupKey.encryptedPrv })),
    bip32.fromBase58(bitgoKey.pub),
  ]
  if (!isTriple(keys)) {
    throw new Error(`expected key triple`);
  }
  const walletKeys = new utxolib.bitgo.RootWalletKeys(keys, [
    utxolib.bitgo.RootWalletKeys.defaultPrefix,
    utxolib.bitgo.RootWalletKeys.defaultPrefix,
    utxolib.bitgo.RootWalletKeys.defaultPrefix,
  ]);
  const tx = signAndVerifyWalletTransaction<number>(
      Transaction.fromHex(txHex) as utxolib.bitgo.UtxoTransaction<number>,
      txInfo.unspents,
      new utxolib.bitgo.WalletUnspentSigner<utxolib.bitgo.RootWalletKeys>(walletKeys, walletKeys.backup, walletKeys.bitgo),
      { isLastSignature: false }
  );

  // send half signed
  const sendParams = {
    txHex: tx.toHex(),
  };
  const sendRes = await sdk.post(sdk.url('/tx/send', 2)).send(sendParams).result();
  console.log(JSON.stringify(sendRes, null, 2));
  return sendRes;
}

const app = command({
  name: "yarn start",
  args: {
    walletId: walletIdFlag,
    env: envFlag,
    walletPassword: passwordFlag,
    accessToken: accessTokenFlag,
    recoveryDestination: recoveryDestinationFlag,
    blockChairApiKey: blockChairApiKeyFlag,
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
