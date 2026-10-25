import { createElement, forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from './cn.js';

const visuallyHiddenClassName = 'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)] [clip-path:inset(50%)]';

const VisuallyHidden = forwardRef(function VisuallyHidden(
  { asChild = false, className, ...props },
  ref,
) {
  return createElement(asChild ? Slot : 'span', {
    ...props,
    className: cn(visuallyHiddenClassName, className),
    ref,
  });
});

VisuallyHidden.displayName = 'VisuallyHidden';

export { VisuallyHidden, visuallyHiddenClassName };
