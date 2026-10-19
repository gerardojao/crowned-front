const RAPEL_HELP_NOTICE_KEY = "zagapro:rapel-help-notice-dismissed";
export const RAPEL_HELP_NOTICE_DISMISSED_EVENT =
  "zagapro:rapel-help-notice-dismissed";

export const isRapelHelpNoticeDismissed = () =>
  localStorage.getItem(RAPEL_HELP_NOTICE_KEY) === "true";

export const dismissRapelHelpNotice = () => {
  localStorage.setItem(RAPEL_HELP_NOTICE_KEY, "true");
  window.dispatchEvent(new Event(RAPEL_HELP_NOTICE_DISMISSED_EVENT));
};
