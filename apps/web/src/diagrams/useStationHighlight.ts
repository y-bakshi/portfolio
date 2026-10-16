import { useCallback, type RefObject } from 'react';

/** Marks one station (and its step in the list) as the one being pointed at, or none. Written straight onto the DOM. */
export function useStationHighlight(root: RefObject<HTMLElement | null>) {
  return useCallback(
    (id: string | null) => {
      root.current
        ?.querySelectorAll<HTMLElement | SVGElement>('[data-station], [data-step]')
        .forEach((el) => {
          const mine = el.dataset.station ?? el.dataset.step;
          if (id !== null && mine === id) el.setAttribute('data-active', '');
          else el.removeAttribute('data-active');
        });
    },
    [root],
  );
}
