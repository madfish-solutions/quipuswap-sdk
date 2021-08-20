import BigNumber from "bignumber.js";
import { TezosToolkit } from "@taquito/taquito";
import {
  Asset,
  Token,
  Factories,
  StrictFactories,
  TransferParams,
  ContractOrAddress,
} from "./types";
import {
  isFA2Token,
  isTezAsset,
  isTokenAsset,
  toContract,
  toContractAddress,
  estimateTransfers,
  FoundDex,
} from "./helpers";
import { Factory, Dex, FA1_2, FA2 } from "./contracts";
import {
  isDexContainsLiquidity,
  estimateTokenInTez,
  estimateTezInToken,
  estimateTezInShares,
  estimateTezToToken,
  estimateTokenInShares,
  estimateTokenToTez,
  estimateTezToTokenInverse,
  estimateTokenToTezInverse,
  withSlippage,
} from "./estimates";
import { ACCURANCY_MULTIPLIER, VOTING_PERIOD } from "./defaults";

export async function swap(
  tezos: TezosToolkit,
  factories: Factories,
  fromAsset: Asset,
  toAsset: Asset,
  value: BigNumber.Value,
  slippageTolerance: BigNumber.Value = 0,
  toAccount?: string
) {
  const fromAccount = await tezos.signer.publicKeyHash();
  if (!toAccount) toAccount = fromAccount;

  if (isTezAsset(fromAsset) && isTokenAsset(toAsset)) {
    const dex = await findDex(tezos, factories, toAsset);
    const valueToMin = withSlippage(
      estimateTezToToken(dex.storage, value),
      slippageTolerance
    );

    return [Dex.tezToTokenPayment(dex.contract, value, valueToMin, toAccount)];
  } else if (isTokenAsset(fromAsset) && isTezAsset(toAsset)) {
    const dex = await findDex(tezos, factories, fromAsset);
    const valueToMin = withSlippage(
      estimateTokenToTez(dex.storage, value),
      slippageTolerance
    );

    return withTokenApprove(
      tezos,
      fromAsset,
      fromAccount,
      dex.contract.address,
      value,
      [Dex.tokenToTezPayment(dex.contract, value, valueToMin, toAccount)]
    );
  } else if (isTokenAsset(fromAsset) && isTokenAsset(toAsset)) {
    const halfSlippageTolerance = new BigNumber(1).minus(
      new BigNumber(1).minus(slippageTolerance).sqrt()
    );

    const [inputDex, outputDex] = await Promise.all([
      findDex(tezos, factories, fromAsset),
      findDex(tezos, factories, toAsset),
    ]);

    const intermediateValueToMin = withSlippage(
      estimateTokenToTez(inputDex.storage, value),
      halfSlippageTolerance
    );
    const finalValueToMin = withSlippage(
      estimateTezToToken(outputDex.storage, intermediateValueToMin),
      halfSlippageTolerance
    );

    return withTokenApprove(
      tezos,
      fromAsset,
      fromAccount,
      inputDex.contract.address,
      value,
      [
        Dex.tokenToTezPayment(
          inputDex.contract,
          value,
          intermediateValueToMin,
          fromAccount
        ),
        Dex.tezToTokenPayment(
          outputDex.contract,
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

export async function estimateSwap(
  tezos: TezosToolkit,
  factories: Factories,
  fromAsset: Asset,
  toAsset: Asset,
  values: { inputValue: BigNumber.Value } | { outputValue: BigNumber.Value },
  dexes?: { inputDex?: FoundDex; outputDex?: FoundDex }
) {
  if (isTezAsset(fromAsset) && isTokenAsset(toAsset)) {
    const dex = dexes?.inputDex ?? (await findDex(tezos, factories, toAsset));

    return "outputValue" in values
      ? estimateTezToTokenInverse(dex.storage, values.outputValue)
      : estimateTezToToken(dex.storage, values.inputValue);
  } else if (isTokenAsset(fromAsset) && isTezAsset(toAsset)) {
    const dex =
      dexes?.outputDex ?? (await findDex(tezos, factories, fromAsset));

    return "outputValue" in values
      ? estimateTokenToTezInverse(dex.storage, values.outputValue)
      : estimateTokenToTez(dex.storage, values.inputValue);
  } else if (isTokenAsset(fromAsset) && isTokenAsset(toAsset)) {
    const [inputDex, outputDex] = await Promise.all([
      dexes?.inputDex ?? findDex(tezos, factories, fromAsset),
      dexes?.outputDex ?? findDex(tezos, factories, toAsset),
    ]);

    if ("outputValue" in values) {
      const intermediateTezValue = estimateTezToTokenInverse(
        outputDex.storage,
        values.outputValue
      );
      return estimateTokenToTezInverse(inputDex.storage, intermediateTezValue);
    } else {
      const intermediateTezValue = estimateTokenToTez(
        inputDex.storage,
        values.inputValue
      );
      return estimateTezToToken(outputDex.storage, intermediateTezValue);
    }
  } else {
    throw new Error("Unsupported exchange way");
  }
}

export async function initializeLiquidity(
  tezos: TezosToolkit,
  factories: StrictFactories,
  token: Token,
  tokenValue: BigNumber.Value,
  tezValue: BigNumber.Value
) {
  const dex = await findDexNonStrict(tezos, factories, token);
  if (dex && isDexContainsLiquidity(dex.storage)) {
    throw new DexAlreadyContainsLiquidity();
  }

  const fromAccount = await tezos.signer.publicKeyHash();

  if (dex) {
    return withTokenApprove(
      tezos,
      token,
      fromAccount,
      dex.contract.address,
      tokenValue,
      [Dex.initializeExchange(dex.contract, tokenValue, tezValue)]
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
  dex: FoundDex | ContractOrAddress,
  values:
    | { tokenValue: BigNumber.Value; tezValue: BigNumber.Value }
    | { tokenValue: BigNumber.Value }
    | { tezValue: BigNumber.Value }
) {
  dex = await toFoundDex(tezos, dex);
  if (!isDexContainsLiquidity(dex.storage)) {
    throw new DexNotContainsLiquidity();
  }

  const token = getDexToken(dex.storage);

  let tokenValue: BigNumber.Value;
  let tezValue: BigNumber.Value;
  if ("tokenValue" in values && "tezValue" in values) {
    tokenValue = values.tokenValue;
    tezValue = values.tezValue;
  } else if ("tokenValue" in values) {
    tokenValue = values.tokenValue;
    tezValue = estimateTezInToken(dex.storage, tokenValue);
  } else {
    tezValue = values.tezValue;
    tokenValue = estimateTokenInTez(dex.storage, tezValue);
  }

  const fromAccount = await tezos.signer.publicKeyHash();

  return withTokenApprove(
    tezos,
    token,
    fromAccount,
    dex.contract.address,
    tokenValue,
    [
      Dex.investLiquidity(dex.contract, tokenValue, tezValue),
      Dex.withdrawProfit(dex.contract, fromAccount),
    ]
  );
}

export async function removeLiquidity(
  tezos: TezosToolkit,
  dex: FoundDex | ContractOrAddress,
  lpTokenValue: BigNumber.Value,
  slippageTolerance: BigNumber.Value
) {
  dex = await toFoundDex(tezos, dex);

  const lpToken = toLPToken(dex.contract, dex.storage);

  const tokenValueMin = withSlippage(
    estimateTokenInShares(dex.storage, lpTokenValue),
    slippageTolerance
  );
  const tezValueMin = withSlippage(
    estimateTezInShares(dex.storage, lpTokenValue),
    slippageTolerance
  );

  const fromAccount = await tezos.signer.publicKeyHash();

  return withTokenApprove(
    tezos,
    lpToken,
    fromAccount,
    dex.contract.address,
    lpTokenValue,
    [
      Dex.divestLiquidity(
        dex.contract,
        lpTokenValue,
        tokenValueMin,
        tezValueMin
      ),
    ]
  );
}

export async function getLiquidityShare(
  tezos: TezosToolkit,
  dex: FoundDex | ContractOrAddress,
  account: string
) {
  dex = await toFoundDex(tezos, dex);

  const val = await dex.storage.storage.ledger.get(account);
  if (!val) {
    return {
      unfrozen: new BigNumber(0),
      frozen: new BigNumber(0),
      total: new BigNumber(0),
    };
  }

  const unfrozen = new BigNumber(val.balance);
  const frozen = new BigNumber(val.frozen_balance);
  return {
    unfrozen,
    frozen,
    total: unfrozen.plus(frozen),
  };
}

export async function estimateReward(
  tezos: TezosToolkit,
  dex: FoundDex | ContractOrAddress,
  account: string
) {
  dex = await toFoundDex(tezos, dex);

  const { storage } = dex.storage;
  const [rewards, shares] = await Promise.all([
    storage.user_rewards.get(account),
    storage.ledger.get(account),
  ]);

  let reward = new BigNumber(rewards?.reward ?? 0);
  if (shares) {
    const now = new Date();
    const periodFinish = new Date(storage.period_finish);
    const lastUpdateTime = new Date(storage.last_update_time);
    const rewardsTime = now > periodFinish ? periodFinish : now;
    let newReward = new BigNumber(Math.abs(+rewardsTime - +lastUpdateTime))
      .idiv(1000)
      .times(storage.reward_per_sec);

    if (now > periodFinish) {
      const periodsDuration = new BigNumber(+now - +periodFinish)
        .idiv(1000)
        .idiv(VOTING_PERIOD)
        .plus(1)
        .times(VOTING_PERIOD);
      const rewardPerSec = new BigNumber(storage.reward)
        .times(ACCURANCY_MULTIPLIER)
        .idiv(periodsDuration.abs());
      newReward = new BigNumber(+now - +periodFinish)
        .idiv(1000)
        .abs()
        .times(rewardPerSec);
    }

    const rewardPerShare = new BigNumber(storage.reward_per_share).plus(
      newReward.idiv(storage.total_supply)
    );
    const totalShares = new BigNumber(shares.balance).plus(
      shares.frozen_balance
    );
    reward = reward.plus(
      totalShares
        .times(rewardPerShare)
        .minus(rewards?.reward_paid ?? 0)
        .abs()
    );
  }

  return reward.idiv(ACCURANCY_MULTIPLIER);
}

export async function withdrawReward(
  tezos: TezosToolkit,
  dex: FoundDex | ContractOrAddress,
  receiver: string
) {
  const dexContract = await toContract(tezos, dex);
  return [Dex.withdrawProfit(dexContract, receiver)];
}

export async function voteForBaker(
  tezos: TezosToolkit,
  dex: FoundDex | ContractOrAddress,
  bakerAddress: string,
  lpTokenValue: BigNumber.Value
) {
  dex = await toFoundDex(tezos, dex);

  const lpToken = toLPToken(dex.contract, dex.storage);

  const fromAccount = await tezos.signer.publicKeyHash();
  const voter = fromAccount;

  return withTokenApprove(
    tezos,
    lpToken,
    fromAccount,
    dex.contract.address,
    lpTokenValue,
    [Dex.vote(dex.contract, voter, bakerAddress, lpTokenValue)]
  );
}

export async function vetoCurrentBaker(
  tezos: TezosToolkit,
  dex: FoundDex | ContractOrAddress,
  lpTokenValue: BigNumber.Value
) {
  dex = await toFoundDex(tezos, dex);

  const lpToken = toLPToken(dex.contract, dex.storage);

  const fromAccount = await tezos.signer.publicKeyHash();
  const voter = fromAccount;

  return withTokenApprove(
    tezos,
    lpToken,
    fromAccount,
    dex.contract.address,
    lpTokenValue,
    [Dex.veto(dex.contract, voter, lpTokenValue)]
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
  return isDexContainsLiquidity(dex.storage);
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
): Promise<FoundDex> {
  let factories = isFA2Token(token) ? fa2Factory : fa1_2Factory;
  if (!Array.isArray(factories)) {
    factories = [factories];
  }

  const tokenAddress = toContractAddress(token.contract);
  const t2dexQuery = isFA2Token(token)
    ? [tokenAddress, token.id]
    : tokenAddress;

  const dexes: FoundDex[] = [];
  await Promise.all(
    factories.map(async (factory) => {
      const facContract = await toContract(tezos, factory);
      const facStorage = await facContract.storage<any>();
      const dexAddress = await facStorage.token_to_exchange.get(t2dexQuery);

      if (dexAddress) {
        const dexContract = await toContract(tezos, dexAddress);
        const dexStorage = await dexContract.storage<any>();
        dexes.push(new FoundDex(dexContract, dexStorage));
      }
    })
  );

  if (dexes.length > 1) {
    return dexes.sort(chooseDex)[0];
  } else if (dexes.length === 1) {
    return dexes[0];
  } else {
    throw new DexNotFoundError();
  }
}

export async function toFoundDex(
  tezos: TezosToolkit,
  dex: FoundDex | ContractOrAddress
): Promise<FoundDex> {
  if (dex instanceof FoundDex) {
    return dex;
  }

  const contract = await toContract(tezos, dex);
  const storage = await contract.storage();
  return new FoundDex(contract, storage);
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
    if (FA1_2.isUnsafeAllowanceChangeError(err)) {
      resetApprove = true;
    }
  }

  return resetApprove
    ? [FA1_2.approve(tokenContract, to, 0), approveParams, ...transfers]
    : [approveParams, ...transfers];
}

export function chooseDex(a: FoundDex, b: FoundDex): number {
  return new BigNumber(b.storage.storage.tez_pool)
    .minus(a.storage.storage.tez_pool)
    .toNumber();
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
  name = "DexNotContainsLiquidity";
  message = "Dex doesn't contains liquidity. Use 'initializeLiquidity'";
}
