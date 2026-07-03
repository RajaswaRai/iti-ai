import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";

export default function EmptyState({ icon = <FolderOpen className="h-8 w-8 text-neutral-400" />, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-neutral-50 p-3" aria-hidden="true">
        {icon}
      </div>
      <p className="text-sm font-medium text-neutral-500">{text}</p>
    </div>
  );
}