import BigNumber from "bignumber.js";
import { Contract, Token, OperationOptions } from "../types";
import { fromOpOpts, isFA2Token } from "../helpers";

export function launchExchange(
  factory: Contract,
  token: Token,
  tokenValue: BigNumber.Value,
  tezValue: BigNumber.Value,
  opts?: OperationOptions
) {
  return factory.methods
    .launchExchange(
      ...(isFA2Token(token)
        ? [token.contract.address, token.id]
        : [token.contract.address]),
      tokenValue
    )
    .toTransferParams(fromOpOpts(tezValue, opts));
}
