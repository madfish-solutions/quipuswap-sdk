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
  const newTezPool = tezValueBN.plus(dexStorage.storage.tez_pool);
  const tempTezPool = newTezPool.minus(fee);
  const newTokenPool = new BigNumber(dexStorage.storage.invariant).idiv(
    tempTezPool
  );
  return new BigNumber(dexStorage.storage.token_pool).minus(newTokenPool);
}

export function estimateTezToTokenInverse(
  dexStorage: any,
  tokenValue: BigNumber.Value
) {
  const tokenValueBN = new BigNumber(tokenValue);
  assertNat(tokenValueBN);
  if (tokenValueBN.isZero()) return new BigNumber(0);

  const newTokenPool = new BigNumber(dexStorage.storage.token_pool).minus(
    tokenValueBN
  );
  const tempTezPool = new BigNumber(dexStorage.storage.invariant).idiv(
    newTokenPool
  );
  const fee = tempTezPool
    .minus(dexStorage.storage.tez_pool)
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
  const newTokenPool = new BigNumber(dexStorage.storage.token_pool).plus(
    tokenValueBN
  );
  const tempTokenPool = newTokenPool.minus(fee);
  const newTezPool = new BigNumber(dexStorage.storage.invariant).idiv(
    tempTokenPool
  );
  return new BigNumber(dexStorage.storage.tez_pool).minus(newTezPool);
}

export function estimateTokenToTezInverse(
  dexStorage: any,
  tezValue: BigNumber.Value
) {
  const tezValueBN = new BigNumber(tezValue);
  assertNat(tezValueBN);
  if (tezValueBN.isZero()) return new BigNumber(0);

  const newTezPool = new BigNumber(dexStorage.storage.tez_pool).minus(
    tezValueBN
  );
  const tempTokenPool = new BigNumber(dexStorage.storage.invariant).idiv(
    newTezPool
  );
  const fee = tempTokenPool
    .minus(dexStorage.storage.token_pool)
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
