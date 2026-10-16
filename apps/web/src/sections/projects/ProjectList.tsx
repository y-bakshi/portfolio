import { useState } from 'react';
import { ProjectRow } from '@/components/ProjectRow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { projects, type Category } from '../../content';
import { useGuideContext } from '../../Guide';

type Filter = 'all' | Category;

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All projects' },
  { id: 'backend', label: 'Backend' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'ai', label: 'AI' },
  { id: 'systems', label: 'Systems' },
];

/** Every project, filtered by the tab chosen. */
export function ProjectList() {
  const { marked } = useGuideContext();
  const [filter, setFilter] = useState<Filter>('all');
  const shown = projects.filter((p) => filter === 'all' || p.categories.includes(filter));
  return (
    <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
      <TabsList
        aria-label="Filter projects"
        variant="line"
        className="h-auto flex-wrap gap-2 group-data-[orientation=horizontal]/tabs:h-auto"
      >
        {filters.map((f) => (
          <TabsTrigger
            key={f.id}
            value={f.id}
            className="h-10 flex-none rounded-md px-4 text-base text-ink data-[state=active]:bg-ink! after:hidden data-[state=active]:text-panel! data-[state=active]:shadow-[3px_3px_0_var(--color-mark)]"
          >
            {f.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={filter} className="mt-6" aria-live="polite">
        {shown.map((p) => (
          <ProjectRow key={p.id} p={p} marked={marked} />
        ))}
      </TabsContent>
    </Tabs>
  );
}
