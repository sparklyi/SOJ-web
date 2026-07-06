type CodeWorkspaceProps = {
  language: string;
  value?: string;
};

export function CodeWorkspace({ language, value = "" }: CodeWorkspaceProps) {
  return (
    <section className="overflow-hidden rounded-soj-lg border border-soj-line bg-soj-bg-raised">
      <div className="flex items-center justify-between border-b border-soj-line px-4 py-2">
        <h2 className="text-sm font-medium text-soj-text">Code workspace</h2>
        <span className="font-mono text-xs text-soj-muted">{language}</span>
      </div>
      <pre className="min-h-64 overflow-auto p-4 font-mono text-sm leading-6 text-soj-muted">
        <code>{value || "// Editor integration lands in the workspace slice."}</code>
      </pre>
    </section>
  );
}
