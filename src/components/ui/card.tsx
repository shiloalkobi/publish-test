import * as React from "react";
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["rounded-lg border bg-white", className].filter(Boolean).join(" ")} {...props} />;
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["p-4 border-b", className].filter(Boolean).join(" ")} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={["font-semibold text-lg", className].filter(Boolean).join(" ")} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["p-4", className].filter(Boolean).join(" ")} {...props} />;
}
export default Card;
