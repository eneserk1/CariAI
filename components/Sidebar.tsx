
import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Ana Sayfa' },
    { id: 'chat', label: 'Yapay Zeka (Yaz-Sor)' },
    { id: 'customers', label: 'Müşterilerim' },
    { id: 'products', label: 'Mallarım & Stok' },
    { id: 'transactions', label: 'Naptım? (Kayıtlar)' },
  ];

  return (
    <div className="w-72 h-screen bg-white text-slate-900 flex flex-col fixed left-0 top-0 z-20 border-r border-slate-200 shadow-sm">
      <div className="p-10">
        <h1 className="text-3xl font-black tracking-tight text-emerald-600">CariAI</h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">Kolay Takip Paneli</p>
      </div>
      
      <nav className="flex-1 px-6 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-6 py-5 rounded-2xl transition-all text-lg font-bold border-2 ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200' 
                : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-8 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Yardım</p>
          <p className="text-sm text-slate-600">Takıldığın yerde Yapay Zeka'ya sor.</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
