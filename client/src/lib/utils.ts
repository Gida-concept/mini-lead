import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined) return "—";
  return rating.toFixed(1);
}

export function truncateText(
  text: string | null | undefined,
  maxLength: number
): string {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function truncateUrl(
  url: string | null | undefined,
  maxLength = 40
): string {
  if (!url) return "—";
  const cleaned = url.replace(/^https?:\/\//, "");
  return truncateText(cleaned, maxLength);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}
