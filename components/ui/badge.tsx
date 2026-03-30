import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-red-600/10 text-red-500 border border-red-500/20",
    secondary: "border-transparent bg-white/5 text-white/70 border border-white/10",
    destructive: "border-transparent bg-red-900/20 text-red-400 border border-red-800/20",
    outline: "text-white/40 border border-white/10",
    success: "border-transparent bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
  }

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className || ""}`}
      {...props}
    />
  )
}

export { Badge }
