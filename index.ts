import * as dotenv from "dotenv";
import {BaseCoin, EnvironmentName} from "@bitgo/sdk-core";
import { BitGoAPI } from '@bitgo/sdk-api';
import {command, run} from "cmd-ts";
import {
  accessTokenFlag,
  backupKeyFlag,
  envFlag,
  feeFlag,
  oneTimePasscodeFlag,
  passwordFlag,
  recoveryBalanceFlag,
  recoveryDestinationFlag,
  userKeyFlag,
  walletIdFlag,
} from "./common";
import {AbstractUtxoCoin,} from "@bitgo/abstract-utxo";
import * as utxolib from "@bitgo/utxo-lib";
import * as btcSdk from "@bitgo/sdk-coin-btc";

dotenv.config();

function assertIsUtxo(coin: BaseCoin): asserts coin is AbstractUtxoCoin {
  if (!(coin instanceof AbstractUtxoCoin)) {
    throw new Error("coin must be a utxo coin");
  }
}

export async function main(args: {
  env: EnvironmentName;
  accessToken: string;
  otp: string;
  walletId: string;
  walletPassword: string;
  recoveryDestination: string;
  userKey: string;
  backupKey: string;
  balance: string;
  fee: string;
}) {
  const sdk = new BitGoAPI({ env: args.env, accessToken: args.accessToken });
  btcSdk.register(sdk);
  const coin = sdk.coin(args.env === 'prod' ? "btc" : "tbtc");
  assertIsUtxo(coin);

  await sdk.unlock({ otp: args.otp });
  const wallet = await sdk.wallets().get({ id: args.walletId, gpk: true });
  await sdk.lock();

  let userKeyWif: string;
  try {
    userKeyWif = sdk.decrypt({
      input: args.userKey,
      password: args.walletPassword,
    });
  } catch (e) {
    console.log("Failed to decrypt user key.", e);
    throw e;
  }

  let backupKeyWif: string;
  try {
    backupKeyWif = sdk.decrypt({
      input: args.backupKey,
      password: args.walletPassword,
    });
  } catch (e) {
    console.log("Failed to decrypt backup key.", e);
    throw e;
  }
  const createdTx = await wallet.createTransaction({
    recipients: {
      [args.recoveryDestination]: Number(args.balance),
    },
    fee: Number(args.fee),
    bitgoFee:{
      amount: 0,
      address: '',
    }
  });

  const halfSignedTx = await wallet.signTransaction({
    transactionHex: createdTx.transactionHex,
    unspents: createdTx.unspents,
    signingKey: userKeyWif,
    validate: true
  });

  const signedTx = await wallet.signTransaction({
    transactionHex: halfSignedTx.tx,
    unspents: createdTx.unspents,
    signingKey: backupKeyWif,
    validate: true,
    fullLocalSigning: true,
  });


  const txb = utxolib.bitgo.createTransactionBuilderFromTransaction(utxolib.bitgo.createTransactionFromHex(signedTx.tx, coin.network));
  const completedTx = txb.build();
  const completedRawTx = completedTx.toHex();
  console.log('----------------------------------')
  console.log(`Signed Raw Tx: ${completedRawTx}`);
}

const app = command({
  name: "recover-v1-safe-wallet -h",
  args: {
    env: envFlag,
    walletId: walletIdFlag,
    accessToken: accessTokenFlag,
    otp: oneTimePasscodeFlag,
    walletPassword: passwordFlag,
    recoveryDestination: recoveryDestinationFlag,
    userKey: userKeyFlag,
    backupKey: backupKeyFlag,
    balance: recoveryBalanceFlag,
    fee: feeFlag,
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
