import {
  EnvironmentName,
  Environments,
} from "@bitgo/sdk-core";
import { string, option, Type } from "cmd-ts";

export const accessTokenFlag = option({
  type: string,
  defaultValue: () => {
    const accessToken = process.env.ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("ACCESS_TOKEN env var not set");
    }
    return accessToken;
  },
  long: "accessToken",
  short: "a",
  description:
    "BitGo user account access token. If not provided, the env var ACCESS_TOKEN will be used.",
});

export const passwordFlag = option({
  type: string,
  long: "walletPassword",
  short: "p",
  description: "The wallet passphrase for the wallet associated to walletId.",
});

export const walletIdFlag = option({
  type: string,
  defaultValue: () => {
    const walletId = process.env.WALLET_ID;
    if (!walletId) {
      throw new Error("WALLET_ID env var not set");
    }
    return walletId;
  },
  long: "walletId",
  short: "w",
  description:
    "BitGo wallet id. If not provided, the env var WALLET_ID will be used.",
});

export const recoveryDestinationFlag = option({
  type: string,
  defaultValue: () => {
    const dest = process.env.RECOVERY_DESTINATION;
    if (!dest) {
      throw new Error("RECOVERY_DESTINATION env var not set");
    }
    return dest;
  },
  long: "destination",
  short: "d",
  description:
    "Recovery destination. If not provided, the env var RECOVERY_DESTINATION will be used.",
});

export const blockChairApiKeyFlag = option({
  type: string,
  defaultValue: () => {
    const apiKey = process.env.BLOCK_CHAIR_API_KEY;
    if (!apiKey) {
      throw new Error("BLOCK_CHAIR_API_KEY env var not set");
    }
    return apiKey;
  },
  long: "blockChairApiKey",
  short: "blockChairApiKey",
  description:
    "Recovery destination. If not provided, the env var BLOCK_CHAIR_API_KEY will be used.",
});

export const keyTypes = ["user", "backup"] as const;

export type KeyType = (typeof keyTypes)[number];

export const KeyTypeDecoder: Type<string, KeyType> = {
  async from(str: string): Promise<KeyType> {
    if (!keyTypes.includes(str as KeyType)) {
      throw new Error(`invalid keyType ${str}`);
    }
    return str as KeyType;
  },
};

export const keyTypeFlag = option({
  type: KeyTypeDecoder,
  long: "keyType",
  short: "k",
  defaultValue: () => keyTypes[0],
  description: "Wether to verify user or backup key.",
});

export const envDecoder: Type<string, EnvironmentName> = {
  async from(str: string): Promise<EnvironmentName> {
    if (Environments[str as keyof typeof Environments] !== undefined) {
      return str as EnvironmentName;
    }
    throw new Error(`invalid environment ${str}`);
  },
};

export const envFlag = option({
  type: envDecoder,
  long: "env",
  short: "e",
  defaultValue: () => {
    const envStr = process.env.BITGO_ENV;
    if (Environments[envStr as keyof typeof Environments] !== undefined) {
      return envStr as EnvironmentName;
    }
    throw new Error("BITGO_ENV env var not set");
  },
  description:
    "BitGo environment. If not provided, the env var BITGO_ENV will be used.",
});