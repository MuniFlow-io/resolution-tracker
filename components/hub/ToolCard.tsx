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
        isExternal ? "border-gray-800 bg-gray-900/50 opacity-80" : "border-gray-700",
      )}
    >
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      </div>

      {isExternal ? (
        <Link
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-100 transition-colors hover:border-gray-600 hover:bg-gray-800 sm:w-auto"
        >
          Open External Tool
          <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <Link
          href={href}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-primary-500/70 bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 sm:w-auto"
        >
          Open Tool
        </Link>
      )}
    </Card>
  );
}

