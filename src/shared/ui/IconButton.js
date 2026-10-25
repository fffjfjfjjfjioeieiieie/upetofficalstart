import { createElement, forwardRef } from 'react';
import { Button } from './Button.js';

const IconButton = forwardRef(function IconButton(
  { label, title, ...props },
  ref,
) {
  return createElement(Button, {
    ...props,
    'aria-label': label,
    ref,
    size: 'icon',
    title: title || label,
  });
});

IconButton.displayName = 'IconButton';

export { IconButton };
