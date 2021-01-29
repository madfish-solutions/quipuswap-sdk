import BigNumber from "bignumber.js";
import { TezosToolkit, OpKind } from "@taquito/taquito";
import {
  OperationOptions,
  Batch,
  TransferParams,
  Token,
  FA2Token,
  Asset,
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

export function isFA2Token(token: Token): token is FA2Token {
  return typeof token.id !== "undefined";
}

export function isXTZAsset(asset: Asset): asset is "xtz" {
  return asset === "xtz";
}

export function isTokenAsset(asset: Asset): asset is Token {
  return asset !== "xtz";
}
