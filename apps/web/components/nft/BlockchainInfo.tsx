"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { getCurrentBlock } from "@/lib/blockchain";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader } from "@/components/ui/loader";

type BlockchainInfoProps = {
  transactionHash?: string | null;
  contractAddress?: string | null;
  tokenId?: string | null;
  blockHash?: string | null;
  blockNumber?: number | null;
};

export default function BlockchainInfo({
  transactionHash,
  contractAddress,
  tokenId,
  blockHash,
  blockNumber,
}: BlockchainInfoProps) {
  const [currentBlock, setCurrentBlock] = useState<{
    blockNumber?: bigint;
    blockHash?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentBlock = async () => {
      try {
        setIsLoading(true);
        const result = await getCurrentBlock();
        if (result.success) {
          setCurrentBlock({
            blockNumber: result.blockNumber,
            blockHash: result.blockHash,
          });
        } else {
          // Silently fail - don't show error to user, just don't display current block
          console.warn("Could not fetch current block:", result.error);
        }
      } catch (error) {
        // Silently fail - don't show error to user
        console.error("Error fetching current block:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentBlock();
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Blockchain Info</h3>

      {/* Current Block Info */}
      <div className="bg-muted rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Block</span>
          {isLoading ? (
            <Loader />
          ) : currentBlock ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-foreground">
                #{currentBlock.blockNumber?.toString()}
              </span>
              {currentBlock.blockHash && (
                <button
                  onClick={() =>
                    copyToClipboard(currentBlock.blockHash!, "currentBlockHash")
                  }
                  className="p-1 hover:bg-background rounded transition-colors"
                  title="Copy block hash"
                >
                  {copiedField === "currentBlockHash" ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Unable to fetch</span>
          )}
        </div>

        {currentBlock?.blockHash && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Block Hash</span>
            <div className="flex items-center gap-2">
              <a
                href={`https://amoy.polygonscan.com/block/${currentBlock.blockHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                {formatHash(currentBlock.blockHash)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* NFT Blockchain Details */}
      {(transactionHash || contractAddress || tokenId || blockHash || blockNumber) && (
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">NFT Details</h4>

          {contractAddress && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Contract Address</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://amoy.polygonscan.com/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                >
                  {formatAddress(contractAddress)}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => copyToClipboard(contractAddress, "contract")}
                  className="p-1 hover:bg-background rounded transition-colors"
                  title="Copy contract address"
                >
                  {copiedField === "contract" ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}

          {tokenId && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Token ID</span>
              <span className="text-xs font-mono text-foreground">{tokenId}</span>
            </div>
          )}

          {transactionHash && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Transaction Hash</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://amoy.polygonscan.com/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                >
                  {formatHash(transactionHash)}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => copyToClipboard(transactionHash, "txHash")}
                  className="p-1 hover:bg-background rounded transition-colors"
                  title="Copy transaction hash"
                >
                  {copiedField === "txHash" ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}

          {blockNumber && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Block Number</span>
              <a
                href={`https://amoy.polygonscan.com/block/${blockNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                #{blockNumber}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {blockHash && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Block Hash</span>
              <div className="flex items-center gap-2">
                <a
                  href={`https://amoy.polygonscan.com/block/${blockHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
                >
                  {formatHash(blockHash)}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => copyToClipboard(blockHash, "blockHash")}
                  className="p-1 hover:bg-background rounded transition-colors"
                  title="Copy block hash"
                >
                  {copiedField === "blockHash" ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!transactionHash && !contractAddress && !tokenId && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <p>No blockchain data available</p>
          <p className="text-xs mt-1">This NFT hasn't been minted on blockchain yet</p>
        </div>
      )}
    </div>
  );
}

