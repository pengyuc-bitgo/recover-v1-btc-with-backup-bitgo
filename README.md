## Installation

Install Node 16 and yarn:
```shell
nvm install 16 && nvm use 16
npm install -g yarn
yarn install
yarn
```

## Usage
To recover the BTC in your wallet, you will need to input the following data:
1. BitGo user account access token, make sure you have enough spending limit.
2. One-time password (OTP) to login
3. Wallet password
4. Recovery destination. This is the address where the recovered funds will be sent to.
5. User private key. This is the encrypted user private key. You can find it on the key card.
6. Backup private key. This is the encrypted backup private key. You can find it on the key card.

This following information are already pre-filled for you but you can change them:
1. Wallet id with BitGo
2. Wallet balance to be recovered
3. The recovery transactions fee on the Bitcoin network

You can fill in these data in the [.env](./.env) file or pass them as arguments to the script.
The one-time password expires sooner so you can pass it as an argument to the script.

1. Edit the [.env](./.env) file and fill in the data.
```
# Fill in the following variables with your own values
ACCESS_TOKEN=<BitGo user access token>
# OTP=<BitGo user OTP code> # can be specified with '--otp' in command line instead
WALLET_PASSCODE=<BitGo wallet password>
RECOVERY_DESTINATION=<Bitcoin address to send the recovery funds to>
USER_KEY=<Encrypted user key> # looks like: {"iv":"...", ...}
BACKUP_KEY=<Encrypted backup key> # looks like: {"iv":"...", ...}
```
2. Run the script with one-time password:
```
yarn run recovery --otp <BitGo user OTP code>
```
You can find all command line arguments with `-h`:
```shell
yarn run recover -h
```

## Broadcasting the transaction
The script should eventually print out the raw Bitconi transaction like this:
```
----------------------------------
Signed Raw Tx: 0100000002f244479a...a78700000000
```
Copy the raw transaction (just the hex string) and broadcast it on the Bitcoin network. You can use [blockstream.info](https://blockstream.info/tx/push) to broadcast the transaction.
Check your wallet balances after the transaction has been confirmed on the Bitcoin network.
