import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAdminWhitelist() {
  const explicitList = import.meta.env.VITE_ADMIN_EMAIL_WHITELIST;
  const singleAdmin = import.meta.env.VITE_ADMIN_EMAIL;

  const source = explicitList && explicitList.trim().length > 0
    ? explicitList
    : singleAdmin ?? "";

  return source
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return getAdminWhitelist().includes(normalized);
}
