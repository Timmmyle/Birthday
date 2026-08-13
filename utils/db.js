import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Initial Reward Shop Configuration
export const DEFAULT_REWARDS = [
  { id: "snack", name: "🍫 Hộp Đồ Ăn Vặt", price: 100000, desc: "Món ăn ngọt ngào thơm ngon!", icon: "🍫" },
  { id: "milk_tea", name: "🥤 Trà Sữa Trân Châu", price: 200000, desc: "Một ly trà sữa trân châu full topping!", icon: "🥤" },
  { id: "meal", name: "🍜 Bữa Ăn Yêu Thích", price: 250000, desc: "Bữa ăn thịnh soạn theo ý muốn của bạn!", icon: "🍜" },
  { id: "roblox", name: "🎮 Thẻ Quà Tặng Roblox", price: 500000, desc: "Thẻ nạp Robux tha hồ mua đồ game!", icon: "🎮" },
  { id: "minecraft", name: "⛏️ Thẻ Quà Tặng Minecraft", price: 500000, desc: "Thẻ nạp Minecoins xây dựng thế giới riêng!", icon: "⛏️" },
  { id: "gundam", name: "🤖 Mô Hình Gundam Mini", price: 1000000, desc: "Bộ lắp ráp mô hình robot cực chất!", icon: "🤖" },
  { id: "blocks", name: "🧱 Bộ Xếp Hình Lego", price: 1000000, desc: "Bộ đồ chơi xếp hình rèn luyện trí tuệ!", icon: "🧱" },
  { id: "controller", name: "🎮 Tay Cầm Chơi Game", price: 2000000, desc: "Tay cầm điều khiển không dây siêu mượt!", icon: "🎮" },
  { id: "headset", name: "🎧 Tai Nghe Gaming", price: 2500000, desc: "Tai nghe âm thanh vòm sống động, cản tiếng ồn!", icon: "🎧" },
  { id: "keyboard", name: "⌨️ Bàn Phím Cơ", price: 5000000, desc: "Bàn phím gõ êm ái, đèn LED RGB rực rỡ!", icon: "⌨️" },
  { id: "mystery", name: "🎁 Hộp Quà Bí Ẩn", price: 3000000, desc: "Hộp quà ngẫu nhiên chứa đựng bất ngờ lớn!", icon: "🎁" },
];

export const MILESTONES = [
  { value: 100000, name: "🥉 Beginner", rewardName: "Gói Đồ Ăn Vặt" },
  { value: 250000, name: "🥈 Coin Collector", rewardName: "Trà Sữa Trân Châu" },
  { value: 500000, name: "🥇 Coin Hunter", rewardName: "Bữa Ăn Yêu Thích" },
  { value: 1000000, name: "💎 Millionaire", rewardName: "Thẻ Quà Tặng Minecraft" },
  { value: 2500000, name: "👑 Birthday Master", rewardName: "Tay Cầm Chơi Game" },
  { value: 5000000, name: "🌟 Birthday Legend", rewardName: "Bàn Phím Cơ Xịn" },
];

export const INITIAL_STATE = {
  coins: 50000,
  lifetimeEarned: 50000,
  lifetimeSpent: 0,

  daily: {
    streak: 0,
    lastClaimDate: null,
    quests: {
      spinOnce: { completed: false, claimed: false },
      playMiniGame: { completed: false, claimed: false },
      allQuests: { completed: false, claimed: false }
    }
  },

  spin: {
    freeSpinUsed: false,
    paidSpinsToday: 0,
    rerollsRemaining: 5,
    rerolledSpinIds: []
  },

  inventory: [],
  transactions: [],
  achievements: [],

  settings: {
    soundEnabled: false
  },
  rewards: DEFAULT_REWARDS
};

