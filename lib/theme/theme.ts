export const THEME_STORAGE_KEY = "usp-ats-theme";
export type Theme = "light" | "dark";

export function resolveTheme(value: string | null | undefined): Theme {
  return value === "light" ? "light" : "dark";
}

// Runs in <head> before the body is painted. Only a validated theme reaches the DOM.
export const themeInitScript = `(() => {
  let theme = "dark";
  try {
    if (localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "light") theme = "light";
  } catch {}
  document.documentElement.dataset.theme = theme;
})();`;
