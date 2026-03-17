import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border px-4 py-3 text-slate-800 placeholder-slate-400 
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary 
          transition-colors duration-200 min-h-[44px]
          ${error ? "border-error focus:ring-error/20 focus:border-error" : "border-slate-300"}
          ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
