import type { ComponentProps, ElementType } from 'react';
import { cn } from '@/lib/cn';

type ContainerProps<T extends ElementType> = { as?: T } & Omit<ComponentProps<T>, 'as'>;

/** The page column: as wide as the design allows, with the shared side gutter. */
export function Container<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Tag: ElementType = as ?? 'div';
  return (
    <Tag className={cn('mx-auto w-full max-w-[1240px] px-(--gutter)', className)} {...props} />
  );
}
