import React from 'react';
import './App.css'
import { BrowserRouter } from 'react-router-dom';
import Nav from './Nav'; 
import Landing from './Landing';
import Footer from './Footer';


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Nav />
        <Landing />
        

      </div>
    </BrowserRouter>
  );
}

export default App;