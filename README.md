## Installation

- node 16 `nvm install 16 && nvm use 16`
- yarn `npm install -g yarn`

## Usage

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
