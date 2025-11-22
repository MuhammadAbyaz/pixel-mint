"use client";

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseEther,
  getAddress,
} from "viem";
import { polygonAmoy } from "viem/chains";
import { env } from "@/env";

// PixelMintNFT ABI - matches the deployed contract
export const PIXEL_MINT_NFT_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenURI", type: "string" },
    ],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenURIs", type: "string[]" },
    ],
    name: "batchMint",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "approved", type: "bool" },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getCreator",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getMintTimestamp",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentTokenId",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "exists",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // ERC721 Transfer event
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
] as const;

// PixelMintMarketplace ABI - matches the deployed contract
export const MARKETPLACE_ABI = [
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "price", type: "uint256" },
    ],
    name: "listNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "delistNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "buyNFT",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "getListing",
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "isActive", type: "bool" },
      { name: "listedAt", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "newFee", type: "uint256" }],
    name: "setMarketplaceFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "marketplaceFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Contract addresses - from deployed contracts
export const NFT_CONTRACT_ADDRESS =
  env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || undefined;
export const MARKETPLACE_CONTRACT_ADDRESS =
  env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || undefined;

/**
 * Get public client for reading blockchain data
 */
export function getPublicClient() {
  if (typeof window === "undefined") {
    return null;
  }

  // Use Alchemy RPC if available, otherwise fallback to public RPC
  // Construct URL from API key if provided, or use full URL, or fallback to public RPC
  const alchemyApiKey = env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  const alchemyRpcUrl = env.NEXT_PUBLIC_ALCHEMY_RPC_URL;

  // Priority: Alchemy API Key > Alchemy RPC URL > Public RPC
  const rpcUrl = alchemyApiKey
    ? `https://polygon-amoy.g.alchemy.com/v2/${alchemyApiKey}`
    : alchemyRpcUrl || `https://rpc-amoy.polygon.technology/`;

  return createPublicClient({
    chain: polygonAmoy,
    transport: http(rpcUrl, {
      retryCount: 5, // Increased retry count
      retryDelay: 2000, // 2 second delay between retries
      timeout: 30000, // 30 second timeout
    }),
  });
}

/**
 * Get wallet client for transactions
 */
export function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  return createWalletClient({
    chain: polygonAmoy,
    transport: custom(window.ethereum),
  });
}

/**
 * Mint NFT on blockchain
 */
