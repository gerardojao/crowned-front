import test from "node:test";
import assert from "node:assert/strict";
import { groupMonthly, monthKeys, topCustomers } from "./ownerAnalytics.js";

test("owner analytics creates inclusive monthly keys", () => {
  assert.deepEqual(monthKeys("2026-01-01", "2026-03-31"), ["2026-01", "2026-02", "2026-03"]);
});

test("owner analytics preserves negative rectifications", () => {
  const values = groupMonthly([
    { date: "2026-01-10", totalAmount: 1000 },
    { date: "2026-01-12", totalAmount: -200 },
  ], ["2026-01"], "date", "totalAmount");
  assert.deepEqual(values, [800]);
});

test("owner analytics ranks customers by net billing", () => {
  assert.deepEqual(topCustomers([
    { customerName: "A", totalAmount: 1000 },
    { customerName: "A", totalAmount: -100 },
    { customerName: "B", totalAmount: 500 },
  ]), [{ name: "A", total: 900 }, { name: "B", total: 500 }]);
});
