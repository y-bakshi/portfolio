import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './App';
import CaseStudy from './CaseStudy';
import '@flaticon/flaticon-uicons/css/solid/rounded.css';
import '@flaticon/flaticon-uicons/css/brands/all.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects/testpilot" element={<CaseStudy />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