export async function mintNFT(
  to: string,
  tokenURI: string,
): Promise<{
  success: boolean;
  transactionHash?: string;
  tokenId?: bigint;
  blockNumber?: bigint;
  blockHash?: string;
  error?: string;
}> {
  try {
    const walletClient = getWalletClient();
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    const [account] = await walletClient.getAddresses();
    if (!account) {
      return { success: false, error: "No account found" };
    }

    if (!NFT_CONTRACT_ADDRESS) {
      return {
        success: false,
        error:
          "NFT contract address not configured. Please set NEXT_PUBLIC_NFT_CONTRACT_ADDRESS in your .env file.",
      };
    }

    // Get public client for reading
    const publicClient = getPublicClient();
    if (!publicClient) {
      return { success: false, error: "Failed to get public client" };
    }

    // Verify contract exists at the address
    try {
      const code = await publicClient.getBytecode({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      });
      if (!code || code === "0x") {
        return {
          success: false,
          error: `No contract found at address ${NFT_CONTRACT_ADDRESS}. Please verify the contract was deployed correctly.`,
        };
      }
    } catch (error: unknown) {
      console.error("Error checking contract:", error);
      return {
        success: false,
        error:
          "Failed to verify contract exists. Please check the contract address and network connection.",
      };
    }

    // Simulate the transaction to get the tokenId that will be minted and verify it will succeed
    let tokenId: bigint | undefined;
    try {
      const { result } = await publicClient.simulateContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: PIXEL_MINT_NFT_ABI,
        functionName: "mint",
        args: [to as `0x${string}`, tokenURI],
        account,
      });
      tokenId = result as bigint;
    } catch (error: unknown) {
      console.error("Error simulating mint:", error);
      // Try to extract detailed error information
      let errorMessage = "Failed to simulate mint transaction";

      if (error && typeof error === "object") {
        // Check for viem error structure
        if ("shortMessage" in error) {
          errorMessage = (error as { shortMessage: string }).shortMessage;
        } else if ("message" in error) {
          errorMessage = (error as { message: string }).message;
        }

        // Check for contract revert reason
        if ("data" in error && error.data) {
          const data = error.data;
          if (typeof data === "string" && data.startsWith("0x")) {
            // Try to decode the revert reason
            try {
              // Check if it's a standard revert
              if (data.startsWith("0x08c379a0")) {
                // Error(string) selector
                const reason = data.slice(10); // Remove selector
                const decoded = Buffer.from(reason, "hex")
                  .toString("utf-8")
                  .replace(/\0/g, "");
                errorMessage = `Contract revert: ${decoded}`;
              } else {
                errorMessage = `Contract error: ${data}`;
              }
            } catch {
              // If decoding fails, use the raw data
              errorMessage = `Contract error: ${data}`;
            }
          } else {
            // Safely stringify data, handling BigInt
            try {
              errorMessage = `Contract error: ${JSON.stringify(data)}`;
            } catch {
              // If JSON.stringify fails (e.g., due to BigInt), just use string representation
              errorMessage = `Contract error: ${String(data)}`;
            }
          }
        }

        // Check for cause chain
        if ("cause" in error && error.cause) {
          const cause = error.cause;
          if (typeof cause === "object" && "message" in cause) {
            errorMessage += ` (Cause: ${String(cause.message)})`;
          }
        }
      }

      // For RPC errors, we'll still try to mint (might be temporary network issue)
      const isRpcError =
        errorMessage.includes("Internal JSON-RPC error") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("network") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("fetch failed") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("ECONNRESET");

      if (!isRpcError) {
        return {
          success: false,
          error: `${errorMessage}. Please verify: 1) Contract is deployed at ${NFT_CONTRACT_ADDRESS}, 2) You're on Polygon Amoy network, 3) Your wallet has enough MATIC for gas.`,
        };
      }

      // For RPC errors, log warning but continue
      console.warn(
        "Simulation failed due to RPC error, but continuing with mint attempt:",
        errorMessage,
      );
    }

    // Execute the mint transaction with retry logic for RPC errors
    let hash: `0x${string}` | undefined;
    try {
      // First, try to estimate gas to catch errors early
      try {
        await publicClient.estimateContractGas({
          address: NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: PIXEL_MINT_NFT_ABI,
          functionName: "mint",
          args: [to as `0x${string}`, tokenURI],
          account,
        });
      } catch (gasError: unknown) {
        console.error("Gas estimation error:", gasError);
        // Extract revert reason if available
        let errorMessage = "Transaction would revert";
        if (gasError && typeof gasError === "object") {
          if ("data" in gasError && gasError.data) {
            // Safely stringify data, handling BigInt
            try {
              errorMessage = `Contract error: ${JSON.stringify(gasError.data)}`;
            } catch {
              errorMessage = `Contract error: ${String(gasError.data)}`;
            }
          } else if ("shortMessage" in gasError) {
            errorMessage = (gasError as { shortMessage: string }).shortMessage;
          } else if ("message" in gasError) {
            errorMessage = (gasError as { message: string }).message;
          }
        }
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Retry logic for RPC errors
      let mintAttempts = 0;
      const maxMintAttempts = 3;

      while (mintAttempts < maxMintAttempts && !hash) {
        try {
          mintAttempts++;
          hash = await walletClient.writeContract({
            address: NFT_CONTRACT_ADDRESS as `0x${string}`,
            abi: PIXEL_MINT_NFT_ABI,
            functionName: "mint",
            args: [to as `0x${string}`, tokenURI],
            account,
          });
          break; // Success, exit retry loop
        } catch (mintError: unknown) {
          const errorMessage =
            mintError && typeof mintError === "object" && "message" in mintError
              ? String(mintError.message)
              : "";

          const shortMessage =
            mintError &&
            typeof mintError === "object" &&
            "shortMessage" in mintError
              ? String((mintError as { shortMessage: string }).shortMessage)
              : "";

          const fullError = errorMessage || shortMessage || "";

          // Don't retry on user rejection or revert errors
          if (
            fullError.toLowerCase().includes("rejected") ||
            fullError.toLowerCase().includes("denied") ||
            fullError.toLowerCase().includes("user rejected") ||
            fullError.includes("execution reverted") ||
            fullError.includes("revert")
          ) {
            throw mintError; // Re-throw to be caught by outer catch
          }

          // Retry on RPC errors
          if (
            (fullError.includes("Internal JSON-RPC error") ||
              fullError.includes("timeout") ||
              fullError.includes("network") ||
              fullError.includes("ECONNREFUSED")) &&
            mintAttempts < maxMintAttempts
          ) {
            console.warn(
              `RPC error during mint, retrying (${mintAttempts}/${maxMintAttempts})...`,
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * mintAttempts),
            ); // Exponential backoff
            continue; // Retry
          }

          // For other errors or if we've exhausted attempts, throw
          throw mintError;
        }
      }

      if (!hash) {
        return {
          success: false,
          error:
            "Failed to mint NFT after multiple attempts due to RPC errors. Please try again later or check your network connection.",
        };
      }
    } catch (error: unknown) {
      console.error("Error calling mint function:", error);
      // Try to get more details about the error
      let errorMessage = "Failed to mint NFT";
      if (error && typeof error === "object") {
        if ("shortMessage" in error) {
          errorMessage = (error as { shortMessage: string }).shortMessage;
        } else if ("message" in error) {
          errorMessage = (error as { message: string }).message;
        } else if ("data" in error) {
          // Safely stringify data, handling BigInt
          try {
            errorMessage = `Contract error: ${JSON.stringify(error.data)}`;
          } catch {
            errorMessage = `Contract error: ${String(error.data)}`;
          }
        }
      }

      // Provide helpful message for RPC errors
      if (errorMessage.includes("Internal JSON-RPC error")) {
        errorMessage =
          "Network/RPC error. Please check your internet connection and try again. If the problem persists, the Polygon Amoy network might be experiencing issues.";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // hash is now guaranteed to be defined after the try-catch
    if (!hash) {
      return {
        success: false,
        error: "Failed to mint NFT - transaction hash not available",
      };
    }

    if (!publicClient) {
      return {
        success: false,
        error: "Failed to get public client",
      };
    }

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: hash as `0x${string}`,
    });

    // Get block hash from the receipt's block number
    // Note: We try to get the block hash, but if it's not available (e.g., block reorged or RPC issue),
    // we'll just continue without it. The block number from the receipt is still valid.
    let blockHash: string | undefined;
    try {
      const block = await publicClient.getBlock({
        blockNumber: receipt.blockNumber,
      });
      blockHash = block.hash;
    } catch (error: unknown) {
      // Silently handle block fetch errors - the block might not be available on this RPC endpoint
      // or might have been reorged. The transaction is still valid.
      console.warn(
        `Could not fetch block ${receipt.blockNumber.toString()}:`,
        error instanceof Error ? error.message : "Unknown error",
      );
      // Continue without block hash - we still have the block number from the receipt
    }

    // If we didn't get tokenId from simulation, try to get it from the contract
    if (!tokenId) {
      try {
        const currentTokenId = await publicClient.readContract({
          address: NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: PIXEL_MINT_NFT_ABI,
          functionName: "getCurrentTokenId",
        });
        // The tokenId is currentTokenId - 1 (since counter increments after minting)
        tokenId = BigInt(currentTokenId as bigint) - 1n;
      } catch (error) {
        console.error("Error reading tokenId from contract:", error);
      }
    }

    return {
      success: true,
      transactionHash: hash,
      tokenId,
      blockNumber: receipt.blockNumber,
      blockHash,
    };
  } catch (error: any) {
    console.error("Error minting NFT:", error);
    return {
      success: false,
      error: error.message || "Failed to mint NFT",
    };
  }
}

