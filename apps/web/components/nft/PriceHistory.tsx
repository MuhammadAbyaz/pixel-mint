"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getPriceHistory } from "@/actions/nft.actions";
import { Loader } from "@/components/ui/loader";

type PriceHistoryProps = {
  nftId: string;
};

type PriceDataPoint = {
  price: number;
  date: Date;
  type: "listing" | "sale";
  transactionHash?: string | null;
  sellerAddress?: string | null;
  buyerAddress?: string | null;
  blockNumber?: number | null;
  blockHash?: string | null;
};

export default function PriceHistory({ nftId }: PriceHistoryProps) {
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setIsLoading(true);
        const history = await getPriceHistory(nftId);
        setPriceHistory(history);
      } catch (error) {
        console.error("Error fetching price history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (nftId) {
      fetchPriceHistory();
    }
  }, [nftId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Chart Skeleton */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-xl blur-xl" />
          <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-center h-[350px]">
              <div className="flex flex-col items-center gap-4">
                <Loader className="w-8 h-8 border-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Loading price history...
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Loading Transactions Skeleton */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-xl blur-xl" />
          <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
            <div className="h-8 w-48 bg-muted/50 rounded-lg animate-pulse mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-muted/30 rounded-lg p-4 h-20 animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-xl blur-xl" />
        <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-12 shadow-lg">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No Price History Yet
              </h3>
              <p className="text-sm text-muted-foreground">
                This NFT hasn&apos;t been listed or sold yet. Price history will
                appear here once transactions occur.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format data for chart - use consistent formatting to avoid hydration issues
  const chartData = priceHistory.map((point) => {
    const dateObj = new Date(point.date);
    // Use consistent date formatting that works on both server and client
    const formattedDate =
      typeof window !== "undefined"
        ? dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

    return {
      date: formattedDate,
      price: point.price,
      fullDate: dateObj.toISOString(),
      type: point.type,
    };
  });

  return (
    <div className="space-y-6">
      {/* Chart Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-xl blur-xl" />
        <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.35}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                dy={10}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                dx={-10}
                tickFormatter={(value) => `${value} POL`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg shadow-xl p-4 backdrop-blur-sm">
                        <p className="text-sm font-semibold text-foreground mb-2">
                          {data.date}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {data.price} POL
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">
                          {data.type}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{
                  fill: "var(--card)",
                  stroke: "var(--primary)",
                  strokeWidth: 3,
                  r: 6,
                }}
                activeDot={{
                  fill: "var(--primary)",
                  stroke: "var(--card)",
                  strokeWidth: 3,
                  r: 8,
                }}
                repeatCount={0}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction List */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-xl blur-xl" />
        <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Transaction History
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {priceHistory.map((point, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-muted/50 to-muted/30 hover:from-muted hover:to-muted/50 border border-border/50 rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          point.type === "sale"
                            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                            : "bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 text-foreground"
                        }`}
                      >
                        {point.type === "sale" ? "💰 Sale" : "📋 Listed"}
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {point.price} POL
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        {typeof window !== "undefined"
                          ? new Date(point.date).toLocaleString()
                          : new Date(point.date)
                              .toISOString()
                              .slice(0, 16)
                              .replace("T", " ")}
                      </span>
                    </div>
                    {point.transactionHash && (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${point.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors group-hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        View on PolygonScan
                      </a>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        point.type === "sale"
                          ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                          : "bg-muted-foreground/50"
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
