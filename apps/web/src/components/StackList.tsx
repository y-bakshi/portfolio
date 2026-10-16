import { Badge } from '@/components/ui/badge';
import { TechLogo } from './TechLogo';

/** A project's technologies as small chips, each with its brand mark where there is one. */
export function StackList({ name, stack }: { name: string; stack: string[] }) {
  return (
    <ul aria-label={`${name} technologies`} className="flex flex-wrap gap-1.5">
      {stack.map((s) => (
        <li key={s}>
          <Badge>
            <TechLogo name={s} className="size-4" />
            {s}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
