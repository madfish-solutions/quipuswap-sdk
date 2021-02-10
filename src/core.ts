import BigNumber from "bignumber.js";
import { TezosToolkit } from "@taquito/taquito";
import { Asset, Token, Factories, TransferParams } from "./types";
import {
  isFA2Token,
  isXTZAsset,
  isTokenAsset,
  estimateTransfers,
} from "./helpers";
import { Dex, FA1_2, FA2 } from "./contracts";

export async function swap(
  tezos: TezosToolkit,
  factories: Factories,
  fromAccount: string,
  fromAsset: Asset,
  toAsset: Asset,
  valueFrom: BigNumber.Value,
  valueToMin: BigNumber.Value,
  receiver: string
) {
  if (isXTZAsset(fromAsset) && isTokenAsset(toAsset)) {
    const dex = await findDex(tezos, factories, toAsset);

    return [Dex.tezToTokenPayment(dex, valueFrom, valueToMin, receiver)];
  } else if (isTokenAsset(fromAsset) && isXTZAsset(toAsset)) {
    const dex = await findDex(tezos, factories, fromAsset);

    return withTokenApprove(
      tezos,
      fromAsset,
      fromAccount,
      dex.address,
      valueFrom,
      [Dex.tokenToTezPayment(dex, valueFrom, valueToMin, receiver)]
    );
  } else if (isTokenAsset(fromAsset) && isTokenAsset(toAsset)) {
    const [inputDex, outputDex] = await Promise.all([
      findDex(tezos, factories, fromAsset),
      findDex(tezos, factories, toAsset),
    ]);

    return withTokenApprove(
      tezos,
      fromAsset,
      fromAccount,
      inputDex.address,
      valueFrom,
      [
        Dex.tokenToTezPayment(inputDex, valueFrom, valueToMin, receiver),
        Dex.tezToTokenPayment(outputDex, valueFrom, valueToMin, receiver),
      ]
    );
  } else {
    throw new Error("Unsupported exchange way");
  }
}

export async function findDex(
  tezos: TezosToolkit,
  { fa1_2Factory, fa2Factory }: Factories,
  token: Token
) {
  const facStorage = await (isFA2Token(token)
    ? fa2Factory
    : fa1_2Factory
  ).storage<any>();
  const dexAddress = await facStorage.token_to_exchange.get(
    isFA2Token(token)
      ? [token.contract.address, token.id]
      : token.contract.address
  );

  if (!dexAddress) {
    throw new Error("Dex contract not found");
  }

  return tezos.contract.at(dexAddress);
}

export async function withTokenApprove(
  tezos: TezosToolkit,
  token: Token,
  from: string,
  to: string,
  value: BigNumber.Value,
  transfers: TransferParams[]
) {
  if (isFA2Token(token)) {
    return [
      FA2.updateOperators(token.contract, [
        {
          type: "add_operator",
          from,
          to,
          tokenId: token.id,
        },
      ]),
      ...transfers,
      FA2.updateOperators(token.contract, [
        {
          type: "remove_operator",
          from,
          to,
          tokenId: token.id,
        },
      ]),
    ];
  }

  const approveParams = FA1_2.approve(token.contract, to, value);

  let resetApprove = false;
  try {
    await estimateTransfers(tezos, [approveParams]);
  } catch (err) {
    if (err?.message === FA1_2.Errors.UnsafeAllowanceChange) {
      resetApprove = true;
    }
  }

  return resetApprove
    ? [FA1_2.approve(token.contract, to, 0), approveParams, ...transfers]
    : [approveParams, ...transfers];
}
