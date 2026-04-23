import * as React from "react"
import { motion } from "framer-motion"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-red-600 text-white hover:bg-red-700",
    destructive: "bg-white/5 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20",
    outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
    secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/5",
    ghost: "hover:bg-white/5 text-white/70 hover:text-white",
    link: "text-red-500 underline-offset-4 hover:underline",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-12 rounded-md px-8 text-base",
    icon: "h-9 w-9",
  }

  const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50"

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ""}`}
      ref={ref}
      {...(props as any)}
    />
  )
})
Button.displayName = "Button"

export { Button }
