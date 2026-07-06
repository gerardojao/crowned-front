import assert from "node:assert/strict";
import test from "node:test";
import {
  currentFiscalYearStart,
  localDateInputValue,
} from "./date.js";

test("localDateInputValue keeps the local calendar day", () => {
  assert.equal(
    localDateInputValue(new Date(2026, 6, 5, 23, 59)),
    "2026-07-05",
  );
});

test("currentFiscalYearStart returns the first day of the local year", () => {
  assert.equal(currentFiscalYearStart(new Date(2026, 6, 5)), "2026-01-01");
});
