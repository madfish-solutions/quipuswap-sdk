import BigNumber from "bignumber.js";
import {
  ContractAbstraction,
  ContractProvider,
  Wallet,
  WalletOperationBatch,
} from "@taquito/taquito";
import { OperationBatch } from "@taquito/taquito/dist/types/batch/rpc-batch-provider";

export { TransferParams } from "@taquito/taquito/dist/types/operations/types";

export type Contract = ContractAbstraction<ContractProvider | Wallet>;

export type OperationOptions = Partial<{
  source: string;
  fee: BigNumber.Value;
  storageLimit: BigNumber.Value;
  gasLimit: BigNumber.Value;
}>;

export type Batch = OperationBatch | WalletOperationBatch;

export interface Token {
  contract: Contract;
  id?: BigNumber.Value;
}

export interface FA2Token extends Token {
  id: BigNumber.Value;
}

export type Asset = Token | "xtz";

export interface Factories {
  fa1_2Factory: Contract;
  fa2Factory: Contract;
}

export interface FA2TransferParams {
  tokenId: BigNumber.Value;
  from: string;
  to: string;
  value: BigNumber.Value;
}

export interface FA2UpdateOperatorsParams {
  type: "add_operator" | "remove_operator";
  tokenId: BigNumber.Value;
  from: string;
  to: string;
}
