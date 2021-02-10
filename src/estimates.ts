import BigNumber from "bignumber.js";
import { assertNat } from "./helpers";
import { FEE_RATE } from "./defaults";

export function estimateTezToToken(
  dexStorage: any,
  tezValue: BigNumber.Value
): BigNumber {
  const tezValueBN = new BigNumber(tezValue);
  assertNat(tezValueBN);
  if (tezValueBN.isZero()) return new BigNumber(0);

  const fee = tezValueBN.idiv(FEE_RATE);
  const newTezPool = tezValueBN.plus(dexStorage.tezPool);
  const tempTezPool = newTezPool.minus(fee);
  const newTokenPool = new BigNumber(dexStorage.invariant).idiv(tempTezPool);
  return new BigNumber(dexStorage.tokenPool).minus(newTokenPool);
}

export function estimateTezToTokenInverse(
  dexStorage: any,
  tokenValue: BigNumber.Value
) {
  const tokenValueBN = new BigNumber(tokenValue);
  assertNat(tokenValueBN);
  if (tokenValueBN.isZero()) return new BigNumber(0);

  const newTokenPool = new BigNumber(dexStorage.tokenPool).minus(tokenValueBN);
  const tempTezPool = new BigNumber(dexStorage.invariant).idiv(newTokenPool);
  const fee = tempTezPool
    .minus(dexStorage.tezPool)
    .idiv(new BigNumber(FEE_RATE).minus(1));
  return fee.times(FEE_RATE);
}

export function estimateTokenToTez(
  dexStorage: any,
  tokenValue: BigNumber.Value
) {
  const tokenValueBN = new BigNumber(tokenValue);
  assertNat(tokenValueBN);
  if (tokenValueBN.isZero()) return new BigNumber(0);

  const fee = tokenValueBN.idiv(FEE_RATE);
  const newTokenPool = new BigNumber(dexStorage.tokenPool).plus(tokenValueBN);
  const tempTokenPool = newTokenPool.minus(fee);
  const newTezPool = new BigNumber(dexStorage.invariant).idiv(tempTokenPool);
  return new BigNumber(dexStorage.tezPool).minus(newTezPool);
}

export function estimateTokenToTezInverse(
  dexStorage: any,
  tezValue: BigNumber.Value
) {
  const tezValueBN = new BigNumber(tezValue);
  assertNat(tezValueBN);
  if (tezValueBN.isZero()) return new BigNumber(0);

  const newTezPool = new BigNumber(dexStorage.tezPool).minus(tezValueBN);
  const tempTokenPool = new BigNumber(dexStorage.invariant).idiv(newTezPool);
  const fee = tempTokenPool
    .minus(dexStorage.tokenPool)
    .idiv(new BigNumber(FEE_RATE).minus(1));
  return fee.times(FEE_RATE);
}

export function estimateSharesInTez(
  dexStorage: any,
  tezValue: BigNumber.Value
) {
  const tezValueBN = new BigNumber(tezValue);
  assertNat(tezValueBN);
  if (tezValueBN.isZero()) return new BigNumber(0);

  return tezValueBN.times(dexStorage.totalSupply).idiv(dexStorage.tezPool);
}

export function estimateSharesInToken(
  dexStorage: any,
  tokenValue: BigNumber.Value
) {
  const tokenValueBN = new BigNumber(tokenValue);
  assertNat(tokenValueBN);
  if (tokenValueBN.isZero()) return new BigNumber(0);

  return tokenValueBN.times(dexStorage.totalSupply).idiv(dexStorage.tokenPool);
}

export function estimateTezInShares(dexStorage: any, shares: BigNumber.Value) {
  const sharesBN = new BigNumber(shares);
  assertNat(sharesBN);
  if (sharesBN.isZero()) return new BigNumber(0);

  return sharesBN.times(dexStorage.tezPool).idiv(dexStorage.totalSupply);
}

export function estimateTokenInShares(
  dexStorage: any,
  shares: BigNumber.Value
) {
  const sharesBN = new BigNumber(shares);
  assertNat(sharesBN);
  if (sharesBN.isZero()) return new BigNumber(0);

  return sharesBN.times(dexStorage.tokenPool).idiv(dexStorage.totalSupply);
}
