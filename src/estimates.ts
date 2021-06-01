import BigNumber from "bignumber.js";
import { assertNat } from "./helpers";
import { FEE_FACTOR } from "./defaults";

export function estimateTezToToken(
  dexStorage: any,
  tezValue: BigNumber.Value
): BigNumber {
  const tezValueBN = new BigNumber(tezValue);
  assertNat(tezValueBN);
  if (tezValueBN.isZero()) return new BigNumber(0);

  const tezInWithFee = new BigNumber(tezValue).times(FEE_FACTOR);
  const numerator = tezInWithFee.times(dexStorage.storage.token_pool);
  const denominator = new BigNumber(dexStorage.storage.tez_pool)
    .times(1000)
    .plus(tezInWithFee);
  return numerator.idiv(denominator);
}

export function estimateTokenToTez(
  dexStorage: any,
  tokenValue: BigNumber.Value
) {
  const tokenValueBN = new BigNumber(tokenValue);
  assertNat(tokenValueBN);
  if (tokenValueBN.isZero()) return new BigNumber(0);

  const tokenInWithFee = new BigNumber(tokenValue).times(FEE_FACTOR);
  const numerator = tokenInWithFee.times(dexStorage.storage.tez_pool);
  const denominator = new BigNumber(dexStorage.storage.token_pool)
    .times(1000)
    .plus(tokenInWithFee);
  return numerator.idiv(denominator);
}

export function estimateTezToTokenInverse(
  dexStorage: any,
  tokenValue: BigNumber.Value
) {
  const tokenValueBN = new BigNumber(tokenValue);
  assertNat(tokenValueBN);
  if (tokenValueBN.isZero()) return new BigNumber(0);

  const numerator = new BigNumber(dexStorage.storage.tez_pool)
    .times(1000)
    .times(tokenValue);
  const denominator = new BigNumber(dexStorage.storage.token_pool)
    .minus(tokenValue)
    .times(FEE_FACTOR);
  return numerator.idiv(denominator).plus(1);
}

export function estimateTokenToTezInverse(
  dexStorage: any,
  tezValue: BigNumber.Value
) {
  const tezValueBN = new BigNumber(tezValue);
  assertNat(tezValueBN);
  if (tezValueBN.isZero()) return new BigNumber(0);

  const numerator = new BigNumber(dexStorage.storage.token_pool)
    .times(1000)
    .times(tezValue);
  const denominator = new BigNumber(dexStorage.storage.tez_pool)
    .minus(tezValue)
    .times(FEE_FACTOR);
  return numerator.idiv(denominator).plus(1);
}

export function estimateSharesInTez(
  dexStorage: any,
  tezValue: BigNumber.Value
) {
  const tezValueBN = new BigNumber(tezValue);
  assertNat(tezValueBN);
  if (tezValueBN.isZero()) return new BigNumber(0);

  return tezValueBN
    .times(dexStorage.storage.total_supply)
    .idiv(dexStorage.storage.tez_pool);
}

export function estimateSharesInToken(
  dexStorage: any,
  tokenValue: BigNumber.Value
) {
  const tokenValueBN = new BigNumber(tokenValue);
  assertNat(tokenValueBN);
  if (tokenValueBN.isZero()) return new BigNumber(0);

  return tokenValueBN
    .times(dexStorage.storage.total_supply)
    .idiv(dexStorage.storage.token_pool);
}

export function estimateTezInShares(dexStorage: any, shares: BigNumber.Value) {
  const sharesBN = new BigNumber(shares);
  assertNat(sharesBN);
  if (sharesBN.isZero()) return new BigNumber(0);

  return sharesBN
    .times(dexStorage.storage.tez_pool)
    .idiv(dexStorage.storage.total_supply);
}

export function estimateTokenInShares(
  dexStorage: any,
  shares: BigNumber.Value
) {
  const sharesBN = new BigNumber(shares);
  assertNat(sharesBN);
  if (sharesBN.isZero()) return new BigNumber(0);

  return sharesBN
    .times(dexStorage.storage.token_pool)
    .idiv(dexStorage.storage.total_supply);
}

export function estimateTokenInTez(dexStorage: any, tezValue: BigNumber.Value) {
  const tezValueBN = new BigNumber(tezValue);
  assertNat(tezValueBN);
  if (tezValueBN.isZero()) return new BigNumber(0);

  return tezValueBN
    .times(dexStorage.storage.token_pool)
    .idiv(dexStorage.storage.tez_pool);
}

export function estimateTezInToken(
  dexStorage: any,
  tokenValue: BigNumber.Value
) {
  const tokenValueBN = new BigNumber(tokenValue);
  assertNat(tokenValueBN);
  if (tokenValueBN.isZero()) return new BigNumber(0);

  return tokenValueBN
    .times(dexStorage.storage.tez_pool)
    .idiv(dexStorage.storage.token_pool);
}

export function isDexContainsLiquidity(dexStorage: any) {
  return !(
    new BigNumber(dexStorage.storage.tez_pool).isZero() ||
    new BigNumber(dexStorage.storage.token_pool).isZero()
  );
}

export function withSlippage(val: BigNumber.Value, tolerance: BigNumber.Value) {
  return new BigNumber(val)
    .times(new BigNumber(1).minus(tolerance))
    .integerValue(BigNumber.ROUND_DOWN);
}
