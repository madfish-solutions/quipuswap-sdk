import BigNumber from "bignumber.js";
import { TezosToolkit } from "@taquito/taquito";
import {
  Asset,
  Token,
  Factories,
  TransferParams,
  Contract,
  ContractOrAddress,
} from "./types";
import {
  isFA2Token,
  isXTZAsset,
  isTokenAsset,
  toContract,
  toContractAddress,
  estimateTransfers,
} from "./helpers";
import { Factory, Dex, FA1_2, FA2 } from "./contracts";
import {
  estimateTokenInTez,
  estimateTezInToken,
  estimateTezInShares,
  estimateTezToToken,
  estimateTokenInShares,
  estimateTokenToTez,
} from "./estimates";

export async function swap(
  tezos: TezosToolkit,
  factories: Factories,
  toAccount: string,
  fromAsset: Asset,
  toAsset: Asset,
  value: BigNumber.Value,
  slippageTolerance: BigNumber.Value
) {
  const fromAccount = await tezos.signer.publicKeyHash();

  if (isXTZAsset(fromAsset) && isTokenAsset(toAsset)) {
    const dex = await findDex(tezos, factories, toAsset);
    const dexStorage = await dex.storage();
    const valueToMin = withSlippage(
      estimateTezToToken(dexStorage, value),
      slippageTolerance
    );

    return [Dex.tezToTokenPayment(dex, value, valueToMin, toAccount)];
  } else if (isTokenAsset(fromAsset) && isXTZAsset(toAsset)) {
    const dex = await findDex(tezos, factories, fromAsset);
    const dexStorage = await dex.storage();
    const valueToMin = withSlippage(
      estimateTokenToTez(dexStorage, value),
      slippageTolerance
    );

    return withTokenApprove(tezos, fromAsset, fromAccount, dex.address, value, [
      Dex.tokenToTezPayment(dex, value, valueToMin, toAccount),
    ]);
  } else if (isTokenAsset(fromAsset) && isTokenAsset(toAsset)) {
    const halfSlippageTolerance = new BigNumber(slippageTolerance).div(2);

    const [inputDex, outputDex] = await Promise.all([
      findDex(tezos, factories, fromAsset),
      findDex(tezos, factories, toAsset),
    ]);

    const [inputDexStorage, outputDexStorage] = await Promise.all([
      inputDex.storage(),
      outputDex.storage(),
    ]);

    const intermediateValueToMin = withSlippage(
      estimateTokenToTez(inputDexStorage, value),
      halfSlippageTolerance
    );
    const finalValueToMin = withSlippage(
      estimateTokenToTez(outputDexStorage, intermediateValueToMin),
      halfSlippageTolerance
    );

    return withTokenApprove(
      tezos,
      fromAsset,
      fromAccount,
      inputDex.address,
      value,
      [
        Dex.tokenToTezPayment(
          inputDex,
          value,
          intermediateValueToMin,
          toAccount
        ),
        Dex.tezToTokenPayment(
          outputDex,
          intermediateValueToMin,
          finalValueToMin,
          toAccount
        ),
      ]
    );
  } else {
    throw new Error("Unsupported exchange way");
  }
}

export async function initializeLiquidity(
  tezos: TezosToolkit,
  factories: Factories,
  token: Token,
  tokenValue: BigNumber.Value,
  tezValue: BigNumber.Value
) {
  const dex = await findDexNonStrict(tezos, factories, token);
  if (dex && (await isDexContainsLiquidity(dex))) {
    throw new DexAlreadyContainsLiquidity();
  }

  const fromAccount = await tezos.signer.publicKeyHash();

  if (dex) {
    return withTokenApprove(
      tezos,
      token,
      fromAccount,
      dex.address,
      tokenValue,
      [Dex.initializeExchange(dex, tokenValue, tezValue)]
    );
  } else {
    const factory = await toContract(
      tezos,
      isFA2Token(token) ? factories.fa2Factory : factories.fa1_2Factory
    );

    return withTokenApprove(
      tezos,
      token,
      fromAccount,
      factory.address,
      tokenValue,
      [Factory.launchExchange(factory, token, tokenValue, tezValue)]
    );
  }
}

export async function addLiquidity(
  tezos: TezosToolkit,
  dex: ContractOrAddress,
  values:
    | { tokenValue: BigNumber.Value; tezValue: BigNumber.Value }
    | { tokenValue: BigNumber.Value }
    | { tezValue: BigNumber.Value }
) {
  const dexContract = await toContract(tezos, dex);
  if (!(await isDexContainsLiquidity(dexContract))) {
    throw new DexNotContainsLiquidity();
  }

  const dexStorage = await dexContract.storage();
  const token = getDexToken(dexStorage);

  let tokenValue: BigNumber.Value;
  let tezValue: BigNumber.Value;
  if ("tokenValue" in values && "tezValue" in values) {
    tokenValue = values.tokenValue;
    tezValue = values.tezValue;
  } else if ("tokenValue" in values) {
    tokenValue = values.tokenValue;
    tezValue = estimateTezInToken(dexStorage, tokenValue);
  } else {
    tezValue = values.tezValue;
    tokenValue = estimateTokenInTez(dexStorage, tezValue);
  }

  const fromAccount = await tezos.signer.publicKeyHash();

  return withTokenApprove(
    tezos,
    token,
    fromAccount,
    dexContract.address,
    tokenValue,
    [Dex.investLiquidity(dexContract, tokenValue, tezValue)]
  );
}

