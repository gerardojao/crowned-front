const LEGACY_OWNER_EMAILS = new Set([
  "gerencia_master@mastertouch.com",
]);

export function isLegacyOwnerAccount(user) {
  const email = String(user?.email ?? user?.Email ?? "").trim().toLowerCase();
  return LEGACY_OWNER_EMAILS.has(email);
}

