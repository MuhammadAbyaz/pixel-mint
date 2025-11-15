ALTER TABLE "nfts" DROP CONSTRAINT "nfts_collectionId_collections_id_fk";
--> statement-breakpoint
ALTER TABLE "nfts" ALTER COLUMN "collectionId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "nfts" ADD CONSTRAINT "nfts_collectionId_collections_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;