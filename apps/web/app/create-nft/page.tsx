import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import CreateNFTClient from "@/components/create-nft/CreateNFTClient";
import { getUserCollections } from "@/actions/collection.actions";
import { Loader } from "@/components/ui/loader";

export default async function CreateNFTPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Fetch user's collections for the dropdown
  const collections = await getUserCollections(session.user.id!);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" />
        </div>
      }
    >
      <CreateNFTClient user={session.user} collections={collections} />
    </Suspense>
  );
}
