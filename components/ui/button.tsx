import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-[#0F1059] text-white hover:bg-[#0F1059]/90 active:scale-95',
      secondary: 'bg-[#F8F9FA] border-[#E9ECEF] text-[#0F1059] hover:bg-[#E9ECEF] active:scale-95',
      ghost: 'bg-transparent text-[#ADB5BD] hover:bg-[#F8F9FA] hover:text-[#0F1059]',
      danger: 'bg-rose-500 text-white hover:bg-rose-600 active:scale-95',
      outline: 'bg-transparent border border-[#E9ECEF] text-[#0F1059] hover:bg-[#F8F9FA]',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-sm font-normal rounded-md',
      md: 'px-4 py-2 text-sm font-normal rounded-md',
      lg: 'px-6 py-3 text-base font-normal rounded-md',
      icon: 'p-2 rounded-md'
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center transition-all focus:outline-none focus:border-[#0F1059]/20 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
