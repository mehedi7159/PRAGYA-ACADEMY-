import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
  }).format(amount).replace('BDT', '৳');
}

export function generateId(prefix: string) {
  return `${prefix}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
}
