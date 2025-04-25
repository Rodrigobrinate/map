import { useState } from 'react'

import { Routes, Route } from 'react-router-dom';
import './App.css'
import HomePage from './pages/HomePage/page';
import BgpStatusDisplay from './pages/Bgp/page';
import DeviceManagement from './pages/devices/page';
import VsiVisualization from './pages/map/page';
function App() {

  return (
    <>
       <main>
        <Routes>
         
          <Route path="/devices/:deviceId/vsi" element={<HomePage />} /> {/* Route for specific device's VSIs */}

          <Route path="/bgp" element={<BgpStatusDisplay />} />
          <Route path="/devices" element={<DeviceManagement />} />
          <Route path="/map" element={<VsiVisualization />} /> {/* Route for VSI visualization */}
          {/* Adicione outras rotas aqui */}
          {/* Exemplo: <Route path="/outra-rota" element={<OutraPagina />} /> */}
          {/* Adicione outras rotas aqui */}
          {/* Exemplo: <Route path="/outra-rota" element={<OutraPagina />} /> */}
          {/* Adicione outras rotas aqui */}
        </Routes>
      </main>
    </>
  )
}

export default App
