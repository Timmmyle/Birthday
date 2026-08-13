"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  loadGameStateFromDB,
  syncGameState,
  addCoins,
  removeCoins,
  DEFAULT_REWARDS,
  INITIAL_STATE,
  MILESTONES
} from "@/utils/db";

// Probability definitions
const BASE_PROBABILITIES = [
  { label: "-5%", value: -0.05, prob: 10, color: "text-danger" },
  { label: "-2%", value: -0.02, prob: 20, color: "text-danger" },
  { label: "-1%", value: -0.01, prob: 30, color: "text-danger" },
  { label: "+1%", value: 0.01, prob: 15, color: "text-success" },
  { label: "+2%", value: 0.02, prob: 15, color: "text-success" },
  { label: "+5%", value: 0.05, prob: 8, color: "text-success" },
  { label: "+10% 🎉", value: 0.10, prob: 2, color: "text-jackpot" }
];

export default function MechanicsPage() {
  const [state, setState] = useState(null);
  
  // Custom probabilities config to allow validation checking
  const [probs, setProbs] = useState(BASE_PROBABILITIES);
  
  // Risk simulator states
  const [simBalance, setSimBalance] = useState(1000000);
  const [simBet, setSimBet] = useState(500000);

  // Economy simulator inputs
  const [ecoStartCoins, setEcoStartCoins] = useState(50000);
  const [ecoAvgBetPct, setEcoAvgBetPct] = useState(20);
  const [ecoDays, setEcoDays] = useState(7);
  const [ecoDailyIncome, setEcoDailyIncome] = useState(35000); // Avg daily quests + checkin
  const [ecoSpinsPerDay, setEcoSpinsPerDay] = useState(5);
  const [ecoSimResults, setEcoSimResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Reward editor state
  const [editedRewards, setEditedRewards] = useState([]);

  // Load state on mount
  useEffect(() => {
    async function loadData() {
      const data = await loadGameStateFromDB();
      setState(data);
      setEditedRewards(data.rewards || DEFAULT_REWARDS);
    }
    loadData();
  }, []);

  // Sync state helper
  const updateStateAndSync = async (newState) => {
    setState(newState);
    await syncGameState(newState);
  };

  // Probability validations
  const negativeSum = probs
    .filter(p => p.value < 0)
    .reduce((sum, p) => sum + p.prob, 0);

  const positiveSum = probs
    .filter(p => p.value > 0)
    .reduce((sum, p) => sum + p.prob, 0);

  const totalSum = negativeSum + positiveSum;
  const isProbValid = totalSum === 100;

  // Live Risk Simulator calculations
  const simBetRatio = simBalance > 0 ? (simBet / simBalance) : 0;
  
  // Risk Category
  let simRiskCategory = "🟢 LOW";
  let simRiskColor = "text-success";
  if (simBetRatio > 0.99) {
    simRiskCategory = "☠️ ALL-IN";
    simRiskColor = "text-danger";
  } else if (simBetRatio >= 0.75) {
    simRiskCategory = "🔴 VERY HIGH";
    simRiskColor = "text-danger";
  } else if (simBetRatio >= 0.50) {
    simRiskCategory = "🟠 HIGH";
    simRiskColor = "text-primary";
  } else if (simBetRatio >= 0.25) {
    simRiskCategory = "🟡 MEDIUM";
    simRiskColor = "text-yellow-400";
  }

  // Live scaling factor
  let simScalingFactor = 1.0;
  if (simBetRatio > 0.99) simScalingFactor = 0.35;
  else if (simBetRatio >= 0.75) simScalingFactor = 0.50;
  else if (simBetRatio >= 0.50) simScalingFactor = 0.70;
  else if (simBetRatio >= 0.25) simScalingFactor = 0.85;
  else if (simBetRatio >= 0.10) simScalingFactor = 0.95;

  // Update Prob value in mechanics UI (in memory testing)
  const handleProbChange = (index, newVal) => {
    const nextProbs = [...probs];
    nextProbs[index] = { ...nextProbs[index], prob: Math.max(0, parseInt(newVal) || 0) };
    setProbs(nextProbs);
  };

  // Reward Configuration Editor
  const handleUpdateRewardField = (id, field, val) => {
    const updated = editedRewards.map(r => {
      if (r.id === id) {
        return {
          ...r,
          [field]: field === "price" ? Math.max(0, parseInt(val) || 0) : val
        };
      }
      return r;
    });
    setEditedRewards(updated);
  };

  const handleSaveRewards = async () => {
    if (!state) return;
    const updatedState = {
      ...state,
      rewards: editedRewards
    };
    await updateStateAndSync(updatedState);
    alert("Cập nhật danh sách quà tặng thành công!");
  };

  // Cheats / Dev Controls
  const addCheatCoins = async (amount) => {
    if (!state) return;
    const updated = addCoins(state, amount, `Developer Cheat (+${amount.toLocaleString()} coins)`);
    await updateStateAndSync(updated);
  };

  const handleResetDaily = async () => {
    if (!state) return;
    const updated = {
      ...state,
      daily: {
        ...state.daily,
        lastClaimDate: null,
        quests: {
          spinOnce: { completed: false, claimed: false },
          playMiniGame: { completed: false, claimed: false },
          allQuests: { completed: false, claimed: false }
        }
      }
    };
    await updateStateAndSync(updated);
    alert("Đã reset trạng thái điểm danh ngày mới!");
  };

  const handleResetSpins = async () => {
    if (!state) return;
    const updated = {
      ...state,
      spin: {
        ...state.spin,
        freeSpinUsed: false,
        paidSpinsToday: 0
      }
    };
    await updateStateAndSync(updated);
    alert("Đã reset lượt quay ngày hôm nay!");
  };

  const handleResetAchievements = async () => {
    if (!state) return;
    const updated = {
      ...state,
      achievements: []
    };
    await updateStateAndSync(updated);
    alert("Đã reset toàn bộ danh hiệu!");
  };

  const handleResetInventory = async () => {
    if (!state) return;
    const updated = {
      ...state,
      inventory: []
    };
    await updateStateAndSync(updated);
    alert("Đã xóa sạch Kho đồ!");
  };

  const handleResetEntireGame = async () => {
    if (!confirm("⚠️ CẢNH BÁO NGUY HIỂM:\nHành động này sẽ XÓA SẠCH toàn bộ tiến trình của game hiện tại và đưa về trạng thái ban đầu. Bạn có chắc muốn tiếp tục không?")) {
      return;
    }
    const cleanState = { ...INITIAL_STATE, rewards: editedRewards };
    await updateStateAndSync(cleanState);
    alert("Đã xóa sạch toàn bộ game!");
  };

  // Economy Simulator (Monte Carlo simulation)
  const runEconomySimulation = () => {
    setIsSimulating(true);
    
    // Defer processing to avoid blocking main thread UI update
    setTimeout(() => {
      const numPlayers = 1000;
      let totalFinalBalance = 0;
      let totalLifetimeEarned = 0;
      let bankruptcies = 0;
      
      const milestoneReachCount = {};
      MILESTONES.forEach(m => {
        milestoneReachCount[m.name] = 0;
      });

      // Loop through 1000 simulated players
      for (let p = 0; p < numPlayers; p++) {
        let playerBalance = ecoStartCoins;
        let playerLifetimeEarned = ecoStartCoins;
        let isBankrupt = false;

        // Play for X days
        for (let d = 0; d < ecoDays; d++) {
          if (isBankrupt) break;

          // 1. Collect Daily checkin/quests income
          playerBalance += ecoDailyIncome;
          playerLifetimeEarned += ecoDailyIncome;

          // 2. Perform daily spins
          for (let s = 0; s < ecoSpinsPerDay; s++) {
            if (playerBalance < 1000) break; // Cannot spin under 1000

            // Determine bet amount
            const betAmount = Math.floor(playerBalance * (ecoAvgBetPct / 100));
            if (betAmount < 1000) continue;

            // Generate spin outcome based on probabilities
            const rand = Math.floor(Math.random() * 100);
            let outcome = probs[0];
            let cumulative = 0;
            for (const item of probs) {
              cumulative += item.prob;
              if (rand < cumulative) {
                outcome = item;
                break;
              }
            }

            const betRatio = betAmount / playerBalance;
            const isPositive = outcome.value > 0;
            
            // Calculate scaling
            let scaling = 1.0;
            if (betRatio > 0.99) scaling = 0.35;
            else if (betRatio >= 0.75) scaling = 0.50;
            else if (betRatio >= 0.50) scaling = 0.70;
            else if (betRatio >= 0.25) scaling = 0.85;
            else if (betRatio >= 0.10) scaling = 0.95;

            if (isPositive) {
              const winAmt = Math.floor(betAmount * outcome.value * scaling);
              playerBalance += winAmt;
              playerLifetimeEarned += winAmt;
            } else {
              const lossAmt = Math.floor(betAmount * Math.abs(outcome.value));
              playerBalance = Math.max(0, playerBalance - lossAmt);
            }

            if (playerBalance <= 0) {
              isBankrupt = true;
              bankruptcies++;
              break;
            }
          }
        }

        totalFinalBalance += playerBalance;
        totalLifetimeEarned += playerLifetimeEarned;

        // Check milestones reached
        MILESTONES.forEach(m => {
          if (playerLifetimeEarned >= m.value) {
            milestoneReachCount[m.name]++;
          }
        });
      }

      setEcoSimResults({
        avgBalance: Math.round(totalFinalBalance / numPlayers),
        avgLifetimeEarned: Math.round(totalLifetimeEarned / numPlayers),
        bankruptcyRate: ((bankruptcies / numPlayers) * 100).toFixed(1),
        milestones: Object.keys(milestoneReachCount).map(k => ({
          name: k,
          rate: ((milestoneReachCount[k] / numPlayers) * 100).toFixed(1)
        }))
      });
      
      setIsSimulating(false);
    }, 100);
  };

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg font-press-start text-primary text-sm animate-pulse">
        LOADING DEV METRICS...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 font-mono text-text-main">
      {/* Header */}
      <header className="pixel-panel mb-6 p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b-4 border-purple">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎂</span>
          <div>
            <h1 className="font-press-start text-purple text-md md:text-lg tracking-tight leading-none">
              BIRTHDAY QUEST — MECHANICS
            </h1>
            <p className="text-[10px] text-text-muted mt-1 uppercase font-bold">
              Bảng điều khiển cân bằng kinh tế game & Cheats
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="pixel-btn bg-purple text-black text-[10px] px-4 py-2 hover:bg-opacity-95"
        >
          ← Quay lại Game
        </Link>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
        
        {/* Left Column: Probabilities & Live Risk Simulator */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Probability configuration / validation */}
          <section className="pixel-panel p-6 border-border-main">
            <h2 className="font-press-start text-[10px] text-purple mb-4 uppercase tracking-wider">
              🎰 SPIN PROBABILITY CONFIGURATION
            </h2>
            
            <div className="bg-bg p-4 pixel-border border-border-main mb-4 space-y-2">
              <div className="flex justify-between text-xs text-text-muted font-bold pb-2 border-b border-border-main/50">
                <span>Outcome Label</span>
                <span>Value %</span>
                <span>Probability (Sum=100)</span>
              </div>

              {probs.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <span className={`text-xs font-bold w-20 ${p.color}`}>{p.label}</span>
                  <span className="text-xs font-mono w-16 text-right">{(p.value * 100).toFixed(0)}%</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={p.prob}
                      onChange={(e) => handleProbChange(idx, e.target.value)}
                      className="pixel-border bg-bg text-center text-xs py-0.5 w-16 focus:outline-none focus:border-purple"
                    />
                    <span className="text-[10px] text-text-muted">%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Validation Display */}
            <div className={`p-3 pixel-border text-xs ${isProbValid ? "bg-green-950/20 text-success border-success" : "bg-red-950/20 text-danger border-danger"}`}>
              <div className="font-bold uppercase mb-1">
                {isProbValid ? "✓ Bảng xác suất hợp lệ!" : "⚠️ LỖI CẤU HÌNH XÁC SUẤT!"}
              </div>
              <div className="leading-normal font-mono text-[10px]">
                Tổng giảm (Loss): <span className="text-danger font-bold">{negativeSum}%</span>
                <br />
                Tổng tăng (Win): <span className="text-success font-bold">{positiveSum - probs.find(p=>p.type==='jackpot').prob}%</span>
                <br />
                Jackpot: <span className="text-jackpot font-bold">{probs.find(p=>p.type==='jackpot').prob}%</span>
                <br />
                Tổng cộng: <strong className="underline">{totalSum}%</strong> (Phải bằng 100% để hoạt động ổn định)
              </div>
            </div>
          </section>

          {/* Risk Simulator */}
          <section className="pixel-panel p-6 border-border-main">
            <h2 className="font-press-start text-[10px] text-purple mb-4 uppercase tracking-wider">
              🎲 LIVE RISK SIMULATOR
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase font-bold">Số dư xu (Balance):</label>
                <input
                  type="number"
                  value={simBalance}
                  onChange={(e) => setSimBalance(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pixel-border bg-bg px-3 py-1 text-sm text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase font-bold">Mức cược (Bet):</label>
                <input
                  type="number"
                  value={simBet}
                  onChange={(e) => setSimBet(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pixel-border bg-bg px-3 py-1 text-sm text-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 bg-bg p-3 pixel-border border-border-main/50 text-xs">
              <div>
                Tỷ lệ cược/Số dư:{" "}
                <span className="font-bold text-white">{(simBetRatio * 100).toFixed(1)}%</span>
              </div>
              <div>
                Mức độ rủi ro:{" "}
                <span className={`font-bold ${simRiskColor}`}>{simRiskCategory}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-border-main/30">
                Hệ số giảm thưởng thắng (Scaling Factor):{" "}
                <span className="font-bold text-success">{(simScalingFactor * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Simulated Outcomes */}
            <div className="space-y-2 border-t-2 border-border-main/50 pt-4">
              <h3 className="text-xs font-bold uppercase text-text-muted mb-2">
                Kết quả đầu ra giả lập (Outcome Table):
              </h3>
              
              {probs.map((p, idx) => {
                const isPositive = p.value > 0;
                let change = 0;
                if (isPositive) {
                  change = Math.floor(simBet * p.value * simScalingFactor);
                } else {
                  change = Math.floor(simBet * Math.abs(p.value)); // Deduct
                }

                return (
                  <div key={idx} className="flex justify-between text-xs font-mono">
                    <span className={`font-bold ${p.color}`}>
                      {p.label} (xác suất {p.prob}%)
                    </span>
                    <span className={isPositive ? "text-success" : "text-danger"}>
                      {isPositive ? "+" : "-"}
                      {change.toLocaleString()} xu
                    </span>
                  </div>
                );
              })}
            </div>

            {simBetRatio > 0.99 && (
              <div className="pixel-border border-danger mt-4 p-3 bg-red-950/20 text-[10px] text-danger leading-normal">
                <strong>☠️ CẢNH BÁO ALL-IN (100%):</strong>
                <br />
                Đang cược toàn bộ số xu. Hệ số giảm thưởng cực lớn (chỉ nhận 35% thưởng trúng). Khoản trừ khi thua vẫn giữ nguyên 100%!
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Economy Simulator & Dev Settings */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Economy Monte Carlo Simulator */}
          <section className="pixel-panel p-6 border-border-main">
            <h2 className="font-press-start text-[10px] text-purple mb-4 uppercase tracking-wider">
              📊 ECONOMY SIMULATOR (MONE CARLO - 1000 PLAYERS)
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase font-bold">Xu bắt đầu:</label>
                <input
                  type="number"
                  value={ecoStartCoins}
                  onChange={(e) => setEcoStartCoins(Math.max(1000, parseInt(e.target.value) || 0))}
                  className="w-full pixel-border bg-bg px-2 py-0.5 text-xs text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase font-bold">% Cược trung bình:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={ecoAvgBetPct}
                  onChange={(e) => setEcoAvgBetPct(Math.max(1, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="w-full pixel-border bg-bg px-2 py-0.5 text-xs text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase font-bold">Số ngày mô phỏng:</label>
                <input
                  type="number"
                  value={ecoDays}
                  onChange={(e) => setEcoDays(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full pixel-border bg-bg px-2 py-0.5 text-xs text-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-text-muted uppercase font-bold">Thu nhập ngày (checkin+quest):</label>
                <input
                  type="number"
                  value={ecoDailyIncome}
                  onChange={(e) => setEcoDailyIncome(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pixel-border bg-bg px-2 py-0.5 text-xs text-primary"
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-text-muted uppercase font-bold">Số lượt quay / ngày:</label>
                <input
                  type="number"
                  value={ecoSpinsPerDay}
                  onChange={(e) => setEcoSpinsPerDay(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full pixel-border bg-bg px-2 py-0.5 text-xs text-primary"
                />
              </div>
            </div>

            <button
              onClick={runEconomySimulation}
              disabled={isSimulating}
              className="w-full pixel-btn bg-purple text-black py-2 text-xs uppercase"
            >
              {isSimulating ? "Đang chạy giả lập..." : "📊 CHẠY MÔ PHỎNG NỀN KINH TẾ"}
            </button>

            {/* Sim Results Output */}
            {ecoSimResults && (
              <div className="mt-4 bg-bg p-4 pixel-border border-border-main space-y-3">
                <div className="text-xs font-bold text-purple uppercase border-b border-border-main/50 pb-1">
                  KẾT QUẢ GIẢ LẬP:
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    Số dư cuối TB:{" "}
                    <span className="text-success font-bold">
                      {ecoSimResults.avgBalance.toLocaleString()} xu
                    </span>
                  </div>
                  <div>
                    Xu tích lũy trọn đời TB:{" "}
                    <span className="text-primary font-bold">
                      {ecoSimResults.avgLifetimeEarned.toLocaleString()} xu
                    </span>
                  </div>
                  <div className="col-span-2 text-danger">
                    Tỷ lệ cháy túi (Phá sản): <strong>{ecoSimResults.bankruptcyRate}%</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-main/30">
                  <div className="text-[10px] font-bold text-text-muted uppercase mb-1">
                    Tỷ lệ người chơi đạt Cột Mốc:
                  </div>
                  <div className="space-y-1 text-[10px] font-mono text-text-muted">
                    {ecoSimResults.milestones.map((m, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{m.name}:</span>
                        <strong className="text-white">{m.rate}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Reward Editor */}
          <section className="pixel-panel p-6 border-border-main">
            <h2 className="font-press-start text-[10px] text-purple mb-4 uppercase tracking-wider">
              🏬 REWARD SHOP CONFIG EDITOR
            </h2>

            <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4 bg-bg p-3 pixel-border border-border-main/50">
              {editedRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-2 border-b border-border-main/30 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reward.icon}
                      onChange={(e) => handleUpdateRewardField(reward.id, "icon", e.target.value)}
                      className="w-8 pixel-border bg-bg text-center text-xs"
                      placeholder="Icon"
                    />
                    <input
                      type="text"
                      value={reward.name}
                      onChange={(e) => handleUpdateRewardField(reward.id, "name", e.target.value)}
                      className="flex-1 pixel-border bg-bg px-2 text-xs"
                      placeholder="Tên"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">Giá:</span>
                    <input
                      type="number"
                      value={reward.price}
                      onChange={(e) => handleUpdateRewardField(reward.id, "price", e.target.value)}
                      className="w-24 pixel-border bg-bg px-2 text-xs text-yellow-400 font-bold"
                    />
                    <input
                      type="text"
                      value={reward.desc}
                      onChange={(e) => handleUpdateRewardField(reward.id, "desc", e.target.value)}
                      className="flex-1 pixel-border bg-bg px-2 text-xs"
                      placeholder="Mô tả ngắn"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveRewards}
              className="w-full pixel-btn bg-success text-black py-2 text-xs uppercase"
            >
              🏬 LƯU CẤU HÌNH CỬA HÀNG (Lưu cục bộ)
            </button>
          </section>

          {/* Dev Controls / Cheats */}
          <section className="pixel-panel p-6 border-danger bg-red-950/5">
            <h2 className="font-press-start text-[10px] text-danger mb-4 uppercase tracking-wider">
              🛠️ DEVELOPER TOOLS & CHEATS
            </h2>

            <div className="space-y-4">
              {/* Coin additions */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-text-muted uppercase">Tăng xu nhanh:</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => addCheatCoins(10000)}
                    className="pixel-btn bg-card text-xs py-1 text-primary"
                  >
                    +10K Xu
                  </button>
                  <button
                    onClick={() => addCheatCoins(100000)}
                    className="pixel-btn bg-card text-xs py-1 text-primary"
                  >
                    +100K Xu
                  </button>
                  <button
                    onClick={() => addCheatCoins(1000000)}
                    className="pixel-btn bg-card text-xs py-1 text-primary"
                  >
                    +1M Xu
                  </button>
                </div>
              </div>

              {/* Single reset actions */}
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-text-muted uppercase">Đặt lại từng mục:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleResetDaily}
                    className="pixel-border hover:bg-card text-xs py-1.5 uppercase font-bold"
                  >
                    Reset Điểm danh
                  </button>
                  <button
                    onClick={handleResetSpins}
                    className="pixel-border hover:bg-card text-xs py-1.5 uppercase font-bold"
                  >
                    Reset Lượt quay hôm nay
                  </button>
                  <button
                    onClick={handleResetAchievements}
                    className="pixel-border hover:bg-card text-xs py-1.5 uppercase font-bold"
                  >
                    Reset Danh hiệu
                  </button>
                  <button
                    onClick={handleResetInventory}
                    className="pixel-border hover:bg-card text-xs py-1.5 uppercase font-bold"
                  >
                    Xóa Kho đồ
                  </button>
                </div>
              </div>

              {/* Nuclear option */}
              <div className="pt-2 border-t border-border-main/50">
                <button
                  onClick={handleResetEntireGame}
                  className="w-full pixel-btn bg-danger hover:bg-red-600 text-white py-3 text-xs uppercase"
                >
                  ⚠️ RESET ENTIRE GAME
                </button>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
