
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppView, Participant, Prize, Winner, PresetWinner } from './types';
import DrawView from './components/DrawView';
import AdminPanel from './components/AdminPanel';
import { Settings, Play } from 'lucide-react';

const STORAGE_KEY = 'lottery_data_v1';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOTTERY);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [presets, setPresets] = useState<PresetWinner[]>([]);
  const [currentPrizeId, setCurrentPrizeId] = useState<string>('');
  const [activityName, setActivityName] = useState<string>('年度盛典');
  const [companyName, setCompanyName] = useState<string>('科技未来有限公司');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setParticipants(data.participants || []);
        setPrizes(data.prizes || []);
        setWinners(data.winners || []);
        setPresets(data.presets || []);
        setActivityName(data.activityName || '年度盛典');
        setCompanyName(data.companyName || '科技未来有限公司');
        
        // When loading, find the smallest prize (highest rank)
        if (data.prizes && data.prizes.length > 0) {
          const sorted = [...data.prizes].sort((a: any, b: any) => b.rank - a.rank);
          setCurrentPrizeId(sorted[0].id);
        }
      } catch (e) {
        console.error("Failed to parse storage data", e);
      }
    }
  }, []);

  // Sync effect: ensure currentPrizeId is always valid if prizes exist
  useEffect(() => {
    if (prizes.length > 0) {
      const currentExists = prizes.some(p => p.id === currentPrizeId);
      if (!currentPrizeId || !currentExists) {
        // Start from smallest prize (highest rank number)
        const sorted = [...prizes].sort((a, b) => b.rank - a.rank);
        setCurrentPrizeId(sorted[0].id);
      }
    } else if (currentPrizeId !== '') {
      setCurrentPrizeId('');
    }
  }, [prizes, currentPrizeId]);

  // Save to local storage
  useEffect(() => {
    const data = { participants, prizes, winners, presets, activityName, companyName };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [participants, prizes, winners, presets, activityName, companyName]);

  const handleReset = useCallback(() => {
    if (window.confirm("确定要重置所有抽奖结果吗？名单和奖品配置将保留。")) {
      setWinners([]);
      setPrizes(prev => prev.map(p => ({ ...p, remaining: p.count })));
    }
  }, []);

  const handleFullReset = useCallback(() => {
    if (window.confirm("警告：确定要清空所有数据（包括名单、奖品和中奖记录）吗？")) {
      setParticipants([]);
      setPrizes([]);
      setWinners([]);
      setPresets([]);
      setCurrentPrizeId('');
      setActivityName('年度盛典');
      setCompanyName('科技未来有限公司');
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-inter">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Navigation Layer */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setView(view === AppView.LOTTERY ? AppView.ADMIN : AppView.LOTTERY)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/20 transition-all border border-white/10"
          title={view === AppView.LOTTERY ? "后台配置" : "返回抽奖"}
        >
          {view === AppView.LOTTERY ? <Settings size={20} /> : <Play size={20} />}
        </button>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 w-full h-screen">
        {view === AppView.LOTTERY ? (
          <DrawView 
            participants={participants}
            prizes={prizes}
            winners={winners}
            presets={presets}
            currentPrizeId={currentPrizeId}
            activityName={activityName}
            companyName={companyName}
            onSetCurrentPrize={setCurrentPrizeId}
            onWinnerFound={(winner) => {
              setWinners(prev => [...prev, winner]);
              setPrizes(prev => prev.map(p => 
                p.id === winner.prizeId ? { ...p, remaining: p.remaining - 1 } : p
              ));
            }}
          />
        ) : (
          <AdminPanel 
            participants={participants}
            prizes={prizes}
            winners={winners}
            presets={presets}
            activityName={activityName}
            companyName={companyName}
            setActivityName={setActivityName}
            setCompanyName={setCompanyName}
            setParticipants={setParticipants}
            setPrizes={setPrizes}
            setWinners={setWinners}
            setPresets={setPresets}
            onReset={handleReset}
            onFullReset={handleFullReset}
          />
        )}
      </main>
    </div>
  );
};

export default App;
