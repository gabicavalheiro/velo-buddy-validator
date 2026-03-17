// Funções utilitárias reutilizáveis (ex.: composição de classes CSS e helpers genéricos).
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
