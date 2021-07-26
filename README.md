# Quipuswap SDK

## Install

```bash
yarn add @taquito/taquito @quipuswap/sdk
```

## Usage

### Tips

- This module works only with natural numbers. There are no decimals or metadata stuff.
- `Asset` type. If `id` property exists in token structure, the module assumes that this is an FA2 token.

```typescript
// Contract = taquito contract
type ContractOrAddress = Contract | string;

interface Token {
  contract: ContractOrAddress;
  id?: BigNumber.Value;
}

interface FA2Token extends Token {
  id: BigNumber.Value;
}

type Asset = Token | "tez";
```

### Configure

```typescript
import { TezosToolkit, MichelCodecPacker } from "@taquito/taquito";
import { ReadOnlySigner } from "@quipuswap/sdk";

const publicKeyHash = "tz1fVQangAfb9J1hRRMP2bSB6LvASD6KpY8A";
const publicKey = "edpkvWbk81uh1DEvdWKR4g1bjyTGhdu1mDvznPUFE2zDwNsLXrEb9K";

const tezos = new TezosToolkit("https://florencenet.smartpy.io");
tezos.setPackerProvider(new MichelCodecPacker());
tezos.setSignerProvider(new ReadOnlySigner(publicKeyHash, publicKey));

// Or if you using `privateKey`
import { InMemorySigner } from "@taquito/signer";

InMemorySigner.fromSecretKey(privateKey).then(signer=>tezos.setSignerProvider(signer));

```

### Swap

```typescript
import { swap, batchify } from "@quipuswap/sdk";

const tezos = new TezosToolkit(); // Full sample in "Configure" section

const factories = {
  fa1_2Factory: "KT1WkKiDSsDttdWrfZgcQ6Z9e3Cp4unHP2CP",
  fa2Factory: "KT1Bps1VtszT2T3Yvxm5PJ6Rx2nk1FykWPdU",
};

(async () => {
  try {
    const fromAsset = "tez";
    const toAsset = {
      contract: "KT1RX7AdYr9hFZPQTZw5Fu8KkMwVtobHpTp6",
      id: 0
    };
    const inputValue = 10_000_000; // in mutez (without decimals)
    const slippageTolerance = 0.005; // 0.5%

    const swapParams = await swap(
      tezos,
      factories,
      fromAsset,
      toAsset,
      inputValue,
      slippageTolerance
    );

    const op = await batchify(
      tezos.wallet.batch([]),
      swapParams
    ).send();

    console.info(op.hash);
    await op.confirmation();
    console.info("Complete");
  } catch (err) {
    console.error(err);
  }
})();
```

### Estimate swap

```typescript
import { estimateSwap } from "@quipuswap/sdk";

const tezos = new TezosToolkit(); // Full sample in "Configure" section

const factories = {
  fa1_2Factory: "KT1WkKiDSsDttdWrfZgcQ6Z9e3Cp4unHP2CP",
  fa2Factory: "KT1Bps1VtszT2T3Yvxm5PJ6Rx2nk1FykWPdU",
};

(async () => {
  try {
    const fromAsset = "tez";
    const toAsset = {
      contract: "KT1RX7AdYr9hFZPQTZw5Fu8KkMwVtobHpTp6",
      id: 0
    };
    const inputValue = 10_000_000; // in mutez (without decimals)

    const estimatedOutputValue = await estimateSwap(
      tezos,
      factories,
      fromAsset,
      toAsset,
      { inputValue }
    );

    console.info({ estimatedOutputValue });

    const estimatedInputValue = await estimateSwap(
      tezos,
      factories,
      fromAsset,
      toAsset,
      { outputValue: estimatedOutputValue }
    );

    console.info({ estimatedInputValue });
  } catch (err) {
    console.error(err);
  }
})();
```

### Add liquidity

```typescript
import { findDex, addLiquidity } from "@quipuswap/sdk";

const tezos = new TezosToolkit(); // Full sample in "Configure" section

const factories = {
  fa1_2Factory: "KT1WkKiDSsDttdWrfZgcQ6Z9e3Cp4unHP2CP",
  fa2Factory: "KT1Bps1VtszT2T3Yvxm5PJ6Rx2nk1FykWPdU",
};
const token = {
  contract: "KT1RX7AdYr9hFZPQTZw5Fu8KkMwVtobHpTp6",
  id: 0,
};

(async () => {
  try {
    const dex = await findDex(tezos, factories, token);

    const addLiquidityParams = await addLiquidity(
      tezos,
      dex,
      { tezValue: 10_000_000 }
      // or { tokenValue: 4_000 }
      // or { tezValue: 10_000_000, tokenValue: 4_000 }
      //
      // @TIP:
      // If one of the properties is omitted,
      // it will estimate another automatically
    );

    const op = await batchify(
      tezos.wallet.batch([]),
      addLiquidityParams
    ).send();

    console.info(op.hash);
    await op.confirmation();
    console.info("Complete");
  } catch (err) {
    console.error(err);
  }
})();
```

### Remove liquidity

```typescript
import { findDex, removeLiquidity } from "@quipuswap/sdk";

const tezos = new TezosToolkit(); // Full sample in "Configure" section

const factories = {
  fa1_2Factory: "KT1WkKiDSsDttdWrfZgcQ6Z9e3Cp4unHP2CP",
  fa2Factory: "KT1Bps1VtszT2T3Yvxm5PJ6Rx2nk1FykWPdU",
};
const token = {
  contract: "KT1RX7AdYr9hFZPQTZw5Fu8KkMwVtobHpTp6",
  id: 0,
};

(async () => {
  try {
    const account = "tz1Lx...";
    const slippageTolerance = 0.005; // 0.5%

    const dex = await findDex(tezos, factories, token);
    const share = await getLiquidityShare(tezos, dex, account);

    const lpTokenValue = share.total;
    const removeLiquidityParams = await removeLiquidity(
      tezos,
      dex,
      lpTokenValue,
      slippageTolerance
    );

    const op = await batchify(
      tezos.wallet.batch([]),
      removeLiquidityParams
    ).send();

    console.info(op.hash);
    await op.confirmation();
    console.info("Complete");
  } catch (err) {
    console.error(err);
  }
})();
```

