import { env } from "@/env";
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

/**
 * Get IPFS URL from hash
 * @param ipfsHash The IPFS hash (with or without ipfs:// prefix)
 * @returns The full IPFS gateway URL
 */
export function getIPFSUrl(ipfsHash: string): string {
  const PINATA_GATEWAY = env.PINATA_GATEWAY;

  if (ipfsHash.startsWith("ipfs://")) {
    const hash = ipfsHash.replace("ipfs://", "");
    return `${PINATA_GATEWAY}${hash}`;
  }
  return `${PINATA_GATEWAY}${ipfsHash}`;
}
