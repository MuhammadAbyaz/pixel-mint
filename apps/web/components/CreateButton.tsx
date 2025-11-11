import { Plus } from "lucide-react";
import Link from "next/link";

export default function FloatingCreateButton() {
  return (
    <Link
      href="/create-collection"
      className="fixed bottom-8 right-8 bg-[#037ae5] hover:bg-[#0267c7] text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl z-50 group"
    >
      <Plus className="w-6 h-6" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Create Collection
      </span>
    </Link>
  );
}
