import assert from "node:assert/strict";
import test from "node:test";
import {
  currentFiscalYearStart,
  localDateInputValue,
  soloFecha,
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

test("soloFecha keeps the backend calendar day when ISO offset crosses UTC date", () => {
  assert.equal(soloFecha("2026-07-09T23:30:00-03:00"), "2026-07-09");
});
