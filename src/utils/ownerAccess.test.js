import test from "node:test";
import assert from "node:assert/strict";
import { isLegacyOwnerAccount } from "./ownerAccess.js";

test("recognizes the MasterTouch owner account without case sensitivity", () => {
  assert.equal(isLegacyOwnerAccount({ email: "Gerencia_Master@MasterTouch.com" }), true);
});

test("does not grant owner compatibility to other accounts", () => {
  assert.equal(isLegacyOwnerAccount({ email: "user@mastertouch.com" }), false);
});

