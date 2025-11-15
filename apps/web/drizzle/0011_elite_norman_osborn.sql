CREATE TABLE "nft_likes" (
	"userId" text NOT NULL,
	"nftId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nft_likes" ADD CONSTRAINT "nft_likes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nft_likes" ADD CONSTRAINT "nft_likes_nftId_nfts_id_fk" FOREIGN KEY ("nftId") REFERENCES "public"."nfts"("id") ON DELETE cascade ON UPDATE no action;