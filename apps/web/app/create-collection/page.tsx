import { redirect } from "next/navigation";
import { auth } from "@/auth";
import CreateCollectionClient from "@/components/create-collection/CreateCollectionClient";

export default async function CreateCollectionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  return <CreateCollectionClient user={session.user} />;
}
