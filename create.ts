import * as dotenv from "dotenv";
dotenv.config();

import {
    EnvironmentName,
    Keychains,
    Wallet,
} from "@bitgo/sdk-core";
import { BitGo } from "bitgo";
import { command, run } from "cmd-ts";
import { envFlag, passwordFlag, accessTokenFlag } from "./common";

export async function main(args: {
    env: EnvironmentName;
    walletPassword: string;
    accessToken: string;
}) {
    const sdk = new BitGo({ env: args.env, accessToken: args.accessToken });

    console.log("create wallet");
    const walletV1 = await sdk.wallets().createWalletWithKeychains({
        "label": "testRecoveryV1Wallet",
        "passphrase": args.walletPassword,
    }, (err: any, result:any) => {
        console.log(result);
    })

    const walletInstanceV1 = walletV1.wallet;

    console.log(`Wallet ID: ${walletInstanceV1.id()}`);
    console.log(`Receive address: ${walletInstanceV1.id()}`);

    console.log('BACK THIS UP: ');
    console.log(`User keychain encrypted xPrv: ${JSON.stringify(walletV1.userKeychain)}`);
    console.log(`Backup keychain xPrv: ${JSON.stringify(walletV1.backupKeychain)}`);
    console.log(`BitGo keychain xPrv: ${JSON.stringify(walletV1.bitgoKeychain)}`);
}

const app = command({
    name: "yarn start",
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
