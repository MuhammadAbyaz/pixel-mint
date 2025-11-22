// Network configuration for Polygon Amoy (Testnet)
export const POLYGON_AMOY = {
  chainId: "0x13882", // 80002 in hex
  chainName: "Polygon Amoy",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-amoy.polygon.technology/"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
};

export const POLYGON_AMOY_CHAIN_ID = 80002;

// Check if user is on Polygon Amoy network
export async function isPolygonAmoyNetwork(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({
      method: "eth_chainId",
    });
    return chainId === POLYGON_AMOY.chainId;
  } catch {
    return false;
  }
}

// Switch to Polygon Amoy network
export async function switchToPolygonAmoy(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_AMOY.chainId }],
    });
    return true;
  } catch (error: any) {
    // If the chain doesn't exist, add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_AMOY],
        });
        return true;
      } catch (addError) {
        console.error("Error adding Polygon Amoy network:", addError);
        return false;
      }
    }
    console.error("Error switching to Polygon Amoy network:", error);
    return false;
  }
}

