export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "gerardojao@gmail.com";

export function supportMailto(subject = "Soporte TallerCrowned") {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
