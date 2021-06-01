import BigNumber from "bignumber.js";
import { Contract, OperationOptions } from "../types";
import { fromOpOpts } from "../helpers";

export enum Errors {
  NotEnoughBalance = "NotEnoughBalance",
  NotEnoughAllowance = "NotEnoughAllowance",
  UnsafeAllowanceChange = "UnsafeAllowanceChange",
}

export function transfer(
  fa1_2: Contract,
  from: string,
  to: string,
  value: BigNumber.Value,
  opts?: OperationOptions
) {
  return fa1_2.methods
    .transfer(from, to, value)
    .toTransferParams(fromOpOpts(undefined, opts));
}

export function approve(
  fa1_2: Contract,
  spender: string,
  value: BigNumber.Value,
  opts?: OperationOptions
) {
  return fa1_2.methods
    .approve(spender, value)
    .toTransferParams(fromOpOpts(undefined, opts));
}

export function isUnsafeAllowanceChangeError(err: any): boolean {
  try {
    return (
      isUACErrorMessage(err?.message) ||
      err?.errors?.some(
        (e: any) =>
          e?.with?.int === "23" ||
          isUACErrorMessage(e?.with?.string) ||
          isUACErrorMessage(e?.with?.args?.[0]?.string)
      )
    );
  } catch {
    return false;
  }
}

function isUACErrorMessage(errMessage: any) {
  return Boolean(errMessage?.includes(Errors.UnsafeAllowanceChange));
}
