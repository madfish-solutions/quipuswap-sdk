import { isXTZAsset } from "../src";

describe("isXTZAsset", () => {
  it("works", () => {
    expect(isXTZAsset("xtz")).toBeTruthy();
  });
});
