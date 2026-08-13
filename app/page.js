"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  supabase,
  loadGameStateFromDB,
  syncGameState,
  addCoins,
  removeCoins,
  claimDailyReward,
  completeQuest,
  claimQuestReward,
  redeemReward,
  checkDailyReset,
  isSameDay,
  MILESTONES,
  DEFAULT_REWARDS
} from "@/utils/db";
import {
  setSoundEnabled,
  isSoundEnabled,
  playCoinSound,
  playSpinTick,
  playWinSound,
  playJackpotSound,
  playExplosionSound
} from "@/utils/audio";

// Slices definition (7 equal slices)
const WHEEL_SECTORS = [
  { label: "+5%", value: 0.05, prob: 8, color: "#22C55E", type: "win" },
  { label: "+10% JACKPOT", value: 0.10, prob: 2, color: "#FFD700", type: "jackpot" },
  { label: "+2%", value: 0.02, prob: 15, color: "#22C55E", type: "win" },
  { label: "+1%", value: 0.01, prob: 15, color: "#22C55E", type: "win" },
  { label: "-1%", value: -0.01, prob: 30, color: "#EF4444", type: "loss" },
  { label: "-2%", value: -0.02, prob: 20, color: "#EF4444", type: "loss" },
  { label: "-5%", value: -0.05, prob: 10, color: "#EF4444", type: "loss" }
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [guestBypass, setGuestBypass] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState("login"); // login or signup
  const [authError, setAuthError] = useState("");
  const [state, setState] = useState(null);
  const [activeTab, setActiveTab] = useState("spin"); // spin, game, shop, inventory, milestones, settings
  const [bet, setBet] = useState(10000);
  const [customBetInput, setCustomBetInput] = useState("10000");
  const [isSpinning, setIsSpinning] = useState(false);
  const [recentResult, setRecentResult] = useState(null);
  const [hasRerolled, setHasRerolled] = useState(false);
  const [discountActive, setDiscountActive] = useState(false); // GIẢM GIÁ/PREMIUM mode
  const [countdown, setCountdown] = useState("14:32:10");
  const [username, setUsername] = useState("timmyyie");
  useEffect(() => {
    if (user && user.email) {
      const name = user.email.split("@")[0];
      setUsername(name);
    } else {
      setUsername("timmyyie");
    }
  }, [user]);
  const [bestReaction, setBestReaction] = useState(null);
  const [spinsCount, setSpinsCount] = useState(0);

  // Reaction Game States
  const [reactionActive, setReactionActive] = useState(false);
  const [reactionState, setReactionState] = useState("idle"); // idle, waiting, trigger, finished
  const [reactionTimer, setReactionTimer] = useState(null);
  const [reactionStart, setReactionStart] = useState(0);
  const [reactionResultMsg, setReactionResultMsg] = useState("");

  const canvasRef = useRef(null);
  const currentWheelAngleRef = useRef(0);
  const animationRef = useRef(null);

  // Listen to Supabase Session on mount
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize and load state based on Auth user
  useEffect(() => {
    async function loadData() {
      const userId = user?.id || null;
      const dbState = await loadGameStateFromDB(userId);
      
      let initialData = { ...dbState };
      // Check and seed initial data to match layout reference
      if (initialData.coins === 50000 && initialData.lifetimeEarned === 50000) {
        initialData.lifetimeEarned = 820000;
        initialData.daily.streak = 1; // 1 day streak
        initialData.achievements = ["🥉 Beginner", "🥈 Coin Collector", "🥇 Coin Hunter"];
      }

      const resetState = checkDailyReset(initialData);
      setState(resetState);
      setSoundEnabled(resetState.settings?.soundEnabled || false);
      
      // Load custom items
      if (typeof window !== "undefined") {
        const localBest = localStorage.getItem("bq_best_reaction");
        if (localBest) setBestReaction(parseInt(localBest));
        
        const localSpins = localStorage.getItem("bq_spins_count");
        if (localSpins) setSpinsCount(parseInt(localSpins));
      }

      if (JSON.stringify(resetState) !== JSON.stringify(dbState)) {
        await syncGameState(resetState, userId);
      }
    }
    loadData();
  }, [user]);

  // Countdown timer to midnight
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;

      const hrs = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      
      setCountdown(`${hrs}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Draw the spin wheel slices
  useEffect(() => {
    if (activeTab === "spin" && state) {
      drawWheel(currentWheelAngleRef.current);
    }
  }, [activeTab, state]);

  const updateStateAndSync = async (newState) => {
    setState(newState);
    await syncGameState(newState);
  };

  // Draw wheel function
  const drawWheel = (angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 10;

    ctx.clearRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const sliceAngle = (2 * Math.PI) / WHEEL_SECTORS.length;

    WHEEL_SECTORS.forEach((sec, idx) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, idx * sliceAngle, (idx + 1) * sliceAngle);
      ctx.closePath();

      ctx.fillStyle = sec.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#2A2E3D";
      ctx.stroke();

      // Label text
      ctx.save();
      ctx.rotate(idx * sliceAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = sec.type === "jackpot" ? "#000" : "#E6E6E6";
      ctx.font = 'bold 13px "Roboto Mono", sans-serif';
      
      let label = sec.label.replace(" JACKPOT", "");
      ctx.fillText(label, r - 12, 0);
      ctx.restore();
    });

    ctx.restore();

    // Center peg
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#FF8A00";
    ctx.strokeStyle = "#2A2E3D";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    // Needle
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 5);
    ctx.lineTo(cx - 8, cy - r + 12);
    ctx.lineTo(cx + 8, cy - r + 12);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  };

  // Bet updates
  const handleBetChange = (amount) => {
    if (!state) return;
    const cleanAmount = Math.max(1000, Math.min(state.coins, amount));
    setBet(cleanAmount);
    setCustomBetInput(cleanAmount.toString());
  };

  const handleCustomBetBlur = () => {
    if (!state) return;
    let val = parseInt(customBetInput.replace(/,/g, "")) || 0;
    val = Math.max(1000, Math.min(state.coins, val));
    setBet(val);
    setCustomBetInput(val.toString());
  };

  const riskRatio = state ? (bet / state.coins) : 0;
  let riskText = "THẤP";
  let riskColor = "text-success";
  if (riskRatio > 0.99) {
    riskText = "ALL-IN ☠️";
    riskColor = "text-danger animate-pulse font-bold";
  } else if (riskRatio >= 0.75) {
    riskText = "RẤT CAO 🔴";
    riskColor = "text-danger";
  } else if (riskRatio >= 0.50) {
    riskText = "CAO 🟠";
    riskColor = "text-accent";
  } else if (riskRatio >= 0.25) {
    riskText = "TRUNG BÌNH 🟡";
    riskColor = "text-yellow-400";
  }

  // Scaling Factor
  let scalingFactor = 1.0;
  if (riskRatio > 0.99) scalingFactor = 0.35;
  else if (riskRatio >= 0.75) scalingFactor = 0.50;
  else if (riskRatio >= 0.50) scalingFactor = 0.70;
  else if (riskRatio >= 0.25) scalingFactor = 0.85;
  else if (riskRatio >= 0.10) scalingFactor = 0.95;

  // Spin Wheel implementation
  const handleSpin = (isFree = false) => {
    if (!state || isSpinning) return;
    if (!isFree && state.coins < bet) {
      alert("Không đủ coin để cược!");
      return;
    }

    setIsSpinning(true);
    setRecentResult(null);
    setHasRerolled(false);

    // Calculate outcome based on probabilities
    const rand = Math.floor(Math.random() * 100);
    let outcome = WHEEL_SECTORS[0];
    let cumulative = 0;
    for (const s of WHEEL_SECTORS) {
      cumulative += s.prob;
      if (rand < cumulative) {
        outcome = s;
        break;
      }
    }

    const rotations = 6 + Math.random() * 2;
    const duration = 3000;
    const startTime = performance.now();

    const sectorIndex = WHEEL_SECTORS.indexOf(outcome);
    const sectorAngleSize = 360 / WHEEL_SECTORS.length;
    const targetSectorAngle = sectorIndex * sectorAngleSize;
    const targetDeg = (360 + (270 - (targetSectorAngle + sectorAngleSize / 2)) % 360) % 360;
    const targetRotation = (targetDeg * Math.PI) / 180 + rotations * 2 * Math.PI;

    let lastTickAngle = 0;

    const spin = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentAngle = ease * targetRotation;

      currentWheelAngleRef.current = currentAngle;
      drawWheel(currentAngle);

      const currentDeg = (currentAngle * 180 / Math.PI) % 360;
      if (Math.abs(currentDeg - lastTickAngle) > 20) {
        playSpinTick();
        lastTickAngle = currentDeg;
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(spin);
      } else {
        finalizeSpin(outcome, isFree);
      }
    };

    animationRef.current = requestAnimationFrame(spin);
  };

  const finalizeSpin = async (outcome, isFree, fromReroll = false) => {
    setIsSpinning(false);
    const actualBet = isFree ? 0 : bet;
    let changeAmount = 0;
    const isPositive = outcome.value > 0;
    const currentScaling = isPositive ? scalingFactor : 1.0;

    if (isPositive) {
      changeAmount = Math.floor(actualBet * outcome.value * currentScaling);
    } else {
      changeAmount = Math.floor(actualBet * Math.abs(outcome.value));
    }

    let updatedState = { ...state };
    if (isFree) {
      updatedState.spin.freeSpinUsed = true;
      if (isPositive) {
        changeAmount = Math.floor(10000 * outcome.value);
      } else {
        changeAmount = 0;
      }
    }

    if (isPositive) {
      updatedState = addCoins(updatedState, changeAmount, fromReroll ? `Reroll Lucky Spin (${outcome.label})` : `Lucky Spin (${outcome.label})`);
      if (outcome.type === "jackpot") {
        playJackpotSound();
      } else {
        playWinSound();
      }
    } else {
      if (!isFree) {
        updatedState = removeCoins(updatedState, changeAmount, fromReroll ? `Reroll Lucky Spin (${outcome.label})` : `Lucky Spin (${outcome.label})`);
        playExplosionSound();
      }
    }

    updatedState = completeQuest(updatedState, "spinOnce");

    // Increment spins count
    if (!isFree) {
      const nextSpinsCount = spinsCount + 1;
      setSpinsCount(nextSpinsCount);
      if (typeof window !== "undefined") {
        localStorage.setItem("bq_spins_count", nextSpinsCount.toString());
      }
    }

    setRecentResult({
      outcome,
      isFree,
      bet: actualBet,
      changeAmount,
      isPositive,
      scalingUsed: currentScaling
    });

    await updateStateAndSync(updatedState);
  };

  // Reroll logic
  const handleReroll = async () => {
    if (!state || state.spin.rerollsRemaining <= 0 || !recentResult || hasRerolled) return;

    let updatedState = { ...state };
    updatedState.spin.rerollsRemaining -= 1;
    setHasRerolled(true);

    if (!recentResult.isFree) {
      if (recentResult.isPositive) {
        updatedState = removeCoins(updatedState, recentResult.changeAmount, "Refund original spin win for Reroll");
      } else {
        updatedState = addCoins(updatedState, recentResult.changeAmount, "Refund original spin loss for Reroll");
      }
    }

    setState(updatedState);
    setIsSpinning(true);
    setRecentResult(null);

    const rand = Math.floor(Math.random() * 100);
    let outcome = WHEEL_SECTORS[0];
    let cumulative = 0;
    for (const s of WHEEL_SECTORS) {
      cumulative += s.prob;
      if (rand < cumulative) {
        outcome = s;
        break;
      }
    }

    const rotations = 4;
    const duration = 2000;
    const startTime = performance.now();

    const sectorIndex = WHEEL_SECTORS.indexOf(outcome);
    const sectorAngleSize = 360 / WHEEL_SECTORS.length;
    const targetSectorAngle = sectorIndex * sectorAngleSize;
    const targetDeg = (360 + (270 - (targetSectorAngle + sectorAngleSize / 2)) % 360) % 360;
    const targetRotation = (targetDeg * Math.PI) / 180 + rotations * 2 * Math.PI;

    let lastTickAngle = 0;

    const rerollSpin = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentAngle = ease * targetRotation;

      currentWheelAngleRef.current = currentAngle;
      drawWheel(currentAngle);

      const currentDeg = (currentAngle * 180 / Math.PI) % 360;
      if (Math.abs(currentDeg - lastTickAngle) > 20) {
        playSpinTick();
        lastTickAngle = currentDeg;
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(rerollSpin);
      } else {
        finalizeSpin(outcome, recentResult.isFree, true);
      }
    };

    animationRef.current = requestAnimationFrame(rerollSpin);
  };

  // Claim checkin
  const handleCheckin = async () => {
    if (!state) return;
    const today = new Date().toISOString();
    if (state.daily.lastClaimDate && isSameDay(state.daily.lastClaimDate, today)) {
      alert("Bạn đã nhận điểm danh hôm nay rồi!");
      return;
    }

    const updated = claimDailyReward(state);
    playCoinSound();
    await updateStateAndSync(updated);
  };

  // Claim quest
  const handleClaimQuest = async (key) => {
    if (!state) return;
    const quest = state.daily.quests[key];
    if (!quest || !quest.completed || quest.claimed) return;

    const updated = claimQuestReward(state, key);
    playCoinSound();
    await updateStateAndSync(updated);
  };

  // Redeem
  const handleRedeemItem = async (rewardId) => {
    if (!state) return;
    const rewards = state.rewards || DEFAULT_REWARDS;
    const item = rewards.find(r => r.id === rewardId);
    if (!item) return;

    const finalPrice = discountActive ? Math.floor(item.price * 0.9) : item.price;

    if (state.coins < finalPrice) {
      alert("Không đủ xu!");
      return;
    }

    const confirmRedeem = confirm(`Bạn có chắc muốn đổi: "${item.name}" với giá ${finalPrice.toLocaleString()} xu không?`);
    if (!confirmRedeem) return;

    let updated = removeCoins(state, finalPrice, `Redeemed ${item.name}`);
    const claimCode = `BQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const newItem = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      rewardId: item.id,
      name: item.name,
      redeemedAt: new Date().toISOString(),
      claimCode,
      status: "🎁 Ready to Claim"
    };

    updated.inventory = [newItem, ...updated.inventory];
    
    playCoinSound();
    await updateStateAndSync(updated);
    alert(`Đã đổi thành công ${item.name}!`);
  };

  // Reaction Mini Game
  const triggerReactionGame = () => {
    if (reactionActive) return;
    setReactionActive(true);
    setReactionState("waiting");
    setReactionResultMsg("Đang chờ...");

    const delay = 1500 + Math.random() * 2000;
    const timer = setTimeout(() => {
      setReactionState("trigger");
      setReactionStart(performance.now());
      setReactionResultMsg("BẤM NGAY! 🎯");
      playCoinSound();
    }, delay);

    setReactionTimer(timer);
  };

  const pressReactionBtn = async () => {
    if (reactionState === "waiting") {
      clearTimeout(reactionTimer);
      setReactionState("finished");
      setReactionResultMsg("BẤM SỚM QUÁ! 💀 Miss");
      playExplosionSound();
      
      let updated = completeQuest(state, "playMiniGame");
      await updateStateAndSync(updated);
      setReactionActive(false);
      return;
    }

    if (reactionState === "trigger") {
      const end = performance.now();
      const diff = Math.round(end - reactionStart);
      setReactionState("finished");

      let reward = 0;
      let msg = "";

      if (diff < 200) {
        reward = 1000;
        msg = `Phản xạ: ${diff}ms - PERFECT! +1.000 xu`;
        playJackpotSound();
      } else if (diff < 300) {
        reward = 750;
        msg = `Phản xạ: ${diff}ms - EXCELLENT! +750 xu`;
        playWinSound();
      } else if (diff < 400) {
        reward = 500;
        msg = `Phản xạ: ${diff}ms - GOOD! +500 xu`;
        playWinSound();
      } else {
        reward = 250;
        msg = `Phản xạ: ${diff}ms - HƠI CHẬM! +250 xu`;
        playExplosionSound();
      }

      setReactionResultMsg(msg);

      if (bestReaction === null || diff < bestReaction) {
        setBestReaction(diff);
        if (typeof window !== "undefined") {
          localStorage.setItem("bq_best_reaction", diff.toString());
        }
      }

      let updated = addCoins(state, reward, `Reaction Game: ${diff}ms`);
      updated = completeQuest(updated, "playMiniGame");
      
      await updateStateAndSync(updated);
      setReactionActive(false);
    }
  };

  // Milestones & Ranks
  const earned = state ? state.lifetimeEarned : 820000;
  const nextMilestone = MILESTONES.find(m => earned < m.value) || { name: "Birthday Legend", value: 5000000, rewardName: "Mechanical Keyboard" };
  const percentage = Math.min(100, Math.round((earned / nextMilestone.value) * 100));

  // Find Rank Title based on earned coins
  let rankTitle = "Trứng Gà I";
  if (earned >= 5000000) rankTitle = "Birthday Legend";
  else if (earned >= 2500000) rankTitle = "Birthday Master";
  else if (earned >= 1000000) rankTitle = "Millionaire";
  else if (earned >= 500000) rankTitle = "Coin Hunter";
  else if (earned >= 250000) rankTitle = "Coin Collector";
  else if (earned >= 100000) rankTitle = "Beginner";

  // Quest count
  const completedQuestCount = [
    state?.daily.quests.spinOnce.completed,
    state?.daily.quests.playMiniGame.completed
  ].filter(Boolean).length;

    const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError("Supabase chưa được cấu hình biến môi trường!");
      return;
    }
    setAuthError("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword
        });
        if (error) throw error;
        alert("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
        setAuthMode("login");
      }
    } catch (err) {
      setAuthError(err.message || "Đã xảy ra lỗi xác thực!");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setGuestBypass(false);
    }
  };

  if (!user && !guestBypass) {
    return (
      <div className="min-h-screen bg-bg text-text-main flex items-center justify-center p-6 font-mono">
        <div className="retro-panel bg-card border-2 border-border-main p-8 max-w-md w-full space-y-6">
          <div className="text-center">
            <span className="text-4xl block mb-2">🎁</span>
            <h2 className="font-press-start text-primary text-base md:text-lg tracking-widest uppercase">
              BIRTHDAY GIFT
            </h2>
            <p className="text-sm text-text-muted mt-2 uppercase font-bold">
              Muốn quà to là phải làm! 🎂
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-text-muted uppercase font-bold block">Email:</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full pixel-border-border rounded-[4px] bg-bg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-text-muted uppercase font-bold block">Mật khẩu:</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full pixel-border-border rounded-[4px] bg-bg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
                placeholder="******"
              />
            </div>

            {authError && (
              <div className="p-2 bg-red-950/20 border border-danger/30 text-danger text-[10px] leading-normal text-center rounded-[4px]">
                {authError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={authLoading}
                className="flex-1 retro-btn bg-primary text-black py-2.5 text-sm font-bold"
              >
                {authLoading ? "..." : authMode === "login" ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}
              </button>

              <button
                type="button"
                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                className="flex-1 retro-btn bg-bg-secondary text-text-muted py-2.5 text-sm font-bold border border-border-main"
              >
                {authMode === "login" ? "TẠO TÀI KHOẢN" : "CÓ SẴN ACC"}
              </button>
            </div>
          </form>

          <div className="border-t border-border-main/30 pt-4 text-center">
            <button
              onClick={() => setGuestBypass(true)}
              className="text-sm text-primary hover:underline uppercase font-bold tracking-wider"
            >
              🚀 Bỏ qua / Chơi Chế độ Khách (Local)
            </button>
            {!supabase && (
              <p className="text-sm text-danger mt-2 leading-tight">
                * Supabase chưa cấu hình biến môi trường, hãy chơi chế độ khách cục bộ.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex flex-1 items-center justify-center bg-bg font-press-start text-primary text-sm animate-pulse">
        LOADING VUIGA PAGE STYLE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-main flex flex-col justify-between select-none pb-20 lg:pb-0">
      
      {/* Top Banner Alert / News Ticker */}
      <div className="bg-accent/15 text-primary text-xs py-1 px-4 text-center font-mono flex items-center justify-center gap-2 border-b border-border-main">
        <span>🐔</span>
        <span className="font-bold">Cao Thủ Gà vừa cày trúng +10% JACKPOT trong Vòng Quay May Mắn!</span>
      </div>

      {/* Header (Top Bar) */}
      <header className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-border-main bg-bg-secondary/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Chick mascot icon */}
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-2xl border-2 border-border-main shadow-glow">
            🐣
          </div>
          <div>
            <h1 className="font-press-start text-primary text-sm tracking-widest leading-none">
              BIRTHDAY GIFT
            </h1>
            <p className="text-sm text-text-muted mt-1 uppercase font-bold tracking-wider">
              Muốn quà to là phải làm! 🎂
            </p>
          </div>
          {/* Status Dot */}
          <div className="ml-3 px-2 py-0.5 bg-success/15 border border-success/30 rounded-full flex items-center gap-1.5 text-sm text-success font-bold font-mono">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            <span>1.348 Gà online</span>
          </div>
        </div>

        {/* Header Right */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Level box */}
          <div className="flex items-center gap-2 text-sm font-bold bg-bg-secondary px-3 py-1.5 rounded-[6px] border border-border-main">
            <span className="text-text-muted">CẤP ĐỘ</span>
            <span className="font-press-start text-primary font-bold text-sm">
              {1 + Math.floor(earned / 250000)}
            </span>
          </div>

          {/* Egg/Coins count box */}
          <div className="bg-bg-secondary border-2 border-primary/50 px-4 py-1.5 flex items-center gap-2 rounded-[6px] shadow-glow">
            <span className="text-sm">🪙</span>
            <span className="font-press-start text-sm text-primary font-bold">
              {state.coins.toLocaleString()}
            </span>
          </div>

          {/* Premium button acting as Discount */}
          <button
            onClick={() => setDiscountActive(!discountActive)}
            className={`retro-btn px-4 py-1.5 text-sm font-bold ${
              discountActive 
                ? "bg-accent text-white animate-pulse" 
                : "bg-primary text-black"
            }`}
          >
            {discountActive ? "ĐANG GIẢM GIÁ 10%" : "PREMIUM"}
          </button>

          {/* Settings / Sign out */}
          <button
            onClick={() => {
              const next = !state.settings.soundEnabled;
              setSoundEnabled(next);
              updateStateAndSync({ ...state, settings: { ...state.settings, soundEnabled: next } });
            }}
            className={`p-2 rounded-[6px] border border-border-main text-xs ${
              state.settings.soundEnabled ? "bg-success text-black border-success" : "bg-bg-secondary text-text-muted"
            }`}
            title="Bật/Tắt âm thanh"
          >
            {state.settings.soundEnabled ? "🔊" : "🔇"}
          </button>

          <Link
            href="/mechanics"
            className="retro-btn border border-danger/50 text-danger text-sm px-3 py-1.5 hover:bg-danger/10"
          >
            Đăng xuất
          </Link>
        </div>
      </header>

      {/* Main Grid: Sidebar + Center Content + Right Sidebar */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* 1. Left Sidebar Navigation (2 Columns wide) */}
        <aside className="hidden lg:flex lg:col-span-2 flex-col gap-2">
          {[
            { id: "spin", label: "🎰 Vòng quay", desc: "Lucky spin" },
            { id: "game", label: "🎮 Mini Game", desc: "Phản xạ nhanh" },
            { id: "shop", label: "🏬 Cửa hàng", desc: "Đổi quà" },
            { id: "inventory", label: "🎒 Kho đồ", desc: "Quà của tôi" },
            { id: "milestones", label: "🏆 Cột mốc", desc: "Thành tựu" },
            { id: "settings", label: "⚙️ Cài đặt", desc: "Quản lý hệ thống" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full p-3 rounded-[6px] text-left border flex flex-col justify-center transition-all ${
                  isActive
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-bg-secondary/40 border-border-main text-text-muted hover:bg-card-hover hover:text-white"
                }`}
              >
                <span className="font-bold text-xs">{tab.label}</span>
                <span className="text-xs opacity-70 mt-0.5 uppercase tracking-wider">{tab.desc}</span>
              </button>
            );
          })}
        </aside>

        {/* 2. Center Column (7 Columns wide - Holds Banner & Active Content) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          
          {/* Top Info Banner Box */}
          <div className="bg-bg-secondary border border-border-main p-4 rounded-[6px] flex items-center justify-between gap-4">
            <div>
              <span className="bg-accent text-white text-sm font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                Sự kiện đặc biệt
              </span>
              <h3 className="font-bold text-sm text-white mt-2">
                Đêm Hoàng Kim (Golden Night)
              </h3>
              <p className="text-sm text-text-muted mt-1 leading-snug">
                Đổi Visual vàng sang trọng, nhân đôi EXP vĩnh viễn cuối tuần, và mở khóa Event Shop vật phẩm đặc chế Obsidian Hoàng Gia.
              </p>
            </div>
            <button
              onClick={() => {
                alert("Chúc mừng sinh nhật vàng! Đã kích hoạt theme hoàng gia.");
              }}
              className="retro-btn bg-primary text-black text-xs px-3 py-2 font-bold flex-shrink-0"
            >
              KHÁM PHÁ NGAY
            </button>
          </div>

          {/* Last game banner */}
          {recentResult && (
            <div className="bg-bg-secondary border border-border-main p-4 rounded-[6px] flex items-center justify-between gap-4">
              <div>
                <span className="text-text-muted text-xs uppercase font-bold tracking-wider block">
                  LẦN QUAY TRƯỚC
                </span>
                <h4 className="font-bold text-sm text-white mt-1">
                  Kết quả: <span className={recentResult.isPositive ? "text-success" : "text-danger"}>{recentResult.outcome.label}</span>
                </h4>
                <p className="text-sm text-text-muted mt-0.5">
                  {recentResult.isPositive 
                    ? `Nhận được +${recentResult.changeAmount.toLocaleString()} xu (Hiệu suất cược: ${Math.round(recentResult.scalingUsed * 100)}%)`
                    : `Bị trừ -${recentResult.changeAmount.toLocaleString()} xu.`
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("spin");
                }}
                className="retro-btn bg-accent text-white text-xs px-3 py-2 font-bold flex-shrink-0"
              >
                QUAY TIẾP NGAY
              </button>
            </div>
          )}

          {/* Dynamic Active Tab Card Content */}
          <div className="bg-bg-secondary border border-border-main p-6 rounded-[6px] flex-1 flex flex-col justify-between">
            
            {/* TAB: LUCKY SPIN */}
            {activeTab === "spin" && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="font-press-start text-sm text-primary mb-3">
                    SẢNH VÒNG QUAY MAY MẮN
                  </h2>
                  <div className="flex justify-center my-4">
                    <div className="relative w-[240px] h-[240px]">
                      <canvas ref={canvasRef} width={240} height={240} className="w-full h-full" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border-main/50 pt-4">
                  {/* Bet inputs */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold uppercase">Số xu cược:</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={customBetInput}
                        onChange={(e) => setCustomBetInput(e.target.value)}
                        onBlur={handleCustomBetBlur}
                        disabled={isSpinning}
                        className="pixel-border-border rounded-[4px] bg-bg text-primary text-xs px-2 py-1 font-mono w-24 text-right focus:outline-none"
                      />
                      <span className="text-sm text-text-muted">🪙</span>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={1000}
                      max={state.coins}
                      step={1000}
                      value={bet}
                      onChange={(e) => handleBetChange(Number(e.target.value))}
                      disabled={isSpinning}
                      className="w-full accent-primary bg-bg"
                    />
                    <div className="flex justify-between text-sm text-text-muted font-mono">
                      <span>1K</span>
                      <span>{Math.round(riskRatio * 100)}% ({riskText})</span>
                      <span>MAX</span>
                    </div>
                  </div>

                  {/* Outcomes Table Grid */}
                  <div className="grid grid-cols-2 gap-4 bg-bg p-3 rounded-[6px] border border-border-main/30">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-text-muted uppercase border-b border-border-main/20 pb-0.5 mb-1">
                        Bảng hệ số nhận
                      </div>
                      {WHEEL_SECTORS.map((item, i) => {
                        const isPositive = item.value > 0;
                        const finalScale = isPositive ? scalingFactor : 1.0;
                        const val = isPositive 
                          ? Math.floor(bet * item.value * finalScale)
                          : Math.floor(bet * Math.abs(item.value));

                        return (
                          <div key={i} className="flex justify-between text-sm font-mono">
                            <span className={item.type === "loss" ? "text-danger" : "text-success"}>{item.label}</span>
                            <span className={isPositive ? "text-success" : "text-danger"}>
                              {isPositive ? "+" : "-"}
                              {val.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col justify-between border-l border-border-main/30 pl-3">
                      <div>
                        <div className="text-sm font-bold text-text-muted uppercase border-b border-border-main/20 pb-0.5 mb-1 text-center">
                          Reroll miễn phí
                        </div>
                        <div className="text-lg font-mono font-bold text-success text-center py-1">
                          {state.spin.rerollsRemaining}/5
                        </div>
                        <p className="text-sm text-text-muted text-center leading-tight">
                          Dùng để quay lại kết quả vừa nhận
                        </p>
                      </div>

                      {recentResult && !hasRerolled && state.spin.rerollsRemaining > 0 && (
                        <button
                          onClick={handleReroll}
                          disabled={isSpinning}
                          className="w-full retro-btn bg-purple text-black text-xs py-1.5 font-bold"
                        >
                          🎲 REROLL
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center justify-between border border-border-main/80 rounded-[6px] p-1 bg-bg px-2">
                      <span className="text-sm text-text-muted">MIỄN PHÍ</span>
                      <button
                        onClick={() => handleSpin(true)}
                        disabled={isSpinning || state.spin.freeSpinUsed}
                        className="retro-btn bg-success text-black text-xs px-2 py-0.5 font-bold"
                      >
                        {state.spin.freeSpinUsed ? "0/1" : "1/1"}
                      </button>
                    </div>

                    <button
                      onClick={() => handleSpin(false)}
                      disabled={isSpinning}
                      className="flex-1 retro-btn bg-primary text-black py-3 text-sm font-bold"
                    >
                      {isSpinning ? "ĐANG QUAY..." : "QUAY NGAY"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REACTION MINI GAME */}
            {activeTab === "game" && (
              <div className="space-y-4">
                <h2 className="font-press-start text-sm text-primary">REACTION MINI-GAME</h2>
                <p className="text-sm text-text-muted">
                  Bấm nút dừng khi vòng tròn chuyển sang màu xanh lá! Đo thời gian phản xạ để nhận phần thưởng xu.
                </p>

                <div 
                  onClick={reactionState === "trigger" || reactionState === "waiting" ? pressReactionBtn : undefined}
                  className="h-44 bg-bg border border-border-main rounded-[6px] flex items-center justify-center relative overflow-hidden cursor-pointer"
                >
                  {reactionState === "trigger" ? (
                    <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center animate-ping duration-300" />
                  ) : reactionState === "waiting" ? (
                    <div className="w-14 h-14 bg-yellow-500 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-14 h-14 bg-border-main rounded-full" />
                  )}

                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                    {reactionResultMsg || "Nhấn nút bên dưới để bắt đầu"}
                  </div>
                </div>

                <button
                  onClick={reactionActive ? pressReactionBtn : triggerReactionGame}
                  className={`w-full retro-btn py-3 text-sm font-bold ${
                    reactionActive ? "bg-danger text-white" : "bg-primary text-black"
                  }`}
                >
                  {reactionState === "waiting" 
                    ? "BẤM NGAY KHI CÓ XANH LÁ!" 
                    : reactionState === "trigger" 
                    ? "🎯 BẤM NGAY!" 
                    : "BẮT ĐẦU CHƠI"}
                </button>
              </div>
            )}

            {/* TAB: SHOP */}
            {activeTab === "shop" && (
              <div className="space-y-4">
                <h2 className="font-press-start text-sm text-primary">CỬA HÀNG ĐỔI THƯỞNG</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {state.rewards.map((item) => {
                    const finalPrice = discountActive ? Math.floor(item.price * 0.9) : item.price;
                    const canAfford = state.coins >= finalPrice;

                    return (
                      <div
                        key={item.id}
                        className="border border-border-main bg-bg p-3 rounded-[6px] flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{item.icon}</span>
                          <div>
                            <div className="text-sm font-bold">{item.name}</div>
                            <div className="text-sm text-text-muted mt-0.5">{item.desc || "Món quà sinh nhật giá trị!"}</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-border-main/20 pt-2">
                          <span className="text-sm font-mono font-bold text-yellow-400">
                            {discountActive ? (
                              <>
                                <span className="line-through text-text-muted mr-1.5">
                                  {item.price.toLocaleString()}
                                </span>
                                {finalPrice.toLocaleString()}
                              </>
                            ) : (
                              item.price.toLocaleString()
                            )} xu
                          </span>

                          <button
                            onClick={() => handleRedeemItem(item.id)}
                            disabled={!canAfford}
                            className={`retro-btn text-xs px-3 py-1 font-bold ${
                              canAfford ? "bg-primary text-black" : "bg-disabled text-white"
                            }`}
                          >
                            ĐỔI QUÀ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: INVENTORY */}
            {activeTab === "inventory" && (
              <div className="space-y-4">
                <h2 className="font-press-start text-sm text-primary">KHO ĐỒ QUÀ TẶNG</h2>
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {state.inventory.length > 0 ? (
                    state.inventory.map((item) => (
                      <div
                        key={item.id}
                        className="border border-border-main bg-bg p-3 rounded-[6px] flex justify-between items-center gap-4"
                      >
                        <div>
                          <div className="text-sm font-bold text-white">{item.name}</div>
                          <div className="text-sm text-text-muted font-mono mt-0.5">
                            Mã: <span className="text-primary font-bold select-all tracking-wider font-mono">{item.claimCode}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm text-success bg-green-950/20 border border-success/30 px-2 py-0.5 rounded-[4px] font-bold block">
                            {item.status}
                          </span>
                          <span className="text-sm text-text-muted font-mono mt-1 block">
                            {new Date(item.redeemedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-muted italic text-center py-10">Chưa đổi món quà nào. Quay xu để tích trữ rồi đổi nhé!</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MILESTONES */}
            {activeTab === "milestones" && (
              <div className="space-y-4">
                <h2 className="font-press-start text-sm text-primary">TIẾN TRÌNH CỘT MỐC</h2>
                
                <div className="bg-bg p-4 rounded-[6px] border border-border-main/50 space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold uppercase">
                    <span>Cột mốc tiếp theo: {nextMilestone.name}</span>
                    <span className="text-primary">{percentage}%</span>
                  </div>
                  <div className="text-sm text-text-muted">
                    Phần quà nhận được: <strong>{nextMilestone.rewardName}</strong>
                  </div>

                  <div className="h-5 bg-bg-secondary rounded-[4px] border border-border-main overflow-hidden flex items-center">
                    <div className="h-full bg-accent" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="flex justify-between text-sm text-text-muted font-mono">
                    <span>Tích lũy: {earned.toLocaleString()} xu</span>
                    <span>Cần cày thêm: {(nextMilestone.value - earned).toLocaleString()} xu</span>
                  </div>
                </div>

                <div className="border-t border-border-main/30 pt-4">
                  <div className="text-sm font-press-start text-text-muted uppercase mb-3">Danh hiệu tích lũy:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { name: "Beginner", limit: 100000, emoji: "🥉" },
                      { name: "Coin Collector", limit: 250000, emoji: "🥈" },
                      { name: "Coin Hunter", limit: 500000, emoji: "🥇" },
                      { name: "Millionaire", limit: 1000000, emoji: "💎" },
                      { name: "Birthday Master", limit: 2500000, emoji: "👑" },
                      { name: "Birthday Legend", limit: 5000000, emoji: "🌟" }
                    ].map((ach) => {
                      const isUnlocked = earned >= ach.limit;
                      return (
                        <div
                          key={ach.name}
                          className={`p-2.5 border rounded-[6px] text-center flex flex-col items-center gap-1 ${
                            isUnlocked ? "bg-bg border-success/30 text-success" : "bg-bg/40 border-border-main/20 text-text-muted opacity-50"
                          }`}
                        >
                          <span className="text-2xl">{ach.emoji}</span>
                          <span className="text-sm font-bold truncate block w-full">{ach.name}</span>
                          <span className="text-sm font-mono text-text-muted">{(ach.limit / 1000).toFixed(0)}K</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <h2 className="font-press-start text-sm text-primary">CÀI ĐẶT HỆ THỐNG</h2>
                
                <div className="bg-bg p-4 rounded-[6px] border border-border-main/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Âm thanh 8-bit retro:</span>
                    <button
                      onClick={() => {
                        const next = !state.settings.soundEnabled;
                        setSoundEnabled(next);
                        updateStateAndSync({ ...state, settings: { ...state.settings, soundEnabled: next } });
                      }}
                      className={`retro-btn px-4 py-1.5 text-sm font-bold ${
                        state.settings.soundEnabled ? "bg-success text-black" : "bg-disabled text-white"
                      }`}
                    >
                      {state.settings.soundEnabled ? "🔊 BẬT" : "🔇 TẮT"}
                    </button>
                  </div>

                  <div className="pt-4 border-t border-border-main/30 flex flex-col gap-2">
                    <Link
                      href="/mechanics"
                      className="retro-btn bg-purple text-black text-center py-2 text-sm block"
                    >
                      MỞ BẢNG ĐIỀU HÀNH & CHEAT (/mechanics)
                    </Link>

                    <button
                      onClick={async () => {
                        if (confirm("Reset game?")) {
                          const clean = { ...INITIAL_STATE };
                          clean.lifetimeEarned = 820000;
                          clean.daily.streak = 1;
                          clean.achievements = ["🥉 Beginner", "🥈 Coin Collector", "🥇 Coin Hunter"];
                          await updateStateAndSync(clean);
                          alert("Đã reset!");
                        }
                      }}
                      className="retro-btn bg-danger text-white py-2 text-sm block"
                    >
                      RESET TIẾN TRÌNH CÁ NHÂN
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Bottom History Log (Center Column) */}
          <div className="bg-bg-secondary border border-border-main p-4 rounded-[6px]">
            <h3 className="font-mono text-sm text-text-muted uppercase mb-2 font-bold tracking-wider">
              LỊCH SỬ ĐẤU GẦN NHẤT / GIAO DỊCH GẦN ĐÂY
            </h3>
            <div className="max-h-20 overflow-y-auto space-y-1 font-mono text-xs leading-tight pr-1">
              {state.transactions.length > 0 ? (
                state.transactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="flex justify-between border-b border-border-main/10 pb-0.5">
                    <span className="text-text-muted truncate max-w-[320px]">
                      [{new Date(tx.timestamp).toLocaleTimeString()}] {tx.reason}
                    </span>
                    <span className={tx.type === "plus" ? "text-success font-bold" : "text-danger font-bold"}>
                      {tx.type === "plus" ? "+" : "-"}
                      {tx.amount.toLocaleString()} xu (Dư: {tx.balanceAfter.toLocaleString()})
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-text-muted italic text-xs">Chưa thực hiện giao dịch nào.</div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Right Column (3 Columns wide - Holds Profile stats, Quests, Attendance) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col">
          
          {/* User Profile / Elo Card */}
          <section className="bg-bg-secondary border border-border-main p-4 rounded-[6px] space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-xl border border-primary/50">
                🐣
              </div>
              <div className="truncate">
                <div className="font-bold text-sm text-white truncate">{username}</div>
                <div className="text-sm text-primary font-bold uppercase mt-0.5">{rankTitle} | Cấp {1 + Math.floor(earned / 250000)}</div>
              </div>
            </div>

            {/* Exp bar */}
            <div className="space-y-1 border-t border-border-main/30 pt-2 text-xs">
              <div className="flex justify-between text-text-muted font-mono">
                <span>Kinh nghiệm:</span>
                <span className="text-white font-bold">{earned.toLocaleString()} / {nextMilestone.value.toLocaleString()} XP</span>
              </div>
              <div className="h-2 bg-bg rounded-[2px] border border-border-main/50 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
              </div>
            </div>

            {/* Custom ratings list matching Vuiga style */}
            <div className="space-y-1.5 border-t border-border-main/30 pt-3">
              {[
                { name: "Vòng quay", elo: `Quay: ${spinsCount} lần`, badge: "Tỷ lệ: 60/40" },
                { name: "Mini-game", elo: bestReaction ? `Phản xạ: ${bestReaction}ms` : "Chưa đấu", badge: "Kỷ lục" },
                { name: "Cửa hàng", elo: `Đã đổi: ${state.inventory.length} quà`, badge: "Kho đồ" },
                { name: "Thành tựu", elo: `Mở khóa: ${state.achievements.length}/6`, badge: "Danh hiệu" }
              ].map((game, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-mono leading-tight">
                  <span className="text-text-muted">{game.name}</span>
                  <div className="flex items-center gap-1.5 text-right">
                    <span className="text-white font-bold">{game.elo}</span>
                    <span className="text-xs bg-primary/10 border border-primary/30 text-primary px-1 rounded-sm">{game.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Daily Quests Card */}
          <section className="bg-bg-secondary border border-border-main p-4 rounded-[6px] space-y-3 flex-1 flex flex-col justify-between">
            <h3 className="font-mono text-sm text-text-muted uppercase font-bold tracking-wider flex items-center gap-1 border-b border-border-main/30 pb-1.5">
              <span>🎯</span>
              <span>Nhiệm vụ hàng ngày</span>
            </h3>

            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {[
                { key: "spinOnce", label: "Quay vòng quay 1 lần", reward: "+5.000", target: 1 },
                { key: "playMiniGame", label: "Chơi mini game 1 lần", reward: "+10.000", target: 1 },
                { key: "allQuests", label: "Hoàn thành tất cả nhiệm vụ", reward: "+20.000", target: 2 }
              ].map((q) => {
                const quest = state.daily.quests[q.key] || { completed: false, claimed: false };
                const currentProgress = q.key === "allQuests" ? completedQuestCount : (quest.completed ? 1 : 0);
                
                return (
                  <div key={q.key} className="text-xs leading-tight space-y-0.5">
                    <div className="flex justify-between text-white font-bold">
                      <span className="truncate max-w-[130px]">{q.label}</span>
                      <span className="font-mono text-text-muted">{currentProgress}/{q.target}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-mono">
                      <span className="text-success">{q.reward} xu</span>
                      {quest.claimed ? (
                        <span className="text-success font-bold">ĐÃ NHẬN</span>
                      ) : quest.completed ? (
                        <button
                          onClick={() => handleClaimQuest(q.key)}
                          className="bg-success text-black px-1 py-0.5 rounded-sm font-bold text-xs"
                        >
                          NHẬN
                        </button>
                      ) : (
                        <span className="text-text-muted italic">ĐANG LÀM</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Daily Attendance Card */}
          <section className="bg-bg-secondary border border-border-main p-4 rounded-[6px] space-y-3">
            <div className="flex justify-between items-center border-b border-border-main/30 pb-1.5">
              <h3 className="font-mono text-sm text-text-muted uppercase font-bold tracking-wider flex items-center gap-1">
                <span>📅</span>
                <span>Điểm danh 7 ngày</span>
              </h3>
              <span className="text-xs bg-danger text-black px-1.5 py-0.5 rounded-full font-bold">
                Chuỗi: {state.daily.streak}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isClaimed = state.daily.streak >= day && state.daily.lastClaimDate;
                const isNext = state.daily.streak + 1 === day || (state.daily.streak === 0 && day === 1);
                
                return (
                  <div
                    key={day}
                    className={`border p-1 rounded-sm text-center text-xs ${
                      isClaimed
                        ? "bg-bg-secondary text-success border-success/30 opacity-70"
                        : isNext
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-bg text-text-muted border-border-main/40"
                    }`}
                  >
                    <span className="block font-bold">D{day}</span>
                    <span className="block font-mono font-bold mt-0.5">
                      {[10, 15, 20, 25, 30, 40, 100][day - 1]}K
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleCheckin}
              disabled={
                state.daily.lastClaimDate &&
                isSameDay(new Date(state.daily.lastClaimDate), new Date())
              }
              className="w-full retro-btn bg-primary text-black py-1.5 text-sm font-bold"
            >
              {state.daily.lastClaimDate &&
              isSameDay(new Date(state.daily.lastClaimDate), new Date())
                ? "ĐÃ NHẬN HÔM NAY"
                : "NHẬN ĐIỂM DANH NGAY"}
            </button>
            <div className="text-sm text-text-muted text-center font-mono">
              Reset sau: {countdown}
            </div>
          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-border-main bg-bg-secondary/20 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center">
        <div className="text-sm text-text-muted font-mono">
          Made with ❤️ for a special birthday!
        </div>
        <div className="text-sm text-text-muted font-mono flex gap-4">
          <Link href="/mechanics" className="text-purple hover:underline">🔧 Bảng Dev / Mechanics</Link>
          <span>Birthday Gift Game © 2026</span>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <div className="flex lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary border-t border-border-main h-16 items-center justify-around px-2 shadow-glow">
        {[
          { id: "spin", label: "Vòng quay", icon: "🎰" },
          { id: "game", label: "Mini Game", icon: "🎮" },
          { id: "shop", label: "Cửa hàng", icon: "🏬" },
          { id: "inventory", label: "Kho đồ", icon: "🎒" },
          { id: "milestones", label: "Cột mốc", icon: "🏆" }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? "text-primary font-bold" : "text-text-muted"
              }`}
            >
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
