CREATE TABLE "nft_sales" (
	"id" text PRIMARY KEY NOT NULL,
	"nftId" text NOT NULL,
	"sellerAddress" text NOT NULL,
	"buyerAddress" text NOT NULL,
	"price" numeric(20, 8) NOT NULL,
	"transactionHash" text NOT NULL,
	"blockNumber" integer,
	"blockHash" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nft_sales" ADD CONSTRAINT "nft_sales_nftId_nfts_id_fk" FOREIGN KEY ("nftId") REFERENCES "public"."nfts"("id") ON DELETE cascade ON UPDATE no action;