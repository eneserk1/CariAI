
import React from 'react';
import { BusinessProfile } from '../types';

interface ProfileProps {
  profile: BusinessProfile;
}

const Profile: React.FC<ProfileProps> = ({ profile }) => {
  return (
    <div className="max-w-3xl mx-auto page-transition space-y-8">
      <div className="flex items-center space-x-6 mb-8">
        <div className="w-24 h-24 bg-[#1A237E] rounded-[30px] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-900/20">
          {profile.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{profile.name}</h2>
          <p className="text-slate-500 font-medium mt-1">{profile.sector} • {profile.ownerName}</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <h3 className="text-xl font-black text-slate-900">İşletme Bilgileri</h3>
            <button className="px-6 py-2 bg-slate-50 text-slate-900 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors">Düzenle</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sahibi</p>
                <p className="text-lg font-bold text-slate-900">{profile.ownerName}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sektör</p>
                <p className="text-lg font-bold text-slate-900">{profile.sector}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vergi Dairesi / No</p>
                <p className="text-lg font-bold text-slate-900">{profile.taxOffice || '-'} / {profile.taxNumber || '-'}</p>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefon</p>
                <p className="text-lg font-bold text-slate-900">{profile.phone}</p>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adres</p>
                <p className="text-lg font-bold text-slate-900">{profile.address}</p>
            </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-[#1A237E] rounded-[32px] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-center">
             <div>
                 <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">ABONELİK DURUMU</p>
                 <p className="text-2xl font-black tracking-tight">DefterAI Pro Paket</p>
                 <p className="text-blue-200 text-sm mt-1">Yenileme: 12.12.2025</p>
             </div>
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                 <span className="text-xl">💎</span>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
