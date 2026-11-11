import React, { useState, useEffect } from 'react';
import {
  Plant,
  CircleDashed,
  Flask,
  Robot
} from '@phosphor-icons/react';

import Sidebar from './components/Sidebar.jsx';
import TopHeader from './components/TopHeader.jsx';

import Kematangan from './pages/Kematangan.jsx';
import Penyakit from './pages/Penyakit.jsx';
import Simulator from './pages/Simulator.jsx';

import FruitModal from './components/FruitModal.jsx';
import DiseaseModal from './components/DiseaseModal.jsx';
import PositionsModal from './components/PositionsModal.jsx';

const DEFAULT_STATS = {
  total_fruits: 96,
  total_trees: 96,
  ripeness: { matang: 28, mengkal: 36, mentah: 32 },
  disease: { sehat: 74, sakit: 22 },
  gh_distribution: {
    'GH-1': { name: 'Kebun Sakura (Ciwidey)', matang: 11, mengkal: 13, mentah: 8, sehat: 27, sakit: 5, total_fruits: 32 },
    'GH-2': { name: 'Kebun Maribaya (Lembang)', matang: 10, mengkal: 14, mentah: 8, sehat: 25, sakit: 7, total_fruits: 32 },
    'GH-3': { name: 'Kebun Cisondari (Pasirjambu)', matang: 7, mengkal: 9, mentah: 16, sehat: 22, sakit: 10, total_fruits: 32 }
  },
  rokae_robot: {
    model: 'ROKAE XMS5-R800-W4G3B4C',
    end_effector: 'Kamera Vision (Flange Eye-in-Hand)',
    ip: '192.168.2.160',
    port: 502,
    modbus_register: 'datacam',
    modbus_address: 67
  }
};

const DEFAULT_GREENHOUSES = [
  { id: 'GH-1', name: 'Kebun Sakura (Ciwidey)', total_trees: 32, total_fruits: 32, rows: 4, plants_per_row: 8 },
  { id: 'GH-2', name: 'Kebun Maribaya (Lembang)', total_trees: 32, total_fruits: 32, rows: 4, plants_per_row: 8 },
  { id: 'GH-3', name: 'Kebun Cisondari (Pasirjambu)', total_trees: 32, total_fruits: 32, rows: 4, plants_per_row: 8 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('kematangan'); // 'kematangan', 'penyakit', or 'simulator'
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [greenhouses, setGreenhouses] = useState(DEFAULT_GREENHOUSES);
  const [selectedFruit, setSelectedFruit] = useState(null);
  const [selectedTree, setSelectedTree] = useState(null);
  const [positionsModalData, setPositionsModalData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = () => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(err => console.log('Stats note:', err));

    fetch('/api/greenhouses')
      .then(res => res.json())
      .then(d => { if (d.success) setGreenhouses(d.data); })
      .catch(err => console.log('Greenhouses note:', err));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenFruit = (fruitId) => {
    fetch(`/api/fruit/${fruitId}`)
      .then(res => res.json())
      .then(d => { if (d.success) setSelectedFruit(d.data); })
      .catch(err => console.log('Fruit detail error:', err));
  };

  const handleOpenTree = (treeId) => {
    fetch(`/api/tree/${treeId}`)
      .then(res => res.json())
      .then(d => { if (d.success) setSelectedTree(d.data); })
      .catch(err => console.log('Tree detail error:', err));
  };

  return (
    <div className="dashboard-layout">
      {/* 1. Left Sidebar (Donezo Modern Style) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onOpenPositionsModal={setPositionsModalData}
      />

      {/* 2. Main Area (Top Header + Bento Content) */}
      <div className="dashboard-main-area">
        <TopHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={refreshData}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
        />

        {/* Content Container */}
        <main style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1.5rem 1.25rem 4.5rem 1.25rem',
          boxSizing: 'border-box'
        }}>
          {activeTab === 'kematangan' && (
            <Kematangan
              greenhouses={greenhouses}
              stats={stats}
              onSelectFruit={handleOpenFruit}
              onOpenPositionsModal={setPositionsModalData}
              onNavigateTab={setActiveTab}
              globalSearchQuery={searchQuery}
            />
          )}

          {activeTab === 'penyakit' && (
            <Penyakit
              greenhouses={greenhouses}
              stats={stats}
              onSelectTree={handleOpenTree}
              onOpenPositionsModal={setPositionsModalData}
              onNavigateTab={setActiveTab}
              globalSearchQuery={searchQuery}
            />
          )}

          {activeTab === 'simulator' && (
            <Simulator />
          )}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar (Preserved for Mobile Touch) */}
      <nav className="mobile-bottom-nav" aria-label="Navigasi Bawah Mobile">
        <button
          onClick={() => setActiveTab('kematangan')}
          className={`mobile-nav-item ${activeTab === 'kematangan' ? 'active' : ''}`}
        >
          <CircleDashed size={20} weight={activeTab === 'kematangan' ? 'bold' : 'regular'} />
          <span>Kematangan</span>
          <div className="nav-indicator" />
        </button>

        <button
          onClick={() => setActiveTab('penyakit')}
          className={`mobile-nav-item ${activeTab === 'penyakit' ? 'active-penyakit' : ''}`}
        >
          <Plant size={20} weight={activeTab === 'penyakit' ? 'bold' : 'regular'} />
          <span>Penyakit Daun</span>
          <div className="nav-indicator" />
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`mobile-nav-item ${activeTab === 'simulator' ? 'active' : ''}`}
        >
          <Flask size={20} weight={activeTab === 'simulator' ? 'bold' : 'regular'} />
          <span>Akuisisi Citra</span>
          <div className="nav-indicator" />
        </button>
      </nav>

      {/* 4. Modals */}
      {selectedFruit && (
        <FruitModal
          fruit={selectedFruit}
          onClose={() => setSelectedFruit(null)}
        />
      )}

      {selectedTree && (
        <DiseaseModal
          tree={selectedTree}
          onClose={() => setSelectedTree(null)}
          onViewFruit={handleOpenFruit}
        />
      )}

      {positionsModalData && (
        <PositionsModal
          data={positionsModalData}
          onClose={() => setPositionsModalData(null)}
          onSelectFruit={handleOpenFruit}
          onSelectTree={handleOpenTree}
        />
      )}
    </div>
  );
}
