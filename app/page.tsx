import { ToolCard } from "@/components/hub/ToolCard";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Document Hub</h1>
        <p className="mt-2 text-sm text-gray-400">
          Precision tools for municipal document workflows.
        </p>
      </header>

      <div className="space-y-4">
        <ToolCard
          title="Resolution Cleaner"
          description="Update a resolution for a new deal without rewriting any language."
          status="active"
          href="/resolution-cleaner"
        />
        <ToolCard
          title="Bond Generator"
          description="Certificate generation currently maintained in a standalone app."
          status="external"
          href="/"
        />
      </div>
    </main>
  );
}

