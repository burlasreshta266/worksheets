import { useState } from 'react'
import './App.css'
import Home from './pages/Home.jsx'
import PdfPage from './pages/PdfPage.jsx'
import { BrowserRouter, Routes, Route, Link } from "react-router-dom"

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pdf" element={<PdfPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
