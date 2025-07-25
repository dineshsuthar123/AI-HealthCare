import * as React from "react";
import { cn } from "@/lib/utils";

// Re-export InputHTMLAttributes directly without empty interface to avoid lint warnings
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        // Filter out any auto-generated attributes that might cause hydration issues
        const safeProps = { ...props };
        if (typeof window !== 'undefined') {
            // Filter out form data processor IDs which cause hydration mismatches
            Object.keys(safeProps).forEach(key => {
                if (key.startsWith('fdprocessed')) {
                    delete safeProps[key];
                }
            });
        }

        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...safeProps}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
