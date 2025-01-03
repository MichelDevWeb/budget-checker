import * as React from "react";
import { useState } from "react";

import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [isActive, setIsActive] = useState(false);

    return (
      <div 
        className={`input-container ${isActive ? 'active' : ''}`}
        onTouchStart={() => setIsActive(true)}
        onMouseDown={() => setIsActive(true)}
      >
        <input
          type={type}
          autoFocus={false}
          readOnly={!isActive} // Prevent keyboard until container is touched
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
