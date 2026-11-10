import React, { useState, useEffect } from 'react';
import {
  Plant,
  CircleDashed,
  Flask,
  Robot
} from '@phosphor-icons/react';

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
    'GH-1': { name: 'Greenhouse Sakura (Ciwidey)', matang: 11, mengkal: 13, mentah: 8, sehat: 27, sakit: 5, total_fruits: 32 },
    'GH-2': { name: 'Greenhouse Maribaya (Lembang)', matang: 10, mengkal: 14, mentah: 8, sehat: 25, sakit: 7, total_fruits: 32 },
    'GH-3': { name: 'Greenhouse Cisondari (Pasirjambu)', matang: 7, mengkal: 9, mentah: 16, sehat: 22, sakit: 10, total_fruits: 32 }
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
  { id: 'GH-1', name: 'Greenhouse Sakura (Ciwidey)', total_trees: 32, total_fruits: 32, rows: 4, plants_per_row: 8 },
  { id: 'GH-2', name: 'Greenhouse Maribaya (Lembang)', total_trees: 32, total_fruits: 32, rows: 4, plants_per_row: 8 },
  { id: 'GH-3', name: 'Greenhouse Cisondari (Pasirjambu)', total_trees: 32, total_fruits: 32, rows: 4, plants_per_row: 8 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('kematangan'); // 'kematangan', 'penyakit', or 'simulator'
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [greenhouses, setGreenhouses] = useState(DEFAULT_GREENHOUSES);
  const [selectedFruit, setSelectedFruit] = useState(null);
  const [selectedTree, setSelectedTree] = useState(null);
  const [positionsModalData, setPositionsModalData] = useState(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(err => console.log('Stats note:', err));

    fetch('/api/greenhouses')
      .then(res => res.json())
      .then(d => { if (d.success) setGreenhouses(d.data); })
      .catch(err => console.log('Greenhouses note:', err));
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'inherit' }}>
      {/* Top Header & Simple Nav */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Logo / Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              backgroundColor: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Plant size={20} weight="bold" />
            </div>
            <div>
              <strong style={{ fontSize: '1.05rem', color: '#1B2A22', display: 'block', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
                Codingtani
              </strong>
              <small style={{ fontSize: '0.74rem', color: '#52665A' }}>
                Pantau kebun, panen tepat waktu.
              </small>
            </div>
          </div>

          {/* Simple Tab Navigation */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#EDF2EC',
            padding: '0.25rem',
            borderRadius: '0.6rem',
            gap: '0.25rem'
          }}>
            <button
              onClick={() => setActiveTab('kematangan')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'kematangan' ? 700 : 500,
                color: activeTab === 'kematangan' ? '#166534' : '#52665A',
                backgroundColor: activeTab === 'kematangan' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '0.45rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'kematangan' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <CircleDashed size={16} weight={activeTab === 'kematangan' ? 'bold' : 'regular'} />
              <span>Tingkat Kematangan</span>
            </button>

            <button
              onClick={() => setActiveTab('penyakit')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'penyakit' ? 700 : 500,
                color: activeTab === 'penyakit' ? '#B91C1C' : '#52665A',
                backgroundColor: activeTab === 'penyakit' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '0.45rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'penyakit' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Plant size={16} weight={activeTab === 'penyakit' ? 'bold' : 'regular'} />
              <span>Kesehatan Daun</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                fontWeight: activeTab === 'simulator' ? 700 : 500,
                color: activeTab === 'simulator' ? '#166534' : '#52665A',
                backgroundColor: activeTab === 'simulator' ? '#ffffff' : 'transparent',
                border: 'none',
                borderRadius: '0.45rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'simulator' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Flask size={16} weight={activeTab === 'simulator' ? 'bold' : 'regular'} />
              <span>Uji Kamera</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.25rem 1rem 3rem 1rem' }}>
        {activeTab === 'kematangan' && (
          <Kematangan
            greenhouses={greenhouses}
            stats={stats}
            onSelectFruit={handleOpenFruit}
            onOpenPositionsModal={setPositionsModalData}
          />
        )}

        {activeTab === 'penyakit' && (
          <Penyakit
            greenhouses={greenhouses}
            stats={stats}
            onSelectTree={handleOpenTree}
            onOpenPositionsModal={setPositionsModalData}
          />
        )}

        {activeTab === 'simulator' && (
          <Simulator />
        )}
      </main>

      {/* Modals */}
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
