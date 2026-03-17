import type { ReactNode } from "react";

export const Alert = ({
  children,
  variant = "error"
}: {
  children: ReactNode;
  variant?: "error" | "info" | "success";
}) => {
  const palette =
    variant === "success"
      ? "alert-success"
      : variant === "info"
        ? "alert-info"
        : "alert-error";

  return (
    <div
      className={`alert-shell soft-ring rounded-[1.5rem] border px-4 py-3 text-sm ${palette}`.trim()}
    >
      {children}
    </div>
  );
};
