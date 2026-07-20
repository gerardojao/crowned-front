import assert from "node:assert/strict";
import test from "node:test";
import { parseOrderIdSearch } from "./workOrderSearch.js";

test("parseOrderIdSearch reads plain and hash-prefixed order ids", () => {
  assert.equal(parseOrderIdSearch("123"), 123);
  assert.equal(parseOrderIdSearch("#123"), 123);
});

test("parseOrderIdSearch ignores plate-like searches", () => {
  assert.equal(parseOrderIdSearch("1234ABC"), null);
  assert.equal(parseOrderIdSearch(""), null);
  assert.equal(parseOrderIdSearch("#0"), null);
});