/**
 * List NFT for sale on marketplace
 */
export async function listNFT(
  tokenId: bigint,
  price: string, // Price in MATIC
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const walletClient = getWalletClient();
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    const [account] = await walletClient.getAddresses();
    if (!account) {
      return { success: false, error: "No account found" };
    }

    if (!MARKETPLACE_CONTRACT_ADDRESS || !NFT_CONTRACT_ADDRESS) {
      return {
        success: false,
        error: "Contract addresses not configured",
      };
    }

    const priceInWei = parseEther(price);
    const publicClient = getPublicClient();

    // Retry logic for RPC errors
    let listAttempts = 0;
    const maxListAttempts = 3;
    let hash: `0x${string}` | undefined;

    while (listAttempts < maxListAttempts && !hash) {
      try {
        listAttempts++;

        // Simulate first to catch errors early
        if (publicClient && listAttempts === 1) {
          try {
            await publicClient.simulateContract({
              address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
              abi: MARKETPLACE_ABI,
              functionName: "listNFT",
              args: [
                NFT_CONTRACT_ADDRESS as `0x${string}`,
                tokenId,
                priceInWei,
              ],
              account,
            });
          } catch (simulateError: unknown) {
            const errorMessage =
              simulateError &&
              typeof simulateError === "object" &&
              "message" in simulateError
                ? String(simulateError.message)
                : "";

            const shortMessage =
              simulateError &&
              typeof simulateError === "object" &&
              "shortMessage" in simulateError
                ? String(
                    (simulateError as { shortMessage: string }).shortMessage,
                  )
                : "";

            const fullError = errorMessage || shortMessage || "";

            // Don't retry on revert errors (these are real contract errors)
            if (
              fullError.includes("execution reverted") ||
              fullError.includes("revert") ||
              fullError.includes("not approved") ||
              fullError.includes("Marketplace must be approved")
            ) {
              return {
                success: false,
                error: fullError,
              };
            }

            // For RPC errors, continue to retry
            if (
              !fullError.includes("Internal JSON-RPC error") &&
              !fullError.includes("timeout") &&
              !fullError.includes("network")
            ) {
              // Not an RPC error, return the error
              return {
                success: false,
                error: fullError,
              };
            }
          }
        }

        hash = await walletClient.writeContract({
          address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: "listNFT",
          args: [NFT_CONTRACT_ADDRESS as `0x${string}`, tokenId, priceInWei],
          account,
        });
        break; // Success, exit retry loop
      } catch (listError: unknown) {
        const errorMessage =
          listError && typeof listError === "object" && "message" in listError
            ? String(listError.message)
            : "";

        const shortMessage =
          listError &&
          typeof listError === "object" &&
          "shortMessage" in listError
            ? String((listError as { shortMessage: string }).shortMessage)
            : "";

        const fullError = errorMessage || shortMessage || "";

        // Don't retry on user rejection or revert errors
        if (
          fullError.toLowerCase().includes("rejected") ||
          fullError.toLowerCase().includes("denied") ||
          fullError.toLowerCase().includes("user rejected") ||
          fullError.includes("execution reverted") ||
          fullError.includes("revert") ||
          fullError.includes("not approved") ||
          fullError.includes("Marketplace must be approved")
        ) {
          return {
            success: false,
            error: fullError,
          };
        }

        // Retry on RPC errors
        if (
          (fullError.includes("Internal JSON-RPC error") ||
            fullError.includes("timeout") ||
            fullError.includes("network") ||
            fullError.includes("ECONNREFUSED") ||
            fullError.includes("fetch failed")) &&
          listAttempts < maxListAttempts
        ) {
          console.warn(
            `RPC error during listing, retrying (${listAttempts}/${maxListAttempts})...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * Math.pow(2, listAttempts - 1)),
          );
          continue; // Retry
        }

        // For other errors or if we've exhausted attempts, return error
        return {
          success: false,
          error: fullError || "Failed to list NFT",
        };
      }
    }

    if (!hash) {
      return {
        success: false,
        error:
          "Failed to list NFT after multiple attempts due to RPC errors. Please try again later.",
      };
    }

    return {
      success: true,
      transactionHash: hash,
    };
  } catch (error: any) {
    console.error("Error listing NFT:", error);
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "Failed to list NFT";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Set marketplace fee (only contract owner can call this)
 * @param fee Fee in basis points (0 = 0%, 100 = 1%, 10000 = 100%)
 */
export async function setMarketplaceFee(
  fee: number,
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const walletClient = getWalletClient();
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    const [account] = await walletClient.getAddresses();
    if (!account) {
      return { success: false, error: "No account found" };
    }

    if (!MARKETPLACE_CONTRACT_ADDRESS) {
      return {
        success: false,
        error: "Marketplace contract address not configured",
      };
    }

    const hash = await walletClient.writeContract({
      address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: "setMarketplaceFee",
      args: [BigInt(fee)],
      account,
    });

    return {
      success: true,
      transactionHash: hash,
    };
  } catch (error: any) {
    console.error("Error setting marketplace fee:", error);
    return {
      success: false,
      error: error.message || "Failed to set marketplace fee",
    };
  }
}

/**
 * Get current marketplace fee
 */
export async function getMarketplaceFee(): Promise<{
  success: boolean;
  fee?: number;
  error?: string;
}> {
  try {
    const publicClient = getPublicClient();
    if (!publicClient) {
      return { success: false, error: "Failed to get public client" };
    }

    if (!MARKETPLACE_CONTRACT_ADDRESS) {
      return {
        success: false,
        error: "Marketplace contract address not configured",
      };
    }

    const fee = await publicClient.readContract({
      address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
      abi: MARKETPLACE_ABI,
      functionName: "marketplaceFee",
    });

    return {
      success: true,
      fee: Number(fee),
    };
  } catch (error: unknown) {
    console.error("Error getting marketplace fee:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get marketplace fee",
    };
  }
}

/**
 * Get NFT owner from blockchain
 */
export async function getNFTOwnerOnChain(
  tokenId: bigint,
): Promise<{ success: boolean; owner?: string; error?: string }> {
  try {
    const publicClient = getPublicClient();
    if (!publicClient) {
      return { success: false, error: "Failed to get public client" };
    }

    if (!NFT_CONTRACT_ADDRESS) {
      return {
        success: false,
        error: "NFT contract address not configured",
      };
    }

    // First check if token exists to avoid ownerOf revert
    try {
      const exists = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: PIXEL_MINT_NFT_ABI as any, // Type assertion needed for exists function
        functionName: "exists",
        args: [tokenId],
      });

      if (!exists) {
        return {
          success: false,
          error: "Token does not exist",
        };
      }
    } catch (existsError) {
      // If exists function doesn't exist or fails, try ownerOf anyway
      console.warn("Could not check token existence:", existsError);
    }

    const owner = await publicClient.readContract({
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: PIXEL_MINT_NFT_ABI,
      functionName: "ownerOf",
      args: [tokenId],
    });

    return {
      success: true,
      owner: owner as string,
    };
  } catch (error: unknown) {
    console.error("Error getting NFT owner:", error);
    const errorMessage =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "";

    // Check if it's a "token doesn't exist" error
    if (
      errorMessage.includes("0x7e273289") ||
      errorMessage.includes("Token does not exist") ||
      errorMessage.includes("ERC721NonexistentToken")
    ) {
      return {
        success: false,
        error: "Token does not exist",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get NFT owner",
    };
  }
}

/**
 * Check if an address is approved to transfer an NFT
 */
export async function checkNFTApproval(
  tokenId: bigint,
  ownerAddress: string,
  approvedAddress: string,
): Promise<{ success: boolean; isApproved?: boolean; error?: string }> {
  try {
    const publicClient = getPublicClient();
    if (!publicClient) {
      return { success: false, error: "Failed to get public client" };
    }

    if (!NFT_CONTRACT_ADDRESS) {
      return {
        success: false,
        error: "NFT contract address not configured",
      };
    }

    // First check if token exists to avoid getApproved revert
    try {
      const exists = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: PIXEL_MINT_NFT_ABI as any, // Type assertion needed for exists function
        functionName: "exists",
        args: [tokenId],
      });

      if (!exists) {
        return {
          success: false,
          error: "Token does not exist",
        };
      }
    } catch (existsError) {
      // If exists function doesn't exist or fails, continue anyway
      console.warn("Could not check token existence:", existsError);
    }

    // Check if approved for all (operator approval) - this is cheaper and works for all tokens
    try {
      const isApprovedForAll = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: PIXEL_MINT_NFT_ABI,
        functionName: "isApprovedForAll",
        args: [ownerAddress as `0x${string}`, approvedAddress as `0x${string}`],
      });

      if (isApprovedForAll) {
        return {
          success: true,
          isApproved: true,
        };
      }
    } catch (approvalForAllError) {
      console.warn("Could not check isApprovedForAll:", approvalForAllError);
    }

    // Check if this specific token is approved (only if token exists)
    try {
      const approvedAddressForToken = await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: PIXEL_MINT_NFT_ABI,
        functionName: "getApproved",
        args: [tokenId],
      });

      const isTokenApproved =
        approvedAddressForToken?.toLowerCase() ===
        approvedAddress.toLowerCase();

      return {
        success: true,
        isApproved: isTokenApproved,
      };
    } catch (getApprovedError) {
      // If getApproved fails (e.g., token doesn't exist), return not approved
      const errorMessage =
        getApprovedError &&
        typeof getApprovedError === "object" &&
        "message" in getApprovedError
          ? String(getApprovedError.message)
          : "";

      if (
        errorMessage.includes("0x7e273289") ||
        errorMessage.includes("Token does not exist") ||
        errorMessage.includes("ERC721NonexistentToken")
      ) {
        return {
          success: false,
          error: "Token does not exist",
        };
      }

      // For other errors, assume not approved
      return {
        success: true,
        isApproved: false,
      };
    }
  } catch (error: unknown) {
    console.error("Error checking NFT approval:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to check NFT approval",
    };
  }
}

/**
 * Transfer NFT from seller to buyer
 * Note: Only the NFT owner (or approved address) can call this
 */
export async function transferNFT(
  tokenId: bigint,
  to: string,
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const walletClient = getWalletClient();
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    const [account] = await walletClient.getAddresses();
    if (!account) {
      return { success: false, error: "No account found" };
    }

    if (!NFT_CONTRACT_ADDRESS) {
      return {
        success: false,
        error: "NFT contract address not configured",
      };
    }

    // Verify the caller owns the NFT
    const ownerCheck = await getNFTOwnerOnChain(tokenId);
    if (!ownerCheck.success || !ownerCheck.owner) {
      return {
        success: false,
        error: "Failed to verify NFT ownership",
      };
    }

    if (ownerCheck.owner.toLowerCase() !== account.toLowerCase()) {
      return {
        success: false,
        error: "You don't own this NFT. Only the owner can transfer it.",
      };
    }

    // Transfer the NFT
    const hash = await walletClient.writeContract({
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: PIXEL_MINT_NFT_ABI,
      functionName: "safeTransferFrom",
      args: [account, to as `0x${string}`, tokenId],
      account,
    });

    return {
      success: true,
      transactionHash: hash,
    };
  } catch (error: unknown) {
    console.error("Error transferring NFT:", error);

    let errorMessage = "Failed to transfer NFT";
    if (error && typeof error === "object") {
      const errorMessageStr =
        ("message" in error ? String(error.message) : "") +
        ("shortMessage" in error
          ? String((error as { shortMessage: string }).shortMessage)
          : "");

      if (
        errorMessageStr.toLowerCase().includes("user rejected") ||
        errorMessageStr.toLowerCase().includes("user denied")
      ) {
        return {
          success: false,
          error: "Transaction was rejected",
        };
      }

      if ("shortMessage" in error) {
        errorMessage = (error as { shortMessage: string }).shortMessage;
      } else if ("message" in error) {
        errorMessage = (error as { message: string }).message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Buy NFT - uses marketplace contract if listed, otherwise direct transfer
 * Marketplace contract provides atomic swap (payment + transfer in one transaction)
 */
export async function buyNFT(
  tokenId: bigint,
  sellerAddress: string,
  price: string, // Price in MATIC
): Promise<{
  success: boolean;
  transactionHash?: string;
  transferHash?: string; // Same as transactionHash when using marketplace
  error?: string;
}> {
  try {
    const walletClient = getWalletClient();
    if (!walletClient) {
      return { success: false, error: "Wallet not connected" };
    }

    const [account] = await walletClient.getAddresses();
    if (!account) {
      return { success: false, error: "No account found" };
    }

    if (!NFT_CONTRACT_ADDRESS) {
      return {
        success: false,
        error: "NFT contract address not configured",
      };
    }

    // Verify the seller actually owns the NFT on-chain (blockchain is source of truth)
    const ownerCheck = await getNFTOwnerOnChain(tokenId);
    if (!ownerCheck.success || !ownerCheck.owner) {
      return {
        success: false,
        error: "Failed to verify NFT ownership on blockchain",
      };
    }

    const onChainOwner = ownerCheck.owner.toLowerCase();
    const normalizedBuyerAddress = account.toLowerCase();

    // Check if buyer is trying to buy their own NFT (using blockchain owner)
    if (onChainOwner === normalizedBuyerAddress) {
      return {
        success: false,
        error:
          "You cannot buy your own NFT. You are the current owner on blockchain.",
      };
    }

    const priceInWei = parseEther(price);
    const publicClient = getPublicClient();

    // Try to use marketplace contract first (atomic swap - payment + transfer)
    if (MARKETPLACE_CONTRACT_ADDRESS && publicClient) {
      try {
        // Check if NFT is listed on marketplace
        // getListing returns: [seller, price, isActive, listedAt]
        const listing = await publicClient.readContract({
          address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: "getListing",
          args: [NFT_CONTRACT_ADDRESS as `0x${string}`, tokenId],
        });

        // listing is a tuple: [seller, price, isActive, listedAt]
        const isActive = listing[2];

        if (isActive) {
          // NFT is listed on marketplace - use marketplace contract (atomic swap)
          const hash = await walletClient.writeContract({
            address: MARKETPLACE_CONTRACT_ADDRESS as `0x${string}`,
            abi: MARKETPLACE_ABI,
            functionName: "buyNFT",
            args: [NFT_CONTRACT_ADDRESS as `0x${string}`, tokenId],
            value: priceInWei,
            account,
          });

          return {
            success: true,
            transactionHash: hash,
            transferHash: hash, // Same transaction - atomic swap
          };
        }
        // NFT is not listed on marketplace - fall through to direct transfer
        // This allows free listings (database only) but trades atomic swaps for lower cost
      } catch (marketplaceError) {
        console.warn("Marketplace purchase failed:", marketplaceError);
        // If it's a read error (listing doesn't exist), return error
        // Otherwise fall through to direct transfer for backwards compatibility
        const errorMessage =
          marketplaceError &&
          typeof marketplaceError === "object" &&
          "message" in marketplaceError
            ? String(marketplaceError.message)
            : "";

        if (
          errorMessage.includes("revert") ||
          errorMessage.includes("execution reverted")
        ) {
          return {
            success: false,
            error:
              "This NFT is not listed on the marketplace. Please ask the seller to list it on the marketplace first.",
          };
        }
        // Fall through to direct transfer for other errors
      }
    }

    // Fallback: Direct transfer (requires seller to approve buyer or transfer manually)
    // This is less ideal but works if marketplace isn't available
    const actualSellerAddress = ownerCheck.owner;

    // Check if seller has approved the buyer to transfer the NFT
    let canAutoTransfer = false;
    if (publicClient) {
      try {
        const approvalCheck = await checkNFTApproval(
          tokenId,
          actualSellerAddress,
          account,
        );

        if (approvalCheck.success && approvalCheck.isApproved) {
          canAutoTransfer = true;
        }
      } catch (error) {
        console.warn("Could not check NFT approval:", error);
      }
    }

    // Step 1: Send payment to the actual blockchain owner
    const paymentHash = await walletClient.sendTransaction({
      to: actualSellerAddress as `0x${string}`,
      value: priceInWei,
      account,
    });

    // Step 2: If buyer is approved, automatically transfer the NFT
    let transferHash: string | undefined;
    if (canAutoTransfer) {
      try {
        const transferResult = await walletClient.writeContract({
          address: NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: PIXEL_MINT_NFT_ABI,
          functionName: "safeTransferFrom",
          args: [actualSellerAddress as `0x${string}`, account, tokenId],
          account,
        });
        transferHash = transferResult;
        console.log("NFT automatically transferred after payment");
      } catch (transferError) {
        console.warn(
          "Failed to auto-transfer NFT (seller may need to transfer manually):",
          transferError,
        );
      }
    }

    const result: {
      success: boolean;
      transactionHash: string;
      transferHash?: string;
      error?: string;
    } = {
      success: true,
      transactionHash: paymentHash,
    };

    if (transferHash) {
      result.transferHash = transferHash;
    }

    return result;
  } catch (error: unknown) {
    console.error("Error buying NFT:", error);

    // Check if user rejected the transaction
    let errorMessage = "Failed to buy NFT";
    if (error && typeof error === "object") {
      // Safely extract error messages without JSON.stringify (which fails on BigInt)
      const errorMessageStr =
        ("message" in error ? String(error.message) : "") +
        ("shortMessage" in error
          ? String((error as { shortMessage: string }).shortMessage)
          : "");

      // Check for user rejection without using JSON.stringify
      if (
        errorMessageStr.toLowerCase().includes("user rejected") ||
        errorMessageStr.toLowerCase().includes("user denied") ||
        errorMessageStr.toLowerCase().includes("rejected") ||
        errorMessageStr.toLowerCase().includes("denied")
      ) {
        return {
          success: false,
          error:
            "Transaction was rejected. Please try again if you want to proceed.",
        };
      }

      // Extract error message
      if ("shortMessage" in error) {
        errorMessage = (error as { shortMessage: string }).shortMessage;
      } else if ("message" in error) {
        errorMessage = (error as { message: string }).message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get current block info
 */
export async function getCurrentBlock(): Promise<{
  success: boolean;
  blockNumber?: bigint;
  blockHash?: string;
  error?: string;
}> {
  try {
    const publicClient = getPublicClient();
    if (!publicClient) {
      return { success: false, error: "Failed to get public client" };
    }

    const blockNumber = await publicClient.getBlockNumber();

    // Try to get the block, but handle errors gracefully
    try {
      const block = await publicClient.getBlock({ blockNumber });
      return {
        success: true,
        blockNumber: block.number,
        blockHash: block.hash,
      };
    } catch (blockError: unknown) {
      console.error("Error fetching block:", blockError);
      // If we can't get the block, still return the block number
      return {
        success: true,
        blockNumber: blockNumber,
        blockHash: undefined,
      };
    }
  } catch (error: unknown) {
    console.error("Error getting current block:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Failed to get block info";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get transaction history for an NFT
 */
export async function getNFTTransactionHistory(
  contractAddress: string,
  tokenId: bigint,
): Promise<{
  success: boolean;
  transactions?: Array<{
    hash: string;
    from: string;
    to: string;
    value: string;
    blockNumber: bigint;
    timestamp: Date;
  }>;
  error?: string;
}> {
  try {
    const publicClient = getPublicClient();
    if (!publicClient) {
      return { success: false, error: "Failed to get public client" };
    }

    // This is a simplified version - in production, you'd query Transfer events
    // For now, returning empty array as we need to track this in our database
    return {
      success: true,
      transactions: [],
    };
  } catch (error: any) {
    console.error("Error getting transaction history:", error);
    return {
      success: false,
      error: error.message || "Failed to get transaction history",
    };
  }
}

/**
 * Get NFT owner from blockchain
 */
export async function getNFTOwner(
  contractAddress: string,
  tokenId: bigint,
): Promise<{ success: boolean; owner?: string; error?: string }> {
  try {
    const publicClient = getPublicClient();
    if (!publicClient) {
      return { success: false, error: "Failed to get public client" };
    }

    const owner = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: PIXEL_MINT_NFT_ABI,
      functionName: "ownerOf",
      args: [tokenId],
    });

    return {
      success: true,
      owner: getAddress(owner),
    };
  } catch (error: any) {
    console.error("Error getting NFT owner:", error);
    return {
      success: false,
      error: error.message || "Failed to get NFT owner",
    };
  }
}
