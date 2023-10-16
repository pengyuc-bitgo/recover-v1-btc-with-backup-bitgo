import * as dotenv from "dotenv";
import {BaseCoin, bitcoin, EnvironmentName, isTriple,} from "@bitgo/sdk-core";
import {BitGo} from "bitgo";
import {command, run} from "cmd-ts";
import {
  accessTokenFlag,
  backupKeyFlag,
  bitgoPubKeyFlag,
  blockChairApiKeyFlag,
  envFlag,
  passwordFlag,
  recoveryDestinationFlag,
  userKeyFlag,
  walletIdFlag,
} from "./common";
import {
  AbstractUtxoCoin,
  backupKeyRecovery,
  FormattedOfflineVaultTxInfo,
  signAndVerifyWalletTransaction,
} from "@bitgo/abstract-utxo";
import * as utxolib from "@bitgo/utxo-lib";
import {bip32, Transaction} from "@bitgo/utxo-lib";
import {BlockchairApi} from "@bitgo/blockapis";

dotenv.config();

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
  userKey: string;
  backupKey: string;
  bitgoPubKey: string;
}) {
  console.log({
    ...args,
    accessToken: "REDACTED",
    walletPassword: "REDACTED",
    blockChairApiKey: "REDACTED",
    userKey: "REDACTED",
    backupKey: "REDACTED",
  });

  const sdk = new BitGo({ env: args.env, accessToken: args.accessToken });
  const coin = sdk.coin("btc");
  assertIsUtxo(coin);

  // build unsigned sweep
  const { txBuilder, unspents } = await (async () => {
    const { txHex, txInfo } = (await backupKeyRecovery(coin, sdk, {
      userKey: args.userKey,
      backupKey: args.backupKey,
      bitgoKey: args.bitgoPubKey,
      walletPassphrase: args.walletPassword,
      recoveryDestination: args.recoveryDestination,
      scan: 20,
      ignoreAddressTypes: ["p2wsh"],
      recoveryProvider: BlockchairApi.forCoin(coin.getChain(), {
        apiToken: args.blockChairApiKey,
      }),
    })) as FormattedOfflineVaultTxInfo;
    const output = Transaction.fromHex(txHex).outs[0];
    txInfo.unspents = txInfo.unspents.map((u) => {
      return {
        ...u,
        address: utxolib.addressFormat.toCanonicalFormat(
          u.address,
          coin.network
        ),
      };
    });
    const txBuilder = utxolib.bitgo.createTransactionBuilderForNetwork<number>(
      coin.network
    );
    txInfo.unspents.forEach((unspent) => {
      const { txid, vout } = utxolib.bitgo.parseOutputId(unspent.id);
      txBuilder.addInput(
        txid,
        vout,
        0xffffffff,
        utxolib.address.toOutputScript(unspent.address, coin.network),
        unspent.value
      );
    });
    console.log("txHex", txHex);
    console.log("txInfo", JSON.stringify(txInfo, null, 2));
    txBuilder.addOutput(
      utxolib.addressFormat.toCanonicalFormat(
        args.recoveryDestination,
        coin.network
      ),
      output.value
    );
    return {
      txBuilder,
      unspents: txInfo.unspents,
    };
  })();

  // Transaction

  // sign with backup key
  const userKeyBase58 = sdk.decrypt({
    password: args.walletPassword,
    input: args.userKey,
  });
  const backupKeyBase58 = sdk.decrypt({
    password: args.walletPassword,
    input: args.backupKey,
  });

  const keys = [
    bip32.fromBase58(userKeyBase58),
    bip32.fromBase58(backupKeyBase58),
    bip32.fromBase58(args.bitgoPubKey),
  ];
  if (!isTriple(keys)) {
    throw new Error(`expected key triple`);
  }
  // no derive path for v1 safe wallets
  const walletKeys = new utxolib.bitgo.RootWalletKeys(keys, /*["","","",]*/);

  const tx = signAndVerifyWalletTransaction<number>(
    txBuilder,
    unspents,
    new utxolib.bitgo.WalletUnspentSigner<utxolib.bitgo.RootWalletKeys>(
      walletKeys,
      walletKeys.user,
      walletKeys.backup
    ),
    { isLastSignature: true }
  );

  console.log("signed tx", tx.toHex());
}

const app = command({
  name: "yarn restore",
  args: {
    walletId: walletIdFlag,
    env: envFlag,
    walletPassword: passwordFlag,
    accessToken: accessTokenFlag,
    recoveryDestination: recoveryDestinationFlag,
    blockChairApiKey: blockChairApiKeyFlag,
    userKey: userKeyFlag,
    backupKey: backupKeyFlag,
    bitgoPubKey: bitgoPubKeyFlag,
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
