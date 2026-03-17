import { type ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full border-collapse border border-slate-200 rounded-xl overflow-hidden">
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="bg-slate-100">{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="border-b border-slate-200 hover:bg-slate-50">{children}</tr>;
}

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700">
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`border border-slate-200 px-4 py-3 text-sm text-slate-600 ${className}`}>
      {children}
    </td>
  );
}
