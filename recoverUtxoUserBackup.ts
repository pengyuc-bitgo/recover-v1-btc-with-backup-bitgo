import * as dotenv from "dotenv";
import {BaseCoin, EnvironmentName} from "@bitgo/sdk-core";
import {BitGo} from "bitgo";
import {command, number, run} from "cmd-ts";
import {
  accessTokenFlag,
  backupKeyFlag,
  envFlag,
  feeFlag, inputHashFlag,
  nonWitnessUtxoFlag,
  passwordFlag,
  recoveryBalanceFlag,
  recoveryDestinationFlag,
  redeemScriptFlag,
  userKeyFlag, walletIdFlag,
} from "./common";
import {AbstractUtxoCoin,} from "@bitgo/abstract-utxo";
import * as utxolib from "@bitgo/utxo-lib";

dotenv.config();

function assertIsUtxo(coin: BaseCoin): asserts coin is AbstractUtxoCoin {
  if (!(coin instanceof AbstractUtxoCoin)) {
    throw new Error("coin must be a utxo coin");
  }
}

export async function main(args: {
  env: EnvironmentName;
  accessToken: string;
  walletId: string;
  walletPassword: string;
  recoveryDestination: string;
  userKey: string;
  backupKey: string;
  redeemScript: string;
  nonWitnessUtxo: string;
  balance: string;
  fee: string;
  inputHash: string;
}) {
  const sdk = new BitGo({ env: args.env, accessToken: args.accessToken });
  const coin = sdk.coin(args.env === 'prod' ? "btc" : "tbtc");
  assertIsUtxo(coin);

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
  await sdk.unlock({ otp: '000000' });
  const wallet = await sdk.wallets().get({ id: args.walletId, gpk: true });
  await sdk.lock();
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

  console.log(`Signed Tx: ${signedTx.tx}`);

}

const app = command({
  name: "yarn recover",
  args: {
    env: envFlag,
    walletId: walletIdFlag,
    accessToken: accessTokenFlag,
    walletPassword: passwordFlag,
    recoveryDestination: recoveryDestinationFlag,
    userKey: userKeyFlag,
    backupKey: backupKeyFlag,
    redeemScript: redeemScriptFlag,
    nonWitnessUtxo: nonWitnessUtxoFlag,
    balance: recoveryBalanceFlag,
    fee: feeFlag,
    inputHash: inputHashFlag,
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
