import {
  EnvironmentName,
  Environments,
} from "@bitgo/sdk-core";
import { string, option, Type } from "cmd-ts";

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
  short: "i",
  description: "The wallet id.",
});


export const passwordFlag = option({
  type: string,
  defaultValue: () => {
    const password = process.env.WALLET_PASSCODE;
    if (!password) {
      throw new Error("WALLET_PASSCODE env var not set");
    }
    return password;
  },
  long: "walletPassword",
  short: "p",
  description: "The wallet passphrase for the wallet associated to walletId.",
});

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
  description: "The access token to login to BitGo.",
});

export const oneTimePasscodeFlag = option({
  type: string,
  defaultValue: () => {
    const oneTimePasscode = process.env.OTP;
    if (!oneTimePasscode) {
      throw new Error("OTP env var not set");
    }
    return oneTimePasscode;
  },
  long: "otp",
  short: "o",
  description: "The one-time passcode to login to BitGo.",
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

export const userKeyFlag = option({
  type: string,
  defaultValue: () => {
    const userKey = process.env.USER_KEY;
    if (!userKey) {
      throw new Error("USER_KEY env var not set");
    }
    return userKey;
  },
  long: "userKey",
  short: "u",
  description:
      "Encrypted user private key (xprv)",
});

export const backupKeyFlag = option({
  type: string,
  defaultValue: () => {
    const backupKey = process.env.BACKUP_KEY;
    if (!backupKey) {
      throw new Error("BACKUP_KEY env var not set");
    }
    return backupKey;
  },
  long: "backupKey",
  short: "b",
  description:
      "Encrypted backup private key (xprv)",
});

export const recoveryBalanceFlag = option({
  type: string,
  defaultValue: () => {
    const recoveryBalance = process.env.RECOVERY_BALANCE;
    if (!recoveryBalance) {
      throw new Error("RECOVERY_BALANCE env var not set");
    }
    return recoveryBalance;
  },
  long: "recoveryBalance",
  short: "r",
  description:
      "Amount of coin to recover",
});

export const feeFlag = option({
  type: string,
  defaultValue: () => {
    const fee = process.env.FEE;
    if (!fee) {
      throw new Error("FEE env var not set");
    }
    return fee;
  },
  long: "fee",
  short: "f",
  description:
      "Recovery transaction on-chain fee",
});
