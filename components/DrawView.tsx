import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Participant, Prize, Winner, PresetWinner, DrawEffect } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, ChevronLeft, ChevronRight, Users, Loader2, X, Layers, List, Home } from 'lucide-react';

interface MatrixColumn {
  id: number;
  chars: string[];
  y: number;
  speed: number;
}

interface DrawViewProps {
  participants: Participant[];
  prizes: Prize[];
  winners: Winner[];
  presets: PresetWinner[];
  currentPrizeId: string;
  activityName: string;
  companyName: string;
  onSetCurrentPrize: (id: string) => void;
  onWinnerFound: (winner: Winner) => void;
}

const DrawView: React.FC<DrawViewProps> = ({
  participants,
  prizes,
  winners,
  presets,
  currentPrizeId,
  activityName,
  companyName,
  onSetCurrentPrize,
  onWinnerFound
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [isBulkDrawing, setIsBulkDrawing] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [displayName, setDisplayName] = useState<string>('READY');
  const [displaySub, setDisplaySub] = useState<string>('');
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [lastWinner, setLastWinner] = useState<Winner | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{current: number, total: number} | null>(null);
  
  const [matrixCols, setMatrixCols] = useState<MatrixColumn[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }, []);

  const sortedPrizes = useMemo(() => {
    return [...prizes].sort((a, b) => b.rank - a.rank);
  }, [prizes]);

  const currentPrize = useMemo(() => 
    sortedPrizes.find(p => p.id === currentPrizeId), 
  [sortedPrizes, currentPrizeId]);

  const currentPrizeWinners = useMemo(() => {
    return winners.filter(w => w.prizeId === currentPrizeId);
  }, [winners, currentPrizeId]);
  
  const eligibleParticipants = useMemo(() => {
    const winnerIds = new Set(winners.map(w => w.participantId));
    return participants.filter(p => !winnerIds.has(p.id));
  }, [participants, winners]);

  useEffect(() => {
    const cols: MatrixColumn[] = [];
    const columnCount = Math.floor(window.innerWidth / 30);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&*あいうえお";
    for (let i = 0; i < columnCount; i++) {
      cols.push({
        id: i,
        chars: Array.from({ length: 15 }, () => chars[Math.floor(Math.random() * chars.length)]),
        y: Math.random() * -100,
        speed: Math.random() * 0.5 + 0.2
      });
    }
    setMatrixCols(cols);
  }, []);

  useEffect(() => {
    const update = () => {
      setMatrixCols(prev => prev.map(col => ({
        ...col,
        y: col.y > 110 ? -20 : col.y + col.speed * (isDrawing || isBulkDrawing || isRevealing ? 4 : 1),
        chars: col.y > 110 ? col.chars.map(() => "0123456789"[Math.floor(Math.random() * 10)]) : col.chars
      })));
      frameRef.current = requestAnimationFrame(update);
    };
    frameRef.current = requestAnimationFrame(update);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [isDrawing, isBulkDrawing, isRevealing]);

  const selectWinner = (tempEligible: Participant[]) => {
    let winnerParticipant: Participant;
    const prizePresets = presets.find(p => p.prizeId === currentPrizeId);
    const availablePresets = prizePresets?.participantNames.filter(name => 
      tempEligible.some(p => p.name === name)
    ) || [];

    if (availablePresets.length > 0) {
      const winnerName = availablePresets[0];
      winnerParticipant = tempEligible.find(p => p.name === winnerName)!;
    } else {
      const randomIndex = Math.floor(Math.random() * tempEligible.length);
      winnerParticipant = tempEligible[randomIndex];
    }
    return winnerParticipant;
  };

  const executeWinnerLogic = (winnerParticipant: Participant, showModal: boolean = true) => {
    const newWinner: Winner = {
      id: crypto.randomUUID(),
      participantId: winnerParticipant.id,
      participantName: winnerParticipant.name,
      participantDepartment: winnerParticipant.department,
      prizeId: currentPrizeId,
      prizeCategory: currentPrize?.category || '',
      prizeName: currentPrize?.name || '',
      timestamp: Date.now()
    };

    onWinnerFound(newWinner);
    if (showModal) {
      setLastWinner(newWinner);
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, colors: ['#00ffff', '#ff00ff', '#ffffff', '#ffd700'] });
      setTimeout(() => setShowWinnerModal(true), 600);
    }
    return newWinner;
  };

  const performReveal = async (winner: Participant, speedMultiplier: number = 1) => {
    return new Promise<void>((resolve) => {
      const nameArr = winner.name.split('');
      const deptArr = (winner.department || '总部').split('');
      const indicesToReveal: { type: 'name' | 'dept', pos: number }[] = [];
      nameArr.forEach((_, i) => indicesToReveal.push({ type: 'name', pos: i }));
      deptArr.forEach((_, i) => indicesToReveal.push({ type: 'dept', pos: i }));
      const shuffledOrder = [...indicesToReveal].sort(() => Math.random() - 0.5);
      
      let revealedIndex = 0;
      const stepTime = 300 / speedMultiplier;
      
      const revealStep = () => {
        revealedIndex++;
        const currentlyRevealed = shuffledOrder.slice(0, revealedIndex);
        const nextName = nameArr.map((char, i) => 
          currentlyRevealed.some(r => r.type === 'name' && r.pos === i) ? char : '?'
        ).join('');
        const nextDept = deptArr.map((char, i) => 
          currentlyRevealed.some(r => r.type === 'dept' && r.pos === i) ? char : '?'
        ).join('');
        
        setDisplayName(nextName);
        setDisplaySub(nextDept);
        
        if (revealedIndex < shuffledOrder.length) {
          timerRef.current = window.setTimeout(revealStep, stepTime);
        } else {
          setTimeout(resolve, 400 / speedMultiplier);
        }
      };
      
      setDisplayName(nameArr.map(() => '?').join(''));
      setDisplaySub(deptArr.map(() => '?').join(''));
      timerRef.current = window.setTimeout(revealStep, stepTime);
    });
  };

  const startDraw = async (bulk: boolean = false) => {
    if (!currentPrize || currentPrize.remaining <= 0) return;
    if (eligibleParticipants.length === 0) return;
    
    if (bulk) setIsBulkDrawing(true);
    else setIsDrawing(true);
    setShowWinnerModal(false);

    // Initial rolling effect
    let rollDuration = 1500;
    let startTime = Date.now();
    
    const initialRoll = () => {
      return new Promise<void>((resolve) => {
        const tick = () => {
          const progress = (Date.now() - startTime) / rollDuration;
          if (progress >= 1) { resolve(); return; }
          const p = eligibleParticipants[Math.floor(Math.random() * eligibleParticipants.length)];
          setDisplayName(p.name.split('').map(() => "ABCDE"[Math.floor(Math.random()*5)]).join(' '));
          setDisplaySub(p.department || '扫描中...');
          timerRef.current = window.setTimeout(tick, 50);
        };
        tick();
      });
    };

    await initialRoll();
    
    if (bulk) {
      setIsBulkDrawing(false);
      setIsRevealing(true);
      const totalToDraw = currentPrize.remaining;
      let tempEligible = [...eligibleParticipants];
      
      for (let i = 0; i < totalToDraw; i++) {
        setBulkProgress({ current: i + 1, total: totalToDraw });
        const winner = selectWinner(tempEligible);
        // Faster reveal for bulk mode
        await performReveal(winner, 2.5);
        executeWinnerLogic(winner, false);
        tempEligible = tempEligible.filter(p => p.id !== winner.id);
      }
      
      setIsRevealing(false);
      setBulkProgress(null);
      confetti({ particleCount: 500, spread: 120, origin: { y: 0.5 }, colors: ['#00ffff', '#ff00ff', '#ffffff', '#ffd700'] });
      setTimeout(() => setShowSummaryModal(true), 400);
    } else {
      setIsDrawing(false);
      setIsRevealing(true);
      const winner = selectWinner(eligibleParticipants);
      await performReveal(winner, 1);
      setIsRevealing(false);
      executeWinnerLogic(winner, true);
    }
  };

  const changePrize = (direction: 'next' | 'prev') => {
    if (isDrawing || isBulkDrawing || isRevealing || sortedPrizes.length === 0) return;
    const currentIndex = sortedPrizes.findIndex(p => p.id === currentPrizeId);
    if (currentIndex === -1) return;
    if (direction === 'next' && currentIndex < sortedPrizes.length - 1) {
      onSetCurrentPrize(sortedPrizes[currentIndex + 1].id);
    } else if (direction === 'prev' && currentIndex > 0) {
      onSetCurrentPrize(sortedPrizes[currentIndex - 1].id);
    }
  };

  const closeWinnerModal = () => {
    setShowWinnerModal(false);
    if (currentPrize && currentPrize.remaining === 0) {
      setShowSummaryModal(true);
    }
  };

  const closeSummaryModal = () => {
    setShowSummaryModal(false);
    if (currentPrize && currentPrize.remaining === 0) {
      const currentIndex = sortedPrizes.findIndex(p => p.id === currentPrizeId);
      if (currentIndex !== -1 && currentIndex < sortedPrizes.length - 1) {
        onSetCurrentPrize(sortedPrizes[currentIndex + 1].id);
      }
    }
  };

  const resetToHome = () => {
    if (isDrawing || isBulkDrawing || isRevealing) return;
    setDisplayName('READY');
    setDisplaySub('');
  };

  const isIdle = !isDrawing && !isBulkDrawing && !isRevealing && displayName === 'READY';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none bg-black overflow-hidden">
      
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="flex w-full h-full justify-around">
          {matrixCols.map(col => (
            <div key={col.id} className="text-green-500/15 font-mono text-xl whitespace-pre flex flex-col items-center" style={{ transform: `translateY(${col.y}vh)` }}>
              {col.chars.map((char, i) => (
                <span key={i} className={i === col.chars.length - 1 ? "text-green-300 shadow-[0_0_8px_#86efac]" : ""}>
                  {char}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-10 text-center space-y-4 z-20 w-full px-4">
        <div className="flex items-center justify-center gap-4">
          <button 
            disabled={isDrawing || isBulkDrawing || isRevealing} 
            onClick={() => changePrize('prev')} 
            className={`p-2 transition-all rounded-full hover:bg-white/10 ${isDrawing || isBulkDrawing || isRevealing ? 'opacity-0' : 'opacity-40 hover:opacity-100'}`}
          >
            <ChevronLeft size={40}/>
          </button>
          
          <div className="px-10 py-3 border-b border-cyan-500/30 backdrop-blur-md bg-black/40 min-w-[300px] md:min-w-[600px]">
            <h2 className="text-2xl md:text-3xl font-orbitron font-bold tracking-[0.2em] text-cyan-400 neon-text">
              {currentPrize ? `${currentPrize.category}: ${currentPrize.name}` : '未配置奖项'}
            </h2>
          </div>
          
          <button 
            disabled={isDrawing || isBulkDrawing || isRevealing} 
            onClick={() => changePrize('next')} 
            className={`p-2 transition-all rounded-full hover:bg-white/10 ${isDrawing || isBulkDrawing || isRevealing ? 'opacity-0' : 'opacity-40 hover:opacity-100'}`}
          >
            <ChevronRight size={40}/>
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-6">
            <p className="text-white/40 font-orbitron text-xs uppercase tracking-[0.3em]">
                剩余名额: <span className="text-white text-lg font-black">{currentPrize?.remaining || 0}</span> / {currentPrize?.count || 0}
            </p>
            {currentPrize && currentPrize.remaining === 0 && (
                <button 
                    onClick={() => setShowSummaryModal(true)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-orbitron hover:bg-cyan-500/30 transition-all rounded-full"
                >
                    <List size={14}/> 查看中奖总结
                </button>
            )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full overflow-hidden z-10 relative mt-20">
        <AnimatePresence mode="popLayout">
          {isIdle ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
               <div className="text-cyan-400/80 font-orbitron text-3xl tracking-normal uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">{companyName}</div>
               <div className="text-white font-orbitron font-black text-6xl md:text-8xl tracking-widest neon-text">{activityName}</div>
               <div className="pt-10 flex flex-col items-center gap-4">
                  <div className="text-white/40 font-orbitron tracking-[0.4em] text-lg font-bold">{today}</div>
               </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              {(isDrawing || isBulkDrawing || isRevealing || (displaySub !== '')) && (
                  <motion.div 
                      animate={{ 
                          opacity: (isDrawing || isRevealing) ? [0.6, 1, 0.6] : 1,
                          scale: isDrawing ? [1, 1.15, 0.9, 1] : 1,
                          y: isDrawing ? [0, -10, 10, 0] : 0
                      }}
                      className="text-amber-400 font-orbitron text-5xl md:text-7xl uppercase tracking-[0.25em] font-black min-h-[1.5em] mb-6 neon-text-amber"
                  >
                      {displaySub}
                  </motion.div>
              )}

              <motion.div
                key={`${displayName}-${isDrawing || isRevealing}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: (isDrawing) ? [1, 1.25, 0.8, 1] : 1, 
                  opacity: 1, 
                  letterSpacing: (isDrawing) ? ["0.2em", "0.6em", "0.2em"] : "0.1em",
                }}
                transition={{ duration: 0.1, repeat: isDrawing ? Infinity : 0 }}
                className={`font-orbitron font-black text-7xl md:text-[11rem] tracking-tighter whitespace-nowrap mb-4 min-h-[1.2em] px-10 ${
                  (isDrawing || isRevealing) ? 'text-white' : 'text-fuchsia-500 drop-shadow-[0_0_30px_rgba(217,70,239,0.9)]'
                }`}
              >
                {displayName}
              </motion.div>
              
              {bulkProgress && (
                <div className="mt-4 text-cyan-400/60 font-orbitron text-xl uppercase tracking-[0.5em]">
                    抽取进度: {bulkProgress.current} / {bulkProgress.total}
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-20 h-24 flex flex-col items-center justify-center gap-6 z-20">
        {(!isDrawing && !isBulkDrawing && !isRevealing) ? (
          <div className="flex gap-4">
            <button
                onClick={() => startDraw(false)}
                disabled={!currentPrize || currentPrize.remaining <= 0}
                className="group relative px-20 py-6 bg-transparent border-2 border-cyan-500/50 hover:border-cyan-400 text-cyan-400 font-orbitron text-2xl tracking-[0.5em] transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:shadow-[0_0_40px_rgba(34,211,238,0.2)]"
            >
                <span className="relative z-10 uppercase font-bold">开始单抽</span>
                <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-all"></div>
            </button>
            
            {currentPrize && currentPrize.remaining > 1 && (
                <button
                    onClick={() => startDraw(true)}
                    className="group relative px-20 py-6 bg-transparent border-2 border-purple-500/50 hover:border-purple-400 text-purple-400 font-orbitron text-2xl tracking-[0.5em] transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]"
                >
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20" size={32}/>
                    <span className="relative z-10 uppercase font-bold">连抽全部</span>
                    <div className="absolute inset-0 bg-purple-500/10 group-hover:bg-purple-500/20 transition-all"></div>
                </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <div className="flex items-center gap-4 text-cyan-400/80 font-orbitron text-lg tracking-[0.4em] uppercase font-bold">
                <Loader2 className="animate-spin" size={24} />
                {isRevealing ? (bulkProgress ? '连续解密协议中...' : '解密幸运协议中...') : (isBulkDrawing ? '系统全量扫描中...' : '幸运矩阵检索中...')}
             </div>
             <div className="w-[30rem] h-1 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[0.5px]">
                <motion.div 
                  initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: isBulkDrawing ? 2 : 1, ease: "linear" }}
                  className={`h-full shadow-[0_0_20px] ${isBulkDrawing ? 'bg-purple-400 shadow-purple-500' : 'bg-cyan-400 shadow-cyan-500'}`}
                />
             </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 w-full flex justify-between px-10 text-white/30 text-[10px] font-orbitron uppercase tracking-[0.4em] z-20">
        <div className="flex items-center gap-2"><Users size={14}/> 参会人数: {participants.length}</div>
        <div className="flex items-center gap-2"><Trophy size={14}/> 中奖人数: {winners.length}</div>
      </div>

      <div className="absolute right-10 top-1/2 -translate-y-1/2 z-30">
        <button 
          onClick={resetToHome}
          disabled={isDrawing || isBulkDrawing || isRevealing || isIdle}
          className={`p-4 rounded-full border transition-all ${isIdle ? 'opacity-0 pointer-events-none' : 'bg-black/50 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_20px_#22d3ee]'}`}
          title="返回主页"
        >
          <Home size={28}/>
        </button>
      </div>

      <AnimatePresence>
        {showWinnerModal && lastWinner && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/98 backdrop-blur-3xl"
            onClick={closeWinnerModal}
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 0.9, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
              className="text-center space-y-6 p-10 relative max-w-3xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute inset-0 -z-10 bg-cyan-500/5 blur-[100px] rounded-full"></div>
              <div className="text-yellow-400 flex justify-center mb-6">
                <motion.div animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                  <Trophy size={120} strokeWidth={1} />
                </motion.div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl text-white/40 font-orbitron tracking-[1em] uppercase font-black">恭喜获奖</h3>
                <h2 className="text-7xl md:text-[9rem] font-orbitron font-black text-white leading-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] whitespace-nowrap">{lastWinner.participantName}</h2>
                <div className="text-3xl md:text-5xl text-amber-400 font-orbitron tracking-[0.4em] mb-8 font-bold uppercase">{lastWinner.participantDepartment || 'STAFF'}</div>
                <div className="inline-block px-12 py-6 bg-cyan-500/10 border-y border-cyan-500/40">
                  <span className="text-3xl text-white font-orbitron tracking-[0.3em] font-bold">{lastWinner.prizeCategory}: {lastWinner.prizeName}</span>
                </div>
              </div>
              
              <div className="mt-16 flex flex-wrap justify-center gap-6">
                {currentPrize && currentPrize.remaining > 0 && (
                  <button 
                    onClick={() => { setShowWinnerModal(false); startDraw(false); }}
                    className="px-20 py-5 bg-cyan-500 text-black font-orbitron font-black uppercase tracking-[0.3em] hover:bg-cyan-400 transition-all hover:scale-105 active:scale-95 text-xl rounded shadow-lg shadow-cyan-500/20"
                  >继续抽奖</button>
                )}
                <button onClick={closeWinnerModal} className="px-20 py-5 bg-white/10 text-white font-orbitron font-black uppercase tracking-[0.3em] hover:bg-white/20 transition-all text-xl rounded">
                  {currentPrize && currentPrize.remaining === 0 ? "查看总结" : "抽取完成"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSummaryModal && currentPrize && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-4 md:p-6"
          >
            <div className="relative w-full max-w-7xl bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-6 md:p-10 overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.1)] flex flex-col items-center">
              <div className="absolute top-8 right-8">
                <button onClick={closeSummaryModal} className="text-white/40 hover:text-white transition-all bg-white/5 p-2 rounded-full"><X size={32} /></button>
              </div>
              
              <div className="text-center mb-6 w-full">
                <h3 className="text-xl text-cyan-400 font-orbitron tracking-[0.6em] mb-2 uppercase font-bold">{currentPrize.category} 获奖结果</h3>
                <h2 className="text-3xl md:text-5xl font-bold text-white tracking-widest">{currentPrize.name}</h2>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full max-h-[70vh] overflow-hidden">
                {currentPrizeWinners.map((winner, idx) => {
                  const count = currentPrizeWinners.length;
                  // Extremely dynamic scaling to ensure everything fits on one screen
                  let boxSize = 'w-64 p-6';
                  let nameSize = 'text-3xl';
                  let deptSize = 'text-sm';
                  
                  if (count > 80) {
                    boxSize = 'w-24 p-1.5'; nameSize = 'text-sm'; deptSize = 'text-[8px]';
                  } else if (count > 50) {
                    boxSize = 'w-28 p-2'; nameSize = 'text-base'; deptSize = 'text-[9px]';
                  } else if (count > 30) {
                    boxSize = 'w-36 p-3'; nameSize = 'text-xl'; deptSize = 'text-[10px]';
                  } else if (count > 15) {
                    boxSize = 'w-48 p-4'; nameSize = 'text-2xl'; deptSize = 'text-xs';
                  }

                  return (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.02, type: 'spring', stiffness: 200 }}
                      key={winner.id} 
                      className={`${boxSize} bg-white/5 border border-white/10 rounded-xl text-center flex flex-col justify-center items-center shadow-md backdrop-blur-sm`}
                    >
                      <div className={`${nameSize} font-orbitron font-black text-white whitespace-nowrap overflow-hidden text-ellipsis w-full`}>{winner.participantName}</div>
                      <div className={`${deptSize} text-amber-400/80 uppercase tracking-widest font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full`}>{winner.participantDepartment || 'STAFF'}</div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-center w-full">
                <button onClick={closeSummaryModal} className="px-16 py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-orbitron font-black uppercase tracking-[0.4em] transition-all rounded-xl shadow-xl shadow-cyan-500/20 text-xl active:scale-95">确定</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DrawView;