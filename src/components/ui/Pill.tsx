import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "dark" | "ghost";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "pill-primary",
  secondary: "pill-secondary",
  dark: "pill-dark",
  ghost: "pill-ghost",
};

type PillButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  children: ReactNode;
};

export function PillButton({
  variant = "primary",
  className,
  children,
  ...rest
}: PillButtonProps) {
  return (
    <button className={cn(VARIANT_CLASS[variant], className)} {...rest}>
      {children}
    </button>
  );
}

type PillLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  children: ReactNode;
};

export function PillLink({
  variant = "primary",
  className,
  children,
  ...rest
}: PillLinkProps) {
  return (
    <Link className={cn(VARIANT_CLASS[variant], className)} {...rest}>
      {children}
    </Link>
  );
}
