import { useState, useCallback, useEffect } from "react";

const FONT_STORAGE_KEY = "njorda-font-primary";
const BRAND_FONT_STORAGE_KEY = "njorda-font-brand";

const fontOptions = [
  {
    label: "At Hauss (standard)",
    value: '"At Hauss", "Inter", Arial, Helvetica, sans-serif',
  },
  {
    label: "Inter",
    value: '"Inter", Arial, Helvetica, sans-serif',
  },
  {
    label: "System UI",
    value: "system-ui, -apple-system, sans-serif",
  },
];

const brandFontOptions = [
  {
    label: "Ballinger Mono (standard)",
    value: '"Ballinger Mono Medium", "Courier New", monospace',
  },
  {
    label: "At Hauss (sans-serif)",
    value: '"At Hauss", "Inter", Arial, Helvetica, sans-serif',
  },
  {
    label: "Inter",
    value: '"Inter", Arial, Helvetica, sans-serif',
  },
  {
    label: "System Mono",
    value: 'ui-monospace, "SF Mono", "Cascadia Mono", monospace',
  },
];

function getStoredFont(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function useFont() {
  const [currentFont, setCurrentFont] = useState(() =>
    getStoredFont(FONT_STORAGE_KEY, fontOptions[0].value),
  );
  const [currentBrandFont, setCurrentBrandFont] = useState(() =>
    getStoredFont(BRAND_FONT_STORAGE_KEY, brandFontOptions[0].value),
  );

  // Apply stored fonts on mount
  useEffect(() => {
    document.documentElement.style.setProperty("--font-primary", currentFont);
    document.documentElement.style.setProperty("--font-brand", currentBrandFont);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeFont = useCallback((value: string) => {
    setCurrentFont(value);
    document.documentElement.style.setProperty("--font-primary", value);
    try {
      localStorage.setItem(FONT_STORAGE_KEY, value);
    } catch {
      // ignore storage errors
    }
  }, []);

  const changeBrandFont = useCallback((value: string) => {
    setCurrentBrandFont(value);
    document.documentElement.style.setProperty("--font-brand", value);
    try {
      localStorage.setItem(BRAND_FONT_STORAGE_KEY, value);
    } catch {
      // ignore storage errors
    }
  }, []);

  return {
    currentFont,
    changeFont,
    fontOptions,
    currentBrandFont,
    changeBrandFont,
    brandFontOptions,
  };
}