export async function removeLiquidity(
  tezos: TezosToolkit,
  dex: ContractOrAddress,
  lpTokenValue: BigNumber.Value,
  slippageTolerance: BigNumber.Value
) {
  const dexContract = await toContract(tezos, dex);
  const dexStorage = await dexContract.storage();

  const lpToken = toLPToken(dexContract, dexStorage);
  const tokenValueMin = withSlippage(
    estimateTokenInShares(dexStorage, lpTokenValue),
    slippageTolerance
  );
  const tezValueMin = withSlippage(
    estimateTezInShares(dexStorage, lpTokenValue),
    slippageTolerance
  );

  const fromAccount = await tezos.signer.publicKeyHash();

  return withTokenApprove(
    tezos,
    lpToken,
    fromAccount,
    dexContract.address,
    lpTokenValue,
    [Dex.divestLiquidity(dexContract, lpTokenValue, tokenValueMin, tezValueMin)]
  );
}

export function toLPToken(dex: ContractOrAddress, dexStorage: any): Token {
  return {
    contract: dex,
    id: "token_id" in dexStorage.storage ? 0 : undefined,
  };
}

export function getDexToken(dexStorage: any): Token {
  return {
    contract: dexStorage.storage.token_address,
    id: dexStorage.storage.token_id,
  };
}

export async function isDexExistAndContainsLiquidity(
  tezos: TezosToolkit,
  factories: Factories,
  token: Token
) {
  const dex = await findDexNonStrict(tezos, factories, token);
  if (!dex) return false;
  return isDexContainsLiquidity(dex);
}

export async function isDexContainsLiquidity(dex: Contract) {
  const dexStorage = await dex.storage<any>();
  return !new BigNumber(dexStorage.storage.invariant).isZero();
}

export async function findDexNonStrict(
  tezos: TezosToolkit,
  factories: Factories,
  token: Token
) {
  try {
    return await findDex(tezos, factories, token);
  } catch (err) {
    if (err instanceof DexNotFoundError) {
      return null;
    }
    throw err;
  }
}

export async function findDex(
  tezos: TezosToolkit,
  { fa1_2Factory, fa2Factory }: Factories,
  token: Token
): Promise<Contract> {
  const factory = await toContract(
    tezos,
    isFA2Token(token) ? fa2Factory : fa1_2Factory
  );
  const facStorage = await factory.storage<any>();

  const tokenAddress = toContractAddress(token.contract);
  const dexAddress = await facStorage.token_to_exchange.get(
    isFA2Token(token) ? [tokenAddress, token.id] : tokenAddress
  );

  if (!dexAddress) {
    throw new DexNotFoundError();
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
  const tokenContract = await toContract(tezos, token.contract);

  if (isFA2Token(token)) {
    return [
      FA2.updateOperators(tokenContract, [
        {
          type: "add_operator",
          from,
          to,
          tokenId: token.id,
        },
      ]),
      ...transfers,
      FA2.updateOperators(tokenContract, [
        {
          type: "remove_operator",
          from,
          to,
          tokenId: token.id,
        },
      ]),
    ];
  }

  const approveParams = FA1_2.approve(tokenContract, to, value);

  let resetApprove = false;
  try {
    await estimateTransfers(tezos, [approveParams]);
  } catch (err) {
    if (err?.message === FA1_2.Errors.UnsafeAllowanceChange) {
      resetApprove = true;
    }
  }

  return resetApprove
    ? [FA1_2.approve(tokenContract, to, 0), approveParams, ...transfers]
    : [approveParams, ...transfers];
}

export function withSlippage(val: BigNumber.Value, tolerance: BigNumber.Value) {
  return new BigNumber(val)
    .times(new BigNumber(1).minus(tolerance))
    .integerValue(BigNumber.ROUND_DOWN);
}

/**
 * Errors
 */

export class DexNotFoundError implements Error {
  name = "DexNotFoundError";
  message = "Dex contract for token not found";
}

export class DexAlreadyContainsLiquidity implements Error {
  name = "DexAlreadyContainsLiquidity";
  message = "Dex already contains liquidity. Use 'addLiquidity'";
}

export class DexNotContainsLiquidity implements Error {
  name = "DexAlreadyContainsLiquidity";
  message = "Dex doesn't contains liquidity. Use 'initializeLiquidity'";
}
