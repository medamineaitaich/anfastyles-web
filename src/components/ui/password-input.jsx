import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

const PasswordInput = React.forwardRef(({ className, wrapperClassName, ...props }, ref) => {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative ${wrapperClassName || ''}`}>
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        className={`${className || ''} pr-10`}
        {...props}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-1 flex items-center px-2 text-muted-foreground hover:text-foreground"
        onClick={() => setShow((prev) => !prev)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
