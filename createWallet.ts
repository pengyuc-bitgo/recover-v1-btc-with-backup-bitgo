import * as dotenv from "dotenv";
import {EnvironmentName, Wallet,} from "@bitgo/sdk-core";
import {BitGo} from "bitgo";
import {command, run} from "cmd-ts";
import {accessTokenFlag, envFlag, passwordFlag,} from "./common";
import {address, bitgo, networks, testutil} from "@bitgo/utxo-lib";

dotenv.config();

export async function main(args: {
    env: EnvironmentName;
    accessToken: string;
    walletPassword: string;
}) {
    const sdk = new BitGo({ env: args.env, accessToken: args.accessToken });
    const coin = sdk.coin("tbtc");

    // create v1 user and backup key
    const uncompressedKeyPairs = testutil.getUncompressedKeyTriple([12432414, 3424, 6585235236546]);
    const uncompressedPubKeys = uncompressedKeyPairs.map((keyPair) => keyPair.publicKey);
    const outputScript = bitgo.legacySafe.createLegacySafeOutputScript2of3(uncompressedPubKeys, networks.testnet);
    const addressTestnet =  address.fromOutputScript(outputScript.scriptPubKey, networks.testnet);

    const userKeyWif = uncompressedKeyPairs[0].toWIF();
    const backupKeyWif = uncompressedKeyPairs[1].toWIF();
    console.log('userKeyWif: ', userKeyWif);
    console.log('backupKeyWif:', backupKeyWif);
    console.log('walletPassword:', args.walletPassword);

    // encrypt keys with wallet password
    const encryptedUserKey = sdk.encrypt({
        input: userKeyWif,
        password: args.walletPassword
    });
    const encryptedBackupKey = sdk.encrypt({
        input: backupKeyWif,
        password: args.walletPassword
    });

    console.log('encryptedUserKey: ', encryptedUserKey);
    console.log('encryptedBackupKey:', encryptedBackupKey);
    console.log('addressTestnet:', addressTestnet);

    const userPubKey = uncompressedPubKeys[0].toString('hex');
    const backupPubKey = uncompressedPubKeys[1].toString('hex');

    console.log('userPubKey: ', userPubKey);
    console.log('backupPubKey:', backupPubKey);

    // make BitGo create a v1 safe wallet with uncompressed keys
    const walletResponse = await sdk.post(sdk.url('/wallet', 1)).send({
        enterprise: '5cb64a0cdc5cdf8a03710c459a71bbdf', // starshipEnterprise
        label: 'v1-safe-wallet-uncompressed-keys-recovery-real',
        type: 'safe',
        m: 2,
        n: 3,
        userPublicKey: userPubKey,
        backupPublicKey: backupPubKey,
        encryptedUserPrivateKey: encryptedUserKey,
        useUncompressedPubKeys: true,
    }).result();

    console.log('createdWallet:', JSON.stringify(walletResponse, null, 4));
}

const app = command({
    name: "yarn create",
    args: {
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
