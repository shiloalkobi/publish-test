import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" };
export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ className, variant="default", ...props }, ref) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors";
  const styles = variant==="outline"
    ? "border border-gray-300 bg-white hover:bg-gray-50"
    : "bg-black text-white hover:bg-gray-800";
  return <button ref={ref} className={cn(base, styles, className)} {...props} />;
});