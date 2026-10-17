import { PawPrint } from "lucide-react";

export const Logo = ({ className = "" }) => (
  <span className={`flex items-center gap-2 font-display font-extrabold tracking-tight ${className}`}>
    <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-sky-300 to-sky-500 text-white shadow-[0_6px_18px_-4px_rgba(56,170,255,.7)]">
      <span className="text-base leading-none">U</span>
      <PawPrint className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 text-sky-400" fill="currentColor" />
    </span>
    <span className="text-lg">.pet</span>
  </span>
);
