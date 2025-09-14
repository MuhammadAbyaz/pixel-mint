import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import {
  uniqueNamesGenerator,
  adjectives,
  animals,
  colors,
} from "unique-names-generator";

export const uniqueName = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    separator: "",
    style: "capital",
    length: 2,
  }) + Math.floor(Math.random() * 1000);
