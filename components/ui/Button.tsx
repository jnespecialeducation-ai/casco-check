import { type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from "react";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-light shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-200",
  accent:
    "bg-accent text-white hover:bg-accent-light shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-200",
  secondary:
    "bg-secondary text-white hover:bg-secondary-dark active:opacity-90 transition-all duration-200",
  outline:
    "border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200 active:scale-[0.98]",
  ghost:
    "text-secondary hover:bg-slate-100 active:opacity-90 transition-all duration-200",
  success:
    "bg-success text-white hover:bg-green-600 active:scale-[0.98] transition-all duration-200",
  danger:
    "bg-error text-white hover:bg-red-600 active:scale-[0.98] transition-all duration-200",
};

type BaseProps = {
  variant?: keyof typeof variants;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type AnchorProps = BaseProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

function getButtonClasses(variant: keyof typeof variants, size: keyof typeof sizeClasses, className: string) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[44px]";
  return `${base} ${variants[variant]} ${sizeClasses[size]} ${className}`;
}

export default function Button(props: ButtonProps | AnchorProps) {
  const { variant = "primary", size = "md", children, className = "", ...rest } = props;
  const cls = getButtonClasses(variant, size, className);

  if ("href" in props && props.href) {
    const { href, ...aProps } = rest as AnchorProps;
    return (
      <a href={href} className={cls} {...aProps}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
