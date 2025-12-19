
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppView, Participant, Prize, Winner, PresetWinner } from './types';
import DrawView from './components/DrawView';
import AdminPanel from './components/AdminPanel';
import { Settings, Play } from 'lucide-react';

const STORAGE_KEY = 'lottery_data_v1';

// 预设的测试数据
const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: '张伟', department: '研发部' },
  { id: 'p2', name: '王芳', department: '产品部' },
  { id: 'p3', name: '李静', department: '运营部' },
  { id: 'p4', name: '刘洋', department: '行政部' },
  { id: 'p5', name: '陈杰', department: '市场部' },
  { id: 'p6', name: '杨丽', department: '研发部' },
  { id: 'p7', name: '赵刚', department: '产品部' },
  { id: 'p8', name: '黄勇', department: '运营部' },
  { id: 'p9', name: '周明', department: '行政部' },
  { id: 'p10', name: '胡军', department: '市场部' },
  { id: 'p11', name: '朱波', department: '研发部' },
  { id: 'p12', name: '林芳', department: '产品部' },
  { id: 'p13', name: '何芳', department: '运营部' },
  { id: 'p14', name: '郭峰', department: '行政部' },
  { id: 'p15', name: '马丽', department: '市场部' },
  { id: 'p16', name: '孙博', department: '研发部' },
  { id: 'p17', name: '高杰', department: '产品部' },
  { id: 'p18', name: '郑涛', department: '运营部' },
  { id: 'p19', name: '谢明', department: '行政部' },
  { id: 'p20', name: '韩杰', department: '市场部' },
];

const DEFAULT_PRIZES: Prize[] = [
  { id: 'pz1', category: '特等奖', name: 'MacBook Pro 14', count: 1, remaining: 1, rank: 1 },
  { id: 'pz2', category: '一等奖', name: 'iPhone 15 Pro', count: 2, remaining: 2, rank: 2 },
  { id: 'pz3', category: '二等奖', name: 'iPad Air', count: 3, remaining: 3, rank: 3 },
  { id: 'pz4', category: '三等奖', name: 'AirPods Pro 2', count: 5, remaining: 5, rank: 4 },
  { id: 'pz5', category: '幸运奖', name: '精美茶具套装', count: 9, remaining: 9, rank: 5 },
];

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
        // 如果本地数据为空，则初始化预设数据
        if ((!data.participants || data.participants.length === 0) && (!data.prizes || data.prizes.length === 0)) {
           setParticipants(DEFAULT_PARTICIPANTS);
           setPrizes(DEFAULT_PRIZES);
        } else {
           setParticipants(data.participants || []);
           setPrizes(data.prizes || []);
        }
        
        setWinners(data.winners || []);
        setPresets(data.presets || []);
        setActivityName(data.activityName || '年度盛典');
        setCompanyName(data.companyName || '科技未来有限公司');
        
        if (data.prizes && data.prizes.length > 0) {
          const sorted = [...data.prizes].sort((a: any, b: any) => b.rank - a.rank);
          setCurrentPrizeId(sorted[0].id);
        }
      } catch (e) {
        console.error("Failed to parse storage data", e);
      }
    } else {
      // 首次进入没有存储，初始化默认数据
      setParticipants(DEFAULT_PARTICIPANTS);
      setPrizes(DEFAULT_PRIZES);
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
    if (participants.length > 0 || prizes.length > 0) {
      const data = { participants, prizes, winners, presets, activityName, companyName };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
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
      // 重置后立即加载默认数据
      setTimeout(() => {
        setParticipants(DEFAULT_PARTICIPANTS);
        setPrizes(DEFAULT_PRIZES);
      }, 100);
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
