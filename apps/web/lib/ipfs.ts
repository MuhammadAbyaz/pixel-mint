"use server";

import { env } from "@/env";

const PINATA_API_KEY = env.PINATA_API_KEY || "";
const PINATA_SECRET_KEY = env.PINATA_SECRET_KEY || "";
const PINATA_GATEWAY =
  env.PINATA_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash?: string;
  ipfsUrl?: string;
  error?: string;
}

export async function uploadToIPFS(
  file: File | Buffer,
  fileName: string,
): Promise<IPFSUploadResult> {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return {
        success: false,
        error:
          "IPFS configuration missing. Please set PINATA_API_KEY and PINATA_SECRET_KEY",
      };
    }

    const formData = new FormData();

    if (file instanceof File) {
      formData.append("file", file);
    } else {
      formData.append("file", new Blob([new Uint8Array(file)]), fileName);
    }

    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        app: "pixel-mint",
        timestamp: Date.now().toString(),
      },
    });
    formData.append("pinataMetadata", metadata);

    // Pinata options
    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Pinata upload error:", error);
      return {
        success: false,
        error: `Failed to upload to IPFS: ${error}`,
      };
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash;
    const ipfsUrl = `${PINATA_GATEWAY}${ipfsHash}`;

    return {
      success: true,
      ipfsHash,
      ipfsUrl,
    };
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload to IPFS",
    };
  }
}

export async function uploadMetadataToIPFS(metadata: {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}): Promise<IPFSUploadResult> {
  try {
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return {
        success: false,
        error: "IPFS configuration missing",
      };
    }

    const jsonString = JSON.stringify(metadata);
    const jsonBuffer = Buffer.from(jsonString, "utf-8");

    const formData = new FormData();
    formData.append("file", new Blob([jsonBuffer]), "metadata.json");

    const pinataMetadata = JSON.stringify({
      name: `NFT Metadata - ${metadata.name}`,
      keyvalues: {
        app: "pixel-mint",
        type: "metadata",
        timestamp: Date.now().toString(),
      },
    });
    formData.append("pinataMetadata", pinataMetadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", options);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Pinata metadata upload error:", error);
      return {
        success: false,
        error: `Failed to upload metadata to IPFS: ${error}`,
      };
    }

    const data = await response.json();
    const ipfsHash = data.IpfsHash;
    const tokenURI = `ipfs://${ipfsHash}`;

    return {
      success: true,
      ipfsHash,
      ipfsUrl: tokenURI, // Return ipfs:// format for smart contract
    };
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload metadata to IPFS",
    };
  }
}
