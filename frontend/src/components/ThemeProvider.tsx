"use client";

import { ThemeProvider as NextThemes } from "next-themes";
import type { ReactNode } from "react";

// Adds/removes the "dark" class on <html>. Starts from the visitor's system setting,
// then remembers their choice in localStorage.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}
