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
  Contract,
  ContractResolver,
} from "./types";

let contractResolver: ContractResolver = (tezos, address) =>
  tezos.contract.at(address);

export function setContractResolver(resolver: ContractResolver) {
  contractResolver = resolver;
}

export function fromOpOpts(
  tezValue: BigNumber.Value = 0,
  opts: OperationOptions = {}
) {
  return {
    mutez: true,
    amount: tezValue,
    ...opts,
  } as any;
}

export function batchify<B extends Batch>(
  batch: B,
  transfers: TransferParams[]
): B {
  for (const tParams of transfers) {
    batch.withTransfer(tParams);
  }
  return batch;
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
  entry: FoundDex | ContractOrAddress
): Promise<Contract> {
  return typeof entry === "string"
    ? contractResolver(tezos, entry)
    : entry instanceof FoundDex
    ? entry.contract
    : entry;
}

export function toContractAddress(contractOrAddress: ContractOrAddress) {
  return typeof contractOrAddress === "string"
    ? contractOrAddress
    : contractOrAddress.address;
}

export function isFA2Token(token: Token): token is FA2Token {
  return typeof token.id !== "undefined";
}

export function isTezAsset(asset: Asset): asset is "tez" {
  return asset === "tez";
}

export function isTokenAsset(asset: Asset): asset is Token {
  return asset !== "tez";
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

export class FoundDex {
  constructor(public contract: Contract, public storage: any) {}
}
