import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  children: ReactNode;
};

export const Button = ({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) => {
  const baseClassName =
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const variantClassName =
    variant === "primary"
      ? "action-primary hover:shadow-[0_24px_44px_rgba(15,23,42,0.2)]"
      : "action-secondary";

  return (
    <button
      className={`${baseClassName} ${variantClassName} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
