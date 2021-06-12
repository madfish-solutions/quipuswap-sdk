import BigNumber from "bignumber.js";
import {
  ContractAbstraction,
  ContractProvider,
  TezosToolkit,
  Wallet,
  WalletOperationBatch,
} from "@taquito/taquito";
import { OperationBatch } from "@taquito/taquito/dist/types/batch/rpc-batch-provider";

export { TransferParams } from "@taquito/taquito/dist/types/operations/types";

export type Contract = ContractAbstraction<ContractProvider | Wallet>;

export type ContractOrAddress = Contract | string;

export type OperationOptions = Partial<{
  source: string;
  fee: BigNumber.Value;
  storageLimit: BigNumber.Value;
  gasLimit: BigNumber.Value;
}>;

export type Batch = OperationBatch | WalletOperationBatch;

export interface Token {
  contract: ContractOrAddress;
  id?: BigNumber.Value;
}

export interface FA2Token extends Token {
  id: BigNumber.Value;
}

export type Asset = Token | "tez";

export interface Factories {
  fa1_2Factory: ContractOrAddress | ContractOrAddress[];
  fa2Factory: ContractOrAddress | ContractOrAddress[];
}

export interface StrictFactories extends Factories {
  fa1_2Factory: ContractOrAddress;
  fa2Factory: ContractOrAddress;
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

export type ContractResolver = (
  tezos: TezosToolkit,
  address: string
) => Promise<Contract>;
