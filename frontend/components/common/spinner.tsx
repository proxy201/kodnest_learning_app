export const Spinner = ({ label = "Loading..." }: { label?: string }) => (
  <div className="flex items-center gap-3 text-sm font-medium text-ink/70">
    <span className="spinner-ring h-4 w-4 animate-spin rounded-full border-2 border-ink/20" />
    <span>{label}</span>
  </div>
);
