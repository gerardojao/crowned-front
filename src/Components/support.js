export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL || "soporte@zagapro.store";

export const SUPPORT_DELIVERY_EMAIL =
  import.meta.env.VITE_SUPPORT_DELIVERY_EMAIL || "zagaprosystem@gmail.com";

export function supportMailto(subject = "Soporte ZagaPro") {
  return `mailto:${SUPPORT_DELIVERY_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