// Helper to check if two dates are the same calendar day
export function isSameDay(date1, date2) {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Generate unique transaction IDs
function genId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Immutable State Modifiers
export function addCoins(state, amount, reason) {
  const updatedCoins = state.coins + amount;
  const updatedLifetime = state.lifetimeEarned + amount;
  
  // Check achievements
  const newAchievements = [...state.achievements];
  MILESTONES.forEach(m => {
    if (updatedLifetime >= m.value && !newAchievements.includes(m.name)) {
      newAchievements.push(m.name);
    }
  });

  const tx = {
    id: genId(),
    timestamp: new Date().toISOString(),
    type: "plus",
    amount,
    balanceAfter: updatedCoins,
    reason
  };

  return {
    ...state,
    coins: updatedCoins,
    lifetimeEarned: updatedLifetime,
    transactions: [tx, ...state.transactions].slice(0, 100), // Limit history length to 100
    achievements: newAchievements
  };
}

export function removeCoins(state, amount, reason) {
  const updatedCoins = Math.max(0, state.coins - amount);
  const updatedSpent = state.lifetimeSpent + amount;

  const tx = {
    id: genId(),
    timestamp: new Date().toISOString(),
    type: "minus",
    amount,
    balanceAfter: updatedCoins,
    reason
  };

  return {
    ...state,
    coins: updatedCoins,
    lifetimeSpent: updatedSpent,
    transactions: [tx, ...state.transactions].slice(0, 100)
  };
}

export function completeQuest(state, questKey) {
  const quests = { ...state.daily.quests };
  if (!quests[questKey]) return state;
  if (quests[questKey].completed) return state;

  quests[questKey] = {
    ...quests[questKey],
    completed: true
  };

  // Check if both first two are completed to auto-complete the third
  if (questKey !== 'allQuests') {
    const spinDone = quests.spinOnce?.completed;
    const gameDone = quests.playMiniGame?.completed;
    if (spinDone && gameDone) {
      quests.allQuests = {
        ...quests.allQuests,
        completed: true
      };
    }
  }

  return {
    ...state,
    daily: {
      ...state.daily,
      quests
    }
  };
}

export function claimQuestReward(state, questKey) {
  const quests = { ...state.daily.quests };
  if (!quests[questKey] || !quests[questKey].completed || quests[questKey].claimed) {
    return state;
  }

  quests[questKey] = {
    ...quests[questKey],
    claimed: true
  };

  let reward = 0;
  let reason = "";
  if (questKey === "spinOnce") {
    reward = 5000;
    reason = "Quest: Spin once";
  } else if (questKey === "playMiniGame") {
    reward = 10000;
    reason = "Quest: Play a mini game";
  } else if (questKey === "allQuests") {
    reward = 20000;
    reason = "Quest: Complete all quests";
  }

  const stateWithReward = addCoins(state, reward, reason);
  return {
    ...stateWithReward,
    daily: {
      ...stateWithReward.daily,
      quests
    }
  };
}

export function claimDailyReward(state) {
  const today = new Date().toISOString();
  const lastClaim = state.daily.lastClaimDate;

  if (lastClaim && isSameDay(new Date(lastClaim), new Date(today))) {
    return state; // Already claimed today
  }

  // Calculate new streak
  let newStreak = state.daily.streak;
  if (lastClaim) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If last claim was yesterday, increment streak. Otherwise, reset to 1
    if (isSameDay(new Date(lastClaim), yesterday)) {
      newStreak = (newStreak % 7) + 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  // Define reward table
  const rewardTable = {
    1: 10000,
    2: 15000,
    3: 20000,
    4: 25000,
    5: 30000,
    6: 40000,
    7: 100000
  };

  const amount = rewardTable[newStreak] || 10000;
  const stateWithCoins = addCoins(state, amount, `Daily Check-in (Day ${newStreak})`);

  return {
    ...stateWithCoins,
    daily: {
      ...stateWithCoins.daily,
      streak: newStreak,
      lastClaimDate: today
    }
  };
}

export function redeemReward(state, rewardId) {
  const rewards = state.rewards || DEFAULT_REWARDS;
  const item = rewards.find(r => r.id === rewardId);
  if (!item || state.coins < item.price) return state;

  const stateWithDeduction = removeCoins(state, item.price, `Redeemed ${item.name}`);

  const claimCode = `BQ-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const newItem = {
    id: genId(),
    rewardId: item.id,
    name: item.name,
    redeemedAt: new Date().toISOString(),
    claimCode,
    status: "🎁 Ready to Claim"
  };

  return {
    ...stateWithDeduction,
    inventory: [newItem, ...stateWithDeduction.inventory]
  };
}

// Check and reset daily stats if a new day has arrived
export function checkDailyReset(state) {
  const today = new Date();
  const lastReset = state.spin.lastResetDate;

  if (lastReset && isSameDay(new Date(lastReset), today)) {
    return state; // Same day, no reset needed
  }

  // It's a new day! Reset spin limits, free spin, and quests
  return {
    ...state,
    spin: {
      ...state.spin,
      freeSpinUsed: false,
      paidSpinsToday: 0,
      lastResetDate: today.toISOString()
    },
    daily: {
      ...state.daily,
      quests: {
        spinOnce: { completed: false, claimed: false },
        playMiniGame: { completed: false, claimed: false },
        allQuests: { completed: false, claimed: false }
      }
    }
  };
}

// Sync with Supabase (if connected) or LocalStorage
export async function syncGameState(state, userId = null) {
  if (typeof window === 'undefined') return;

  // 1. Save to LocalStorage
  localStorage.setItem('birthday_quest_state', JSON.stringify(state));

  // 2. Save to Supabase if config exists and user is authenticated
  if (supabase && userId) {
    try {
      // Upsert profile
      let userEmail = undefined;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && authUser.email) {
        userEmail = authUser.email;
      }

      let formattedClaimDate = null;
      if (state.daily.lastClaimDate) {
        try {
          const d = new Date(state.daily.lastClaimDate);
          if (!isNaN(d.getTime())) {
            formattedClaimDate = d.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error("Invalid claim date parse:", e);
        }
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userEmail,
          coins: Number(state.coins),
          lifetime_earned: Number(state.lifetimeEarned),
          lifetime_spent: Number(state.lifetimeSpent),
          daily_streak: Number(state.daily.streak),
          last_claim_date: formattedClaimDate,
          rerolls_remaining: Number(state.spin.rerollsRemaining),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error("=== SUPABASE ERROR DETAILS ===");
        console.error("Raw Error Object:", profileError);
        console.error("Error String:", String(profileError));
        console.error("Error Type:", typeof profileError);
        if (profileError && typeof profileError === 'object') {
          console.error("Error Keys:", Object.keys(profileError));
          console.error("Error Message:", profileError.message);
          console.error("Error Code:", profileError.code);
          console.error("Error Details:", profileError.details);
        }
        console.error("=============================");
      }

      // Save transactions (typically we would append, but since we are just sync'ing, we'll sync recent ones)
      if (state.transactions.length > 0) {
        // Just sync the latest transaction
        const latestTx = state.transactions[0];
        await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            type: latestTx.type,
            amount: latestTx.amount,
            balance_after: latestTx.balanceAfter,
            reason: latestTx.reason,
            timestamp: latestTx.timestamp
          })
          .setHeader('Prefer', 'resolution=merge-duplicates'); // Ignore if exists
      }

      // Sync inventory
      if (state.inventory.length > 0) {
        // Upsert inventory records
        const records = state.inventory.map(item => ({
          user_id: userId,
          reward_id: item.rewardId,
          redeemed_at: item.redeemedAt,
          claim_code: item.claimCode,
          status: item.status
        }));
        await supabase.from('inventory').upsert(records);
      }
    } catch (e) {
      console.error("Supabase sync failed:", e);
    }
  }
}

// Load Game State
export async function loadGameStateFromDB(userId = null) {
  if (typeof window === 'undefined') return INITIAL_STATE;

  // 1. Check if Supabase is setup and we have user
  if (supabase && userId) {
    try {
      // Fetch profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profileErr && profile) {
        // Fetch inventory
        const { data: inventory } = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', userId);

        // Fetch transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(100);

        // Convert db values to state model
        const loadedState = {
          coins: Number(profile.coins),
          lifetimeEarned: Number(profile.lifetime_earned),
          lifetimeSpent: Number(profile.lifetime_spent),
          daily: {
            streak: profile.daily_streak || 0,
            lastClaimDate: profile.last_claim_date || null,
            quests: {
              spinOnce: { completed: false, claimed: false },
              playMiniGame: { completed: false, claimed: false },
              allQuests: { completed: false, claimed: false }
            }
          },
          spin: {
            freeSpinUsed: false,
            paidSpinsToday: 0,
            rerollsRemaining: profile.rerolls_remaining || 5,
            rerolledSpinIds: []
          },
          inventory: (inventory || []).map(item => ({
            id: item.id,
            rewardId: item.reward_id,
            redeemedAt: item.redeemed_at,
            claimCode: item.claim_code,
            status: item.status
          })),
          transactions: (transactions || []).map(tx => ({
            id: tx.id,
            timestamp: tx.timestamp,
            type: tx.type,
            amount: Number(tx.amount),
            balanceAfter: Number(tx.balance_after),
            reason: tx.reason
          })),
          achievements: [], // Rebuild from milestones
          settings: {
            soundEnabled: false
          },
          rewards: DEFAULT_REWARDS
        };

        // Rebuild achievements
        MILESTONES.forEach(m => {
          if (loadedState.lifetimeEarned >= m.value) {
            loadedState.achievements.push(m.name);
          }
        });

        // Sync to localstorage too
        localStorage.setItem('birthday_quest_state', JSON.stringify(loadedState));
        return loadedState;
      }
    } catch (e) {
      console.error("Failed to load from Supabase:", e);
    }
  }

  // 2. Fallback to LocalStorage
  const local = localStorage.getItem('birthday_quest_state');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      // Ensure basic structure is intact
      return {
        ...INITIAL_STATE,
        ...parsed,
        daily: { ...INITIAL_STATE.daily, ...parsed.daily },
        spin: { ...INITIAL_STATE.spin, ...parsed.spin },
        settings: { ...INITIAL_STATE.settings, ...parsed.settings },
        rewards: parsed.rewards || DEFAULT_REWARDS
      };
    } catch (e) {
      console.error("Local storage corrupt, resetting to initial state");
      return INITIAL_STATE;
    }
  }

  return INITIAL_STATE;
}
