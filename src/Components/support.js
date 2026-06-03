export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "gerardojao@gmail.com";

export function supportMailto(subject = "Soporte ZagaPro") {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
