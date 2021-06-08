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
    .initializeExchange(tokenValue)
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
    .tezToTokenPayment(tokenValueMin, receiver)
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
    .tokenToTezPayment(tokenValue, tezValueMin, receiver)
    .toTransferParams(fromOpOpts(undefined, opts));
}

export function withdrawProfit(
  dex: Contract,
  receiver: string,
  opts?: OperationOptions
) {
  return dex.methods
    .withdrawProfit(receiver)
    .toTransferParams(fromOpOpts(undefined, opts));
}

export function investLiquidity(
  dex: Contract,
  tokenValue: BigNumber.Value,
  tezValue: BigNumber.Value,
  opts?: OperationOptions
) {
  return dex.methods
    .investLiquidity(tokenValue)
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
    .divestLiquidity(tezValueMin, tokenValueMin, shares)
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
    .vote(baker, shares, voter)
    .toTransferParams(fromOpOpts(undefined, opts));
}

export function veto(
  dex: Contract,
  voter: string,
  shares: BigNumber.Value,
  opts?: OperationOptions
) {
  return dex.methods
    .veto(shares, voter)
    .toTransferParams(fromOpOpts(undefined, opts));
}
