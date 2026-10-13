import { useEffect, useState } from 'react';

/** Phones show the conversation inside the chat; wide screens show it in the hero. */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const on = () => setIsMobile(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return isMobile;
}

/** True once the page has scrolled past the first screen. */
export function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 400);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return scrolled;
}

/**
 * Opening the bar on a wide screen makes the page end lower, to leave room for it. A visitor who is
 * at the end of the page when it opens is taken down to the new end, so the footer stays in view.
 */
export function useFollowPageEnd(open: boolean, isMobile: boolean) {
  useEffect(() => {
    if (!open || isMobile) return;
    const room =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-room')) || 0;
    const end = document.documentElement.scrollHeight - window.innerHeight;
    // the new end is `room` lower than the old one, so being within `room` of it means being at the old end
    if (end > 0 && window.scrollY >= end - room - 4)
      window.scrollTo({ top: end, behavior: 'smooth' });
  }, [open, isMobile]);
}

/**
 * On phones the on-screen keyboard shrinks the visual viewport but not the layout viewport, so a
 * fixed chat would sit behind it. While the chat is open, publish the visible area's top and height
 * as CSS variables and stop the page behind it from scrolling.
 */
export function usePinToVisualViewport(open: boolean, isMobile: boolean) {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv || !open || !isMobile) return;
    const root = document.documentElement.style;
    const update = () => {
      root.setProperty('--vvt', `${vv.offsetTop}px`);
      root.setProperty('--vvh', `${vv.height}px`);
    };
    update();
    // the full-screen chat owns the screen, so the page behind it must not scroll
    document.documentElement.classList.add('chat-open');
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.removeProperty('--vvt');
      root.removeProperty('--vvh');
      document.documentElement.classList.remove('chat-open');
    };
  }, [open, isMobile]);
}
