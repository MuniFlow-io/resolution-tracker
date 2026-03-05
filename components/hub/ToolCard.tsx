import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  status: "active" | "external";
  href: string;
}

export function ToolCard({ title, description, status, href }: ToolCardProps) {
  const isExternal = status === "external";

  return (
    <Card
      className={cn(
        "space-y-4",
        isExternal ? "border-slate-200 bg-slate-50/70 opacity-90" : "border-primary-100",
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      {isExternal ? (
        <Link
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 sm:w-auto"
        >
          Open External Tool
          <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <Link
          href={href}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-primary-600 bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 sm:w-auto"
        >
          Open Tool
        </Link>
      )}
    </Card>
  );
}

