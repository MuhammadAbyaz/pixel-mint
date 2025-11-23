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
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No price history available yet</p>
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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Price History</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: "currentColor" }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: "currentColor" }}
            label={{
              value: "Price (POL)",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "currentColor" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number) => [`${value} POL`, "Price"]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4, fill: "hsl(var(--primary))" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Transaction List */}
      <div className="space-y-2 mt-4">
        <h4 className="text-sm font-semibold text-foreground">
          Transaction History
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {priceHistory.map((point, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      point.type === "sale"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {point.type === "sale" ? "Sale" : "Listed"}
                  </span>
                  <span className="text-foreground font-semibold">
                    {point.price} POL
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {typeof window !== "undefined"
                    ? new Date(point.date).toLocaleString()
                    : new Date(point.date)
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")}
                </p>
                {point.transactionHash && (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${point.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-1 block"
                  >
                    View on Polygonscan
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
