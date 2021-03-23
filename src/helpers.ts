import BigNumber from "bignumber.js";
import { TezosToolkit, Signer, OpKind } from "@taquito/taquito";
import {
  OperationOptions,
  Batch,
  TransferParams,
  Token,
  FA2Token,
  Asset,
  ContractOrAddress,
} from "./types";

export function fromOpOpts(
  tezValue: BigNumber.Value = 0,
  opts: OperationOptions = {}
) {
  return {
    mutez: true,
    value: tezValue,
    ...opts,
  } as any;
}

export function batchify(batch: Batch, transfers: TransferParams[]) {
  return transfers.reduce((b, tParams) => b.withTransfer(tParams), batch);
}

export function estimateTransfers(
  tezos: TezosToolkit,
  transfers: TransferParams[]
) {
  return tezos.estimate.batch(
    transfers.map((tParams) => ({ kind: OpKind.TRANSACTION, ...tParams }))
  );
}

export async function toContract(
  tezos: TezosToolkit,
  contractOrAddress: ContractOrAddress
) {
  return typeof contractOrAddress === "string"
    ? tezos.contract.at(contractOrAddress)
    : contractOrAddress;
}

export function toContractAddress(contractOrAddress: ContractOrAddress) {
  return typeof contractOrAddress === "string"
    ? contractOrAddress
    : contractOrAddress.address;
}

export function isFA2Token(token: Token): token is FA2Token {
  return typeof token.id !== "undefined";
}

export function isXTZAsset(asset: Asset): asset is "xtz" {
  return asset === "xtz";
}

export function isTokenAsset(asset: Asset): asset is Token {
  return asset !== "xtz";
}

export function assertNat(val: BigNumber) {
  if (!val.isInteger() || val.isNegative()) {
    throw new Error("Value is not non-negative natural number");
  }
}

export class ReadOnlySigner implements Signer {
  constructor(private pkh: string, private pk: string) {}

  async publicKeyHash() {
    return this.pkh;
  }
  async publicKey() {
    return this.pk;
  }
  async secretKey(): Promise<string> {
    throw new Error("Secret key cannot be exposed");
  }
  async sign(): Promise<{
    bytes: string;
    sig: string;
    prefixSig: string;
    sbytes: string;
  }> {
    throw new Error("Cannot sign");
  }
}
