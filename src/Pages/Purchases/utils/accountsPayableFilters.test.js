import test from "node:test";
import assert from "node:assert/strict";
import { buildAccountsPayableQueryParams } from "./accountsPayableFilters.js";

test("buildAccountsPayableQueryParams omits empty values", () => {
  assert.deepEqual(
    buildAccountsPayableQueryParams({
      search: "  ",
    }),
    {},
  );
});

test("buildAccountsPayableQueryParams maps general search", () => {
  assert.deepEqual(
    buildAccountsPayableQueryParams({
      search: " FRA-26 ",
      fechaInicio: "2026-07-01",
      fechaFin: "2026-07-31",
    }),
    {
      search: "FRA-26",
      fechaInicio: "2026-07-01",
      fechaFin: "2026-07-31",
    },
  );
});