### Initialize liquidity

```typescript
import { findDex, initializeLiquidity } from "@quipuswap/sdk";

const tezos = new TezosToolkit(); // Full sample in "Configure" section

const factories = {
  fa1_2Factory: "KT1WkKiDSsDttdWrfZgcQ6Z9e3Cp4unHP2CP",
  fa2Factory: "KT1Bps1VtszT2T3Yvxm5PJ6Rx2nk1FykWPdU",
};
const token = {
  contract: "KT1RX7AdYr9hFZPQTZw5Fu8KkMwVtobHpTp6",
  id: 0,
};

(async () => {
  try {
    const tokenValue = 4_000;
    const tezValue = 10_000_000;

    const initializeLiquidityParams = await initializeLiquidity(
      tezos,
      factories,
      token,
      tokenValue,
      tezValue
    );

    const op = await batchify(
      tezos.wallet.batch([]),
      initializeLiquidityParams
    ).send();

    console.info(op.hash);
    await op.confirmation();
    console.info("Complete");
  } catch (err) {
    console.error(err);
  }
})();
```

### Get token price

```typescript
import { findDex, estimateTezInToken } from "@quipuswap/sdk";

const tezos = new TezosToolkit(); // Full sample in "Configure" section

const factories = {
  fa1_2Factory: "KT1WkKiDSsDttdWrfZgcQ6Z9e3Cp4unHP2CP",
  fa2Factory: "KT1Bps1VtszT2T3Yvxm5PJ6Rx2nk1FykWPdU",
};
const token = {
  contract: "KT1RX7AdYr9hFZPQTZw5Fu8KkMwVtobHpTp6",
  id: 0,
};

(async () => {
  try {
    const dex = await findDex(tezos, factories, token);
    const dexStorage = await dex.contract.storage();

    const tokenValue = 4_000;
    const inTezValue = estimateTezInToken(dexStorage, tokenValue);

    console.info(`4_000 tokens in tez: ${inTezValue}`);
  } catch (err) {
    console.error(err);
  }
})();
```

# TSDX User Guide

Congrats! You just saved yourself hours of work by bootstrapping this project with TSDX. Let’s get you oriented with what’s here and how to use it.

> This TSDX setup is meant for developing libraries (not apps!) that can be published to NPM. If you’re looking to build a Node app, you could use `ts-node-dev`, plain `ts-node`, or simple `tsc`.

> If you’re new to TypeScript, checkout [this handy cheatsheet](https://devhints.io/typescript)

## Commands

TSDX scaffolds your new library inside `/src`.

To run TSDX, use:

```bash
npm start # or yarn start
```

This builds to `/dist` and runs the project in watch mode so any edits you save inside `src` causes a rebuild to `/dist`.

To do a one-off build, use `npm run build` or `yarn build`.

To run tests, use `npm test` or `yarn test`.

## Configuration

Code quality is set up for you with `prettier`, `husky`, and `lint-staged`. Adjust the respective fields in `package.json` accordingly.

### Jest

Jest tests are set up to run with `npm test` or `yarn test`.

### Bundle Analysis

[`size-limit`](https://github.com/ai/size-limit) is set up to calculate the real cost of your library with `npm run size` and visualize the bundle with `npm run analyze`.

#### Setup Files

This is the folder structure we set up for you:

```txt
/src
  index.tsx       # EDIT THIS
/test
  blah.test.tsx   # EDIT THIS
.gitignore
package.json
README.md         # EDIT THIS
tsconfig.json
```

### Rollup

TSDX uses [Rollup](https://rollupjs.org) as a bundler and generates multiple rollup configs for various module formats and build settings. See [Optimizations](#optimizations) for details.

### TypeScript

`tsconfig.json` is set up to interpret `dom` and `esnext` types, as well as `react` for `jsx`. Adjust according to your needs.

## Continuous Integration

### GitHub Actions

Two actions are added by default:

- `main` which installs deps w/ cache, lints, tests, and builds on all pushes against a Node and OS matrix
- `size` which comments cost comparison of your library on every pull request using [`size-limit`](https://github.com/ai/size-limit)

## Optimizations

Please see the main `tsdx` [optimizations docs](https://github.com/palmerhq/tsdx#optimizations). In particular, know that you can take advantage of development-only optimizations:

```js
// ./types/index.d.ts
declare var __DEV__: boolean;

// inside your code...
if (__DEV__) {
  console.log("foo");
}
```

You can also choose to install and use [invariant](https://github.com/palmerhq/tsdx#invariant) and [warning](https://github.com/palmerhq/tsdx#warning) functions.

## Module Formats

CJS, ESModules, and UMD module formats are supported.

The appropriate paths are configured in `package.json` and `dist/index.js` accordingly. Please report if any issues are found.

## Named Exports

Per Palmer Group guidelines, [always use named exports.](https://github.com/palmerhq/typescript#exports) Code split inside your React app instead of your React library.

## Including Styles

There are many ways to ship styles, including with CSS-in-JS. TSDX has no opinion on this, configure how you like.

For vanilla CSS, you can include it at the root directory and add it to the `files` section in your `package.json`, so that it can be imported separately by your users and run through their bundler's loader.

## Publishing to NPM

We recommend using [np](https://github.com/sindresorhus/np).
