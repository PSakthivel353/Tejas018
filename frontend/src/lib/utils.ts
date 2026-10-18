import clsx, { type ClassValue } from "clsx";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const percent = (fraction: number) => `${Math.round(fraction * 100)}%`;

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}
