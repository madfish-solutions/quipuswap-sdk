import BigNumber from "bignumber.js";
import { Contract, OperationOptions } from "../types";
import { fromOpOpts } from "../helpers";

export function initializeExchange(
  dex: Contract,
  tokenValue: BigNumber.Value,
  tezValue: BigNumber.Value,
  opts?: OperationOptions
) {
  return dex.methods
    .use("initializeExchange", tokenValue)
    .toTransferParams(fromOpOpts(tezValue, opts));
}

export function tezToTokenPayment(
  dex: Contract,
  tezValue: BigNumber.Value,
  tokenValueMin: BigNumber.Value,
  receiver: string,
  opts?: OperationOptions
) {
  return dex.methods
    .use("tezToTokenPayment", tokenValueMin, receiver)
    .toTransferParams(fromOpOpts(tezValue, opts));
}

export function tokenToTezPayment(
  dex: Contract,
  tokenValue: BigNumber.Value,
  tezValueMin: BigNumber.Value,
  receiver: string,
  opts?: OperationOptions
) {
  return dex.methods
    .use("tokenToTezPayment", tokenValue, tezValueMin, receiver)
    .toTransferParams(fromOpOpts(undefined, opts));
}

export function withdrawProfit(
  dex: Contract,
  receiver: string,
  opts?: OperationOptions
) {
  return dex.methods
    .use("withdrawProfit", receiver)
    .toTransferParams(fromOpOpts(undefined, opts));
}

export function investLiquidity(
  dex: Contract,
  tokenValue: BigNumber.Value,
  tezValue: BigNumber.Value,
  opts?: OperationOptions
) {
  return dex.methods
    .use("investLiquidity", tokenValue)
    .toTransferParams(fromOpOpts(tezValue, opts));
}

export function divestLiquidity(
  dex: Contract,
  shares: BigNumber.Value,
  tokenValueMin: BigNumber.Value,
  tezValueMin: BigNumber.Value,
  opts?: OperationOptions
) {
  return dex.methods
    .use("investLiquidity", tezValueMin, tokenValueMin, shares)
    .toTransferParams(fromOpOpts(undefined, opts));
}

export function vote(
  dex: Contract,
  voter: string,
  baker: string,
  shares: BigNumber.Value,
  opts?: OperationOptions
) {
  return dex.methods
    .use("vote", baker, shares, voter)
    .toTransferParams(fromOpOpts(undefined, opts));
}

export function veto(
  dex: Contract,
  voter: string,
  shares: BigNumber.Value,
  opts?: OperationOptions
) {
  return dex.methods
    .use("veto", shares, voter)
    .toTransferParams(fromOpOpts(undefined, opts));
}
