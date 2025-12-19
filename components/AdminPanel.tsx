
import React, { useState, useMemo } from 'react';
import { Participant, Prize, Winner, PresetWinner } from '../types';
import { Upload, Trash2, Plus, Download, X, UserMinus, HelpCircle, LayoutGrid, Building2, PartyPopper } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  participants: Participant[];
  prizes: Prize[];
  winners: Winner[];
  presets: PresetWinner[];
  activityName: string;
  companyName: string;
  setActivityName: (v: string) => void;
  setCompanyName: (v: string) => void;
  setParticipants: (p: Participant[]) => void;
  setPrizes: (p: Prize[]) => void;
  setWinners: (w: Winner[]) => void;
  setPresets: (pr: PresetWinner[]) => void;
  onReset: () => void;
  onFullReset: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  participants,
  prizes,
  winners,
  presets,
  activityName,
  companyName,
  setActivityName,
  setCompanyName,
  setParticipants,
  setPrizes,
  setWinners,
  setPresets,
  onReset,
  onFullReset
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'prizes' | 'presets' | 'winners' | 'non-winners' | 'settings'>('users');
  const [winnerTabClickCount, setWinnerTabClickCount] = useState(0);
  const [isPresetsUnlocked, setIsPresetsUnlocked] = useState(false);

  const nonWinners = useMemo(() => {
    const winnerIds = new Set(winners.map(w => w.participantId));
    return participants.filter(p => !winnerIds.has(p.id));
  }, [participants, winners]);

  const handleUserExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<any>(worksheet);

      const newParticipants: Participant[] = data.map((item, index) => ({
        id: `user-${Date.now()}-${index}-${Math.random()}`,
        name: String(item['姓名'] || item['人名'] || item.name || item.Name || Object.values(item)[0] || '').trim(),
        department: String(item['部门'] || item['单位'] || item.department || item.dept || '').trim()
      })).filter(p => p.name && p.name !== 'undefined' && p.name !== '');

      setParticipants([...participants, ...newParticipants]);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handlePrizeExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<any>(worksheet);

      const newPrizes: Prize[] = data.map((item, index) => {
        const category = String(item['奖项'] || item['奖项等级'] || item['等级'] || item.category || '未命名等级').trim();
        const name = String(item['奖品名称'] || item['奖品'] || item.name || '未命名奖品').trim();
        const count = parseInt(String(item['数量'] || item['名额'] || item.count || 1));
        
        return {
          id: `prize-${Date.now()}-${index}-${Math.random()}`,
          category: category,
          name: name,
          count: count,
          remaining: count,
          rank: parseInt(item['排序'] || item['等级排序'] || item.rank || prizes.length + index + 1)
        };
      }).filter(p => p.name && p.name !== 'undefined');

      setPrizes([...prizes, ...newPrizes]);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const addPrize = () => {
    const newPrize: Prize = {
      id: crypto.randomUUID(),
      category: '新等级',
      name: '新奖品',
      count: 1,
      remaining: 1,
      rank: prizes.length + 1
    };
    setPrizes([...prizes, newPrize]);
  };

  const updatePrize = (id: string, updates: Partial<Prize>) => {
    setPrizes(prizes.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        const wonCount = winners.filter(w => w.prizeId === id).length;
        updated.remaining = Math.max(0, updated.count - wonCount);
        return updated;
      }
      return p;
    }));
  };

  const removeWinner = (winnerId: string) => {
    const winner = winners.find(w => w.id === winnerId);
    if (!winner) return;
    setWinners(winners.filter(w => w.id !== winnerId));
    setPrizes(prizes.map(p => 
      p.id === winner.prizeId ? { ...p, remaining: p.remaining + 1 } : p
    ));
  };

  const handleWinnerTabClick = () => {
    if (activeTab === 'winners') {
        const newCount = winnerTabClickCount + 1;
        setWinnerTabClickCount(newCount);
        if (newCount >= 3) {
            setIsPresetsUnlocked(true);
        }
    } else {
        setActiveTab('winners');
        setWinnerTabClickCount(1);
    }
  };

  return (
    <div className="w-full h-full p-8 pt-20 overflow-auto bg-black/80 backdrop-blur-xl font-inter">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <h1 className="text-4xl font-orbitron font-black text-cyan-400 tracking-tighter uppercase">抽奖系统管理后台</h1>
          <div className="flex gap-3">
            <button onClick={onReset} className="px-5 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 text-xs font-orbitron hover:bg-yellow-500 hover:text-black transition-all">重置中奖结果</button>
            <button onClick={onFullReset} className="px-5 py-2 bg-red-500/10 text-red-500 border border-red-500/30 text-xs font-orbitron hover:bg-red-500 hover:text-black transition-all">清空全部数据</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 text-xs font-orbitron uppercase tracking-[0.2em] transition-all relative ${activeTab === 'users' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'}`}
          >
            人员名单
            {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400"></div>}
          </button>
          <button
            onClick={() => setActiveTab('prizes')}
            className={`pb-4 px-2 text-xs font-orbitron uppercase tracking-[0.2em] transition-all relative ${activeTab === 'prizes' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'}`}
          >
            奖项配置
            {activeTab === 'prizes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400"></div>}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-2 text-xs font-orbitron uppercase tracking-[0.2em] transition-all relative ${activeTab === 'settings' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'}`}
          >
            活动配置
            {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400"></div>}
          </button>
          <button
            onClick={handleWinnerTabClick}
            className={`pb-4 px-2 text-xs font-orbitron uppercase tracking-[0.2em] transition-all relative ${activeTab === 'winners' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'}`}
          >
            中奖名单
            {activeTab === 'winners' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400"></div>}
          </button>
          <button
            onClick={() => setActiveTab('non-winners')}
            className={`pb-4 px-2 text-xs font-orbitron uppercase tracking-[0.2em] transition-all relative ${activeTab === 'non-winners' ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'}`}
          >
            未中奖名单
            {activeTab === 'non-winners' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400"></div>}
          </button>
          {isPresetsUnlocked && (
            <button
              onClick={() => setActiveTab('presets')}
              className={`pb-4 px-2 text-xs font-orbitron uppercase tracking-[0.2em] transition-all relative text-purple-400 animate-pulse`}
            >
              内定配置
              {activeTab === 'presets' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-400"></div>}
            </button>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 p-8 rounded-xl backdrop-blur-md">
          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-orbitron text-white">活动基本配置</h3>
                <p className="text-white/40 text-sm mt-1">设置公司名称与活动标题</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Building2 size={12}/> 公司名称
                  </label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-cyan-500 rounded text-lg font-bold"
                    placeholder="公司名称"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] text-white/40 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <PartyPopper size={12}/> 活动名称
                  </label>
                  <input 
                    type="text" 
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-cyan-500 rounded text-lg font-bold"
                    placeholder="活动名称"
                  />
                </div>
              </div>
              <div className="p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                 <p className="text-cyan-400/80 text-sm italic">
                   * 设置将实时保存在抽奖主界面的背景展示中
                 </p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-orbitron text-white">参会人员名单</h3>
                  <p className="text-white/40 text-sm mt-1">共 {participants.length} 位人员</p>
                </div>
                <div className="flex gap-3">
                  <div className="group relative">
                    <button className="p-2 text-white/40 hover:text-white"><HelpCircle size={18} /></button>
                    <div className="absolute right-0 top-10 w-64 p-4 bg-zinc-900 border border-white/20 text-xs text-white/80 z-[60] invisible group-hover:visible shadow-2xl rounded-lg">
                      <p className="font-bold text-cyan-400 mb-2 underline tracking-widest">Excel 文件格式要求：</p>
                      <table className="w-full text-left border-collapse border border-white/20">
                        <thead><tr className="bg-white/10">
                          <th className="p-1.5 border border-white/20">姓名</th>
                          <th className="p-1.5 border border-white/20">部门</th>
                        </tr></thead>
                        <tbody><tr>
                          <td className="p-1.5 border border-white/20">张三</td>
                          <td className="p-1.5 border border-white/20">研发部</td>
                        </tr></tbody>
                      </table>
                      <p className="mt-2 text-white/40 italic">* 表头必须包含“姓名”</p>
                    </div>
                  </div>
                  <label className="cursor-pointer px-6 py-2.5 bg-cyan-500 text-black font-orbitron text-sm flex items-center gap-2 hover:bg-cyan-400 transition-all rounded shadow-lg shadow-cyan-500/20">
                    <Upload size={18} />
                    EXCEL 导入名单
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUserExcelUpload} />
                  </label>
                  <button onClick={() => setParticipants([])} className="px-4 py-2 bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-orbitron rounded transition-all">清空人员</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {participants.map(p => (
                  <div key={p.id} className="p-3 bg-white/5 border border-white/10 rounded flex justify-between items-center group hover:border-cyan-500/30 transition-all">
                    <div className="flex flex-col">
                      <span className="text-white font-bold">{p.name}</span>
                      <span className="text-[10px] text-white/30 uppercase tracking-widest">{p.department || '无部门'}</span>
                    </div>
                    <button onClick={() => setParticipants(participants.filter(x => x.id !== p.id))} className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-all p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'prizes' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-orbitron text-white">奖项与奖品配置</h3>
                  <p className="text-white/40 text-sm mt-1">共 {prizes.length} 个奖项</p>
                </div>
                <div className="flex gap-3">
                  <div className="group relative">
                    <button className="p-2 text-white/40 hover:text-white"><HelpCircle size={18} /></button>
                    <div className="absolute right-0 top-10 w-72 p-4 bg-zinc-900 border border-white/20 text-xs text-white/80 z-[60] invisible group-hover:visible shadow-2xl rounded-lg">
                      <p className="font-bold text-purple-400 mb-2 underline tracking-widest">Excel 文件格式要求：</p>
                      <table className="w-full text-left border-collapse border border-white/20">
                        <thead><tr className="bg-white/10">
                          <th className="p-1.5 border border-white/20">奖项</th>
                          <th className="p-1.5 border border-white/20">奖品名称</th>
                          <th className="p-1.5 border border-white/20">数量</th>
                        </tr></thead>
                        <tbody><tr>
                          <td className="p-1.5 border border-white/20">一等奖</td>
                          <td className="p-1.5 border border-white/20">iPhone 15</td>
                          <td className="p-1.5 border border-white/20">5</td>
                        </tr></tbody>
                      </table>
                      <p className="mt-2 text-white/40 italic">* 表头必须包含“奖项”、“奖品名称”及“数量”</p>
                    </div>
                  </div>
                  <label className="cursor-pointer px-6 py-2.5 bg-purple-600 text-white font-orbitron text-sm flex items-center gap-2 hover:bg-purple-500 transition-all rounded shadow-lg shadow-purple-500/20">
                    <Upload size={18} />
                    EXCEL 导入奖项
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handlePrizeExcelUpload} />
                  </label>
                  <button onClick={addPrize} className="px-6 py-2.5 bg-cyan-500 text-black font-orbitron text-sm flex items-center gap-2 hover:bg-cyan-400 transition-all rounded shadow-lg shadow-cyan-500/20">
                    <Plus size={18} />
                    添加奖项
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {prizes.sort((a,b) => a.rank - b.rank).map(prize => (
                  <div key={prize.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end p-5 bg-white/5 border border-white/10 rounded-lg group hover:bg-white/[0.08] transition-all">
                    <div className="col-span-1">
                      <label className="block text-[10px] text-white/40 uppercase mb-2 tracking-widest">奖项等级</label>
                      <input 
                        type="text" 
                        value={prize.category} 
                        onChange={e => updatePrize(prize.id, { category: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 px-4 py-2 text-white outline-none focus:border-cyan-500 rounded text-sm"
                        placeholder="一等奖"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] text-white/40 uppercase mb-2 tracking-widest">奖品名称</label>
                      <input 
                        type="text" 
                        value={prize.name} 
                        onChange={e => updatePrize(prize.id, { name: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 px-4 py-2 text-white outline-none focus:border-cyan-500 rounded text-sm"
                        placeholder="iPhone 15 Pro"
                      />
                    </div>
                    <div className="col-span-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-white/40 uppercase mb-2 tracking-widest text-center">总数</label>
                        <input 
                          type="number" 
                          value={prize.count} 
                          min={1}
                          onChange={e => updatePrize(prize.id, { count: parseInt(e.target.value) || 1 })}
                          className="w-full bg-black/40 border border-white/10 px-4 py-2 text-white text-center outline-none focus:border-cyan-500 rounded text-sm"
                        />
                      </div>
                      <div className="flex flex-col items-center">
                        <label className="block text-[10px] text-white/40 uppercase mb-2 tracking-widest">剩余</label>
                        <div className="text-xl text-cyan-400 font-black font-orbitron">{prize.remaining}</div>
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => setPrizes(prizes.filter(p => p.id !== prize.id))} className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-all">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-orbitron text-white text-purple-400">内定名单配置 (管理员模式)</h3>
                <p className="text-white/40 text-sm mt-1">关联特定人员至特定奖项。</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prizes.map(prize => {
                  const preset = presets.find(p => p.prizeId === prize.id);
                  return (
                    <div key={prize.id} className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-cyan-400 font-orbitron tracking-widest">{prize.category} - {prize.name}</h4>
                        <span className="text-[10px] text-white/20 uppercase">总名额: {prize.count}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {preset?.participantNames.map(name => (
                          <div key={name} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs rounded-full flex items-center gap-2">
                            {name}
                            <button onClick={() => setPresets(presets.map(p => p.prizeId === prize.id ? {...p, participantNames: p.participantNames.filter(n => n !== name)} : p))}><X size={12}/></button>
                          </div>
                        ))}
                      </div>
                      <select 
                        onChange={e => {
                          if (!e.target.value) return;
                          const name = e.target.value;
                          const existing = presets.find(p => p.prizeId === prize.id);
                          if (existing) {
                            if (!existing.participantNames.includes(name)) {
                              setPresets(presets.map(p => p.prizeId === prize.id ? {...p, participantNames: [...p.participantNames, name]} : p));
                            }
                          } else {
                            setPresets([...presets, { prizeId: prize.id, participantNames: [name] }]);
                          }
                          e.target.value = '';
                        }}
                        className="w-full bg-black/40 border border-white/10 p-3 text-sm text-white/60 outline-none rounded hover:border-cyan-500/50 transition-all"
                      >
                        <option value="">+ 添加内定人选...</option>
                        {participants.filter(p => !winners.some(w => w.participantId === p.id)).map(p => (
                          <option key={p.id} value={p.name}>{p.name} ({p.department || '无部门'})</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'winners' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-orbitron text-white">中奖名单记录</h3>
                  <p className="text-white/40 text-sm mt-1">共 {winners.length} 条记录</p>
                </div>
                <button 
                  onClick={() => {
                    const header = "奖项等级,奖品名称,中奖人,部门,中奖时间\n";
                    const csv = winners.map(w => `${w.prizeCategory},${w.prizeName},${w.participantName},${w.participantDepartment || ''},${new Date(w.timestamp).toLocaleString()}`).join('\n');
                    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), header + csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `年会中奖名单_${new Date().toLocaleDateString()}.csv`;
                    link.click();
                  }}
                  className="px-6 py-2.5 border border-white/20 text-white/60 hover:text-white text-xs font-orbitron flex items-center gap-2 rounded transition-all"
                >
                  <Download size={16} />
                  导出报告
                </button>
              </div>
              <div className="overflow-x-auto border border-white/10 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[10px] text-white/40 uppercase tracking-widest border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">等级/奖项</th>
                      <th className="px-6 py-4">中奖人</th>
                      <th className="px-6 py-4">部门</th>
                      <th className="px-6 py-4">时间</th>
                      <th className="px-6 py-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.sort((a,b) => b.timestamp - a.timestamp).map(w => (
                      <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-all">
                        <td className="px-6 py-4">
                          <span className="text-cyan-400 font-bold">{w.prizeCategory}</span>
                          <span className="text-white/40 ml-2">({w.prizeName})</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-white">{w.participantName}</td>
                        <td className="px-6 py-4 text-white/40">{w.participantDepartment || '-'}</td>
                        <td className="px-6 py-4 text-[10px] font-orbitron text-white/30">{new Date(w.timestamp).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => removeWinner(w.id)} className="text-red-500/50 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    {winners.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-20 text-center text-white/20 font-orbitron tracking-widest uppercase">暂无中奖记录</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'non-winners' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-orbitron text-white">未中奖人员</h3>
                  <p className="text-white/40 text-sm mt-1">共 {nonWinners.length} 位人员尚未中奖</p>
                </div>
              </div>
              <div className="overflow-x-auto border border-white/10 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[10px] text-white/40 uppercase tracking-widest border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">姓名</th>
                      <th className="px-6 py-4">部门</th>
                      <th className="px-6 py-4 text-right">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonWinners.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-all">
                        <td className="px-6 py-4 font-bold text-white">{p.name}</td>
                        <td className="px-6 py-4 text-white/40">{p.department || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 text-[10px] text-white/40 rounded border border-white/5">
                            <UserMinus size={10} /> 待抽取
                          </span>
                        </td>
                      </tr>
                    ))}
                    {nonWinners.length === 0 && (
                      <tr><td colSpan={3} className="px-6 py-20 text-center text-white/20 font-orbitron tracking-widest uppercase">全员均已中奖</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
