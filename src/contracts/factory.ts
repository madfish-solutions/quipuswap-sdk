import BigNumber from "bignumber.js";
import { Contract, Token, OperationOptions } from "../types";
import { fromOpOpts, isFA2Token, toContractAddress } from "../helpers";

export function launchExchange(
  factory: Contract,
  token: Token,
  tokenValue: BigNumber.Value,
  tezValue: BigNumber.Value,
  opts?: OperationOptions
) {
  const tokenAddress = toContractAddress(token.contract);

  return factory.methods
    .launchExchange(
      ...(isFA2Token(token) ? [tokenAddress, token.id] : [tokenAddress]),
      tokenValue
    )
    .toTransferParams(fromOpOpts(tezValue, opts));
}
