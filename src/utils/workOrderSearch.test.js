import assert from "node:assert/strict";
import test from "node:test";
import {
  matchesWorkOrderPlateSearch,
  matchesWorkOrderTextSearch,
  parseExplicitOrderIdSearch,
  parseOrderIdSearch,
} from "./workOrderSearch.js";

test("parseOrderIdSearch reads plain and hash-prefixed order ids", () => {
  assert.equal(parseOrderIdSearch("123"), 123);
  assert.equal(parseOrderIdSearch("#123"), 123);
});

test("parseOrderIdSearch ignores plate-like searches", () => {
  assert.equal(parseOrderIdSearch("1234ABC"), null);
  assert.equal(parseOrderIdSearch(""), null);
  assert.equal(parseOrderIdSearch("#0"), null);
});

test("matchesWorkOrderPlateSearch finds partial plate coincidences", () => {
  assert.equal(matchesWorkOrderPlateSearch({ Matricula: "1234-ABC" }, "34a"), true);
  assert.equal(matchesWorkOrderPlateSearch({ Matricula: "KBD 20 G" }, "bd20"), true);
  assert.equal(matchesWorkOrderPlateSearch({ matricula: "9876XYZ" }, "76x"), true);
  assert.equal(matchesWorkOrderPlateSearch({ Matricula: "1234ABC" }, "999"), false);
});

test("matchesWorkOrderTextSearch finds client or company coincidences", () => {
  assert.equal(
    matchesWorkOrderTextSearch({ Cliente: "Autoservicios JETB", Matricula: "1234ABC" }, "jetb"),
    true,
  );
  assert.equal(
    matchesWorkOrderTextSearch({ cliente: "MasterTouch Automotive Group" }, "touch auto"),
    true,
  );
  assert.equal(matchesWorkOrderTextSearch({ Telefono: "961524953" }, "4953"), true);
  assert.equal(matchesWorkOrderTextSearch({ Cliente: "Taller Norte" }, "sur"), false);
});

test("parseExplicitOrderIdSearch requires hash prefix", () => {
  assert.equal(parseExplicitOrderIdSearch("#7908"), 7908);
  assert.equal(parseExplicitOrderIdSearch("7908"), null);
});
