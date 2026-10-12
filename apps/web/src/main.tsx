import React from 'react';
import ReactDOM from 'react-dom/client';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Home from './App';
import CaseStudy from './CaseStudy';
import '@fontsource-variable/instrument-sans/wdth.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/cinzel-decorative/700.css';
import './styles/index.css';

/** A new page opens at the top, unless the link points at a section. */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/testpilot" element={<CaseStudy />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
