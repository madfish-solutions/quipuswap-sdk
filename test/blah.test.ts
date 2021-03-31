import { isTezAsset } from "../src";

describe("isTezAsset", () => {
  it("works", () => {
    expect(isTezAsset("tez")).toBeTruthy();
  });
});
