## Installation

- node 16 `nvm install 16 && nvm use 16`
- yarn `npm install -g yarn`

## Usage

### Verify Access to Keys

```
yarn
yarn start --walletId 123 --keyType backup --env test --walletPassword 456 --accessToken 789
```

To reduce retries the following can be supplied via env vars via a `.env` file:

- walletId => WALLET_ID
- accessToken => ACCESS_TOKEN
- env => BITGO_ENV

With the above added as environment variables will be:

```
yarn start --keyType user --walletPassword 123
```

### Recover Funds from Wallet Using Backup Key

**Please contact support before attempting this recovery**

```
# usage
yarn run --accessToken XXX --walletId XXX --walletPassword XXX --destination XXX --env XXX --blockChairApiKey XXX
```
