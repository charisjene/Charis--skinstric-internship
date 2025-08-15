import React from 'react';
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Intro from './pages/Intro/Intro';
import FaceScan from './pages/FaceScan/FaceScan';
import Camera from './pages/Camera/Camera';
import Analysis from './pages/Analysis/Analysis';
import Demographics from './pages/Demographics/Demographics';


function App() {
  return (
    <BrowserRouter>
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/intro" element={<Intro />} />
        <Route path="/facescan" element={<FaceScan />} />
        <Route path="/camera" element={<Camera />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/demographics" element={<Demographics />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;