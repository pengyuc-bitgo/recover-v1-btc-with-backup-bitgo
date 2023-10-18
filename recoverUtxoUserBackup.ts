import * as dotenv from "dotenv";
import {BaseCoin, EnvironmentName,} from "@bitgo/sdk-core";
import {BitGo} from "bitgo";
import {command, run} from "cmd-ts";
import {
  backupKeyFlag,
  envFlag,
  feeFlag, inputHashFlag,
  nonWitnessUtxoFlag,
  passwordFlag,
  recoveryBalanceFlag,
  recoveryDestinationFlag,
  redeemScriptFlag,
  userKeyFlag,
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
  const sdk = new BitGo({ env: args.env });
  const coin = sdk.coin(args.env === 'prod' ? "btc" : "tbtc");
  assertIsUtxo(coin);

  let userKeyPlainText: string;
  try {
    userKeyPlainText = sdk.decrypt({
      input: args.userKey,
      password: args.walletPassword,
    });
  } catch (e) {
    console.log("Failed to decrypt user key.", e);
    throw e;
  }

  let backupKeyPlainText: string;
  try {
    backupKeyPlainText = sdk.decrypt({
      input: args.backupKey,
      password: args.walletPassword,
    });
  } catch (e) {
    console.log("Failed to decrypt backup key.", e);
    throw e;
  }

  let userSigner: utxolib.ECPairInterface;
  try {
    userSigner = utxolib.ECPair.fromWIF(userKeyPlainText, coin.network);
  } catch (e) {
    console.log("Failed to parse decrypted user key.", e);
    throw e;
  }

  let backupSigner: utxolib.ECPairInterface;
  try {
    backupSigner =  utxolib.ECPair.fromWIF(backupKeyPlainText, coin.network);
  } catch (e) {
    console.log("Failed to parse decrypted backup key.", e);
    throw e;
  }

  const psbt = utxolib.bitgo.createPsbtForNetwork({ network: coin.network });
  psbt.addInput({
    hash: args.inputHash,
    index: 0,
    redeemScript: Buffer.from(args.redeemScript,'hex'),
    nonWitnessUtxo: Buffer.from(args.nonWitnessUtxo,'hex'),
  });
  psbt.addOutput({
    script: utxolib.address.toOutputScript(args.recoveryDestination, coin.network),
    value: BigInt(args.balance) - BigInt(args.fee),
  });

  psbt.signAllInputs(userSigner);
  psbt.signAllInputs(backupSigner);

  psbt.validateSignaturesOfAllInputs();
  psbt.finalizeAllInputs();
  const fullySignedTx = psbt.extractTransaction();
  console.log(`Signed Tx: ${fullySignedTx.toHex()}`);
}

const app = command({
  name: "yarn recover",
  args: {
    env: envFlag,
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
