import { useState, useCallback } from "react";

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

export function useFont() {
  const [currentFont, setCurrentFont] = useState(fontOptions[0].value);
  const [currentBrandFont, setCurrentBrandFont] = useState(
    brandFontOptions[0].value,
  );

  const changeFont = useCallback((value: string) => {
    setCurrentFont(value);
    document.documentElement.style.setProperty("--font-primary", value);
  }, []);

  const changeBrandFont = useCallback((value: string) => {
    setCurrentBrandFont(value);
    document.documentElement.style.setProperty("--font-brand", value);
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
