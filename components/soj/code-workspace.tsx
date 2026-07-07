type CodeWorkspaceProps = {
  language: string;
  value?: string;
};

export function CodeWorkspace({ language, value = "" }: CodeWorkspaceProps) {
  return (
    <section className="overflow-hidden rounded-[18px_6px_14px_6px] border border-soj-line/58 bg-soj-bg-raised/78 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
      <div className="flex items-center justify-between border-b border-soj-line/55 px-4 py-2">
        <h2 className="text-sm font-medium text-soj-text">Code workspace</h2>
        <span className="font-mono text-xs text-soj-muted">{language}</span>
      </div>
      <pre className="min-h-64 overflow-auto bg-soj-bg/24 p-4 font-mono text-sm leading-6 text-soj-muted">
        <code>{value || "// Editor integration lands in the workspace slice."}</code>
      </pre>
    </section>
  );
}
