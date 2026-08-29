import assert from "node:assert/strict";
import test from "node:test";
import { formatSpanishMoney, parseSpanishMoney } from "./currency.js";

test("parseSpanishMoney accepts Spanish and API decimal formats", () => {
  assert.equal(parseSpanishMoney("1.250,50"), 1250.5);
  assert.equal(parseSpanishMoney("125,50"), 125.5);
  assert.equal(parseSpanishMoney("125.50"), 125.5);
  assert.equal(parseSpanishMoney("0,00"), 0);
});

test("formatSpanishMoney always renders two Spanish decimal digits", () => {
  assert.equal(formatSpanishMoney(0), "0,00");
  assert.equal(formatSpanishMoney(10), "10,00");
  assert.equal(formatSpanishMoney(1250.5), "1.250,50");
});
