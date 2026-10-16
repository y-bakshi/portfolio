import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { Slot } from 'radix-ui';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium whitespace-nowrap [&>svg]:size-4',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-ink text-panel',
        outline: 'border-line bg-panel/70 text-ink',
      },
    },
    defaultVariants: {
      variant: 'outline',
    },
  },
);

function Badge({
  className,
  variant = 'outline',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
