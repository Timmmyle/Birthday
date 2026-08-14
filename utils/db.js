import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Initial Reward Shop Configuration
export const DEFAULT_REWARDS = [
  { id: "sticker_small", name: "🎨 Sticker Nhỏ", price: 50000, desc: "Miếng dán hình cute trang trí (3k-5k VND)", icon: "🎨" },
  { id: "candy", name: "🍭 Kẹo Dẻo / Kẹo Que", price: 50000, desc: "Kẹo que ngọt ngào đầy màu sắc (3k-5k VND)", icon: "🍭" },
  { id: "sticker_set", name: "🏷️ Bộ Sticker Set", price: 100000, desc: "Set hình dán đa dạng chủ đề (5k-10k VND)", icon: "🏷️" },
  { id: "keychain_small", name: "🔑 Móc Khóa Nhỏ", price: 100000, desc: "Móc chìa khóa mini tiện lợi (8k-15k VND)", icon: "🔑" },
  { id: "squishy_mini", name: "🧸 Squishy Mini", price: 150000, desc: "Đồ chơi bóp tay xả stress đáng yêu (10k-20k VND)", icon: "🧸" },
  { id: "pen_multi", name: "🖊️ Bút Nhiều Màu", price: 150000, desc: "Bút viết nhiều màu sắc tiện dụng (10k-15k VND)", icon: "🖊️" },
  { id: "keychain_cute", name: "🎀 Móc Khóa Cute", price: 200000, desc: "Móc khóa hình nhân vật dễ thương (15k-25k VND)", icon: "🎀" },
  { id: "spinner", name: "🌀 Fidget Spinner Đơn Giản", price: 200000, desc: "Spinner xoay tay giảm căng thẳng (15k-25k VND)", icon: "🌀" },
  { id: "slime", name: "🧪 Chất Nhờn Slime", price: 250000, desc: "Slime dẻo dai nhiều màu sắc (20k-30k VND)", icon: "🧪" },
  { id: "model_mini", name: "🤖 Mô Hình Lắp Ráp Mini", price: 300000, desc: "Bộ lắp ráp mô hình robot mini (~29k-35k VND)", icon: "🤖" },
  { id: "lego_mini", name: "🧱 LEGO Mini", price: 300000, desc: "Bộ xếp hình lego cỡ nhỏ thú vị (~25k-35k VND)", icon: "🧱" },
  { id: "rubik", name: "🎲 Rubik 3x3 Cơ Bản", price: 400000, desc: "Khối rubik xoay mượt mà rèn luyện trí não (30k-50k VND)", icon: "🎲" },
  { id: "usb_lamp", name: "💡 Đèn Ngủ Mini USB", price: 500000, desc: "Đèn ngủ cắm cổng USB tiện lợi (40k-60k VND)", icon: "💡" },
  { id: "figure_small", name: "🧸 Mô Hình Nhân Vật Nhỏ", price: 500000, desc: "Mô hình chibi nhân vật yêu thích (40k-60k VND)", icon: "🧸" },
  { id: "toy_large", name: "🧩 Đồ Chơi Lắp Ráp Lớn", price: 600000, desc: "Mô hình lắp ráp cỡ vừa (50k-70k VND)", icon: "🧩" },
  { id: "lego_beautiful", name: "🏰 Mô Hình LEGO Mini Đẹp", price: 700000, desc: "Lego mini chi tiết đẹp mắt (~70k VND)", icon: "🏰" },
  { id: "puzzle", name: "🧩 Bộ Xếp Hình Tranh", price: 800000, desc: "Tranh ghép hình rèn luyện kiên nhẫn (60k-90k VND)", icon: "🧩" },
  { id: "figure_pokemon", name: "🐉 Mô Hình Pokémon / Nhân Vật", price: 900000, desc: "Mô hình nhân vật chất lượng cao (80k-100k VND)", icon: "🐉" },
  { id: "mouse_wired", name: "🖱️ Chuột Có Dây", price: 1000000, desc: "Chuột máy tính có dây văn phòng nhạy bén (80k-120k VND)", icon: "🖱️" },
  { id: "earphone_wired", name: "🎧 Tai Nghe Có Dây", price: 1000000, desc: "Tai nghe nhét tai âm thanh rõ nét (70k-120k VND)", icon: "🎧" },
  { id: "keyboard_mini", name: "⌨️ Bàn Phím Mini", price: 1000000, desc: "Bàn phím nhỏ gọn tiện mang theo (~99k-130k VND)", icon: "⌨️" },
  { id: "mouse_gaming_cheap", name: "🖱️ Chuột Gaming Giá Rẻ", price: 1200000, desc: "Chuột gaming phân khúc giá rẻ (100k-150k VND)", icon: "🖱️" },
  { id: "air_mouse", name: "⌨️ Chuột Bay + Bàn Phím Mini", price: 1300000, desc: "Thiết bị điều khiển đa năng tiện lợi (~100k-130k VND)", icon: "⌨️" },
  { id: "headphone_bt_cheap", name: "🎧 Tai Nghe Bluetooth Giá Rẻ", price: 1500000, desc: "Tai nghe không dây nghe nhạc êm ái (120k-180k VND)", icon: "🎧" },
  { id: "led_lamp", name: "💡 Đèn LED Để Bàn", price: 1500000, desc: "Đèn học LED chống cận thị (100k-180k VND)", icon: "💡" },
  { id: "model_large", name: "🤖 Bộ Mô Hình Lớn", price: 1800000, desc: "Mô hình lắp ráp kích thước lớn (~180k VND)", icon: "🤖" },
  { id: "gamepad_cheap", name: "🎮 Tay Cầm Chơi Game Giá Rẻ", price: 2000000, desc: "Tay cầm chơi game PC/Console cơ bản (150k-220k VND)", icon: "🎮" },
  { id: "speaker_bt", name: "🔊 Loa Bluetooth Mini", price: 2000000, desc: "Loa không dây âm bass hay nhỏ gọn (150k-220k VND)", icon: "🔊" },
  { id: "mouse_gaming_good", name: "🖱️ Chuột Gaming Tốt", price: 2500000, desc: "Chuột chơi game chuyên nghiệp siêu nhạy (200k-280k VND)", icon: "🖱️" },
  { id: "headset_gaming", name: "🎧 Tai Nghe Gaming", price: 2500000, desc: "Tai nghe gaming ôm tai cách âm tốt (200k-300k VND)", icon: "🎧" },
  { id: "keyboard_mech_cheap", name: "⌨️ Bàn Phím Cơ Giá Rẻ", price: 3000000, desc: "Bàn phím cơ gõ clicky vui tai (250k-350k VND)", icon: "⌨️" },
  { id: "gamepad_bt", name: "🎮 Tay Cầm Bluetooth Tốt", price: 3000000, desc: "Tay không dây kết nối điện thoại/PC mượt (250k-350k VND)", icon: "🎮" },
  { id: "headset_gaming_good", name: "🎧 Tai Nghe Gaming Tốt", price: 3500000, desc: "Tai nghe gaming âm thanh vòm đỉnh cao (300k-400k VND)", icon: "🎧" },
  { id: "lego_kit_large", name: "🏰 Kit LEGO / Mô Hình Lớn", price: 3500000, desc: "Bộ mô hình lego khổng lồ nhiều chi tiết (300k-400k VND)", icon: "🏰" },
  { id: "keyboard_mech_entry", name: "⌨️ Bàn Phím Cơ Entry-Level", price: 4000000, desc: "Bàn phím cơ chất lượng tốt bền bỉ (350k-450k VND)", icon: "⌨️" },
  { id: "mouse_combo", name: "🖱️ Combo Chuột Gaming + Phụ Kiện", price: 4500000, desc: "Chuột gaming kèm lót chuột và phụ kiện (400k-500k VND)", icon: "🖱️" },
  { id: "keyboard_mech_premium", name: "⌨️ Bàn Phím Cơ Xịn", price: 5000000, desc: "Bàn phím cơ cao cấp gõ cực sướng (~450k-500k VND)", icon: "⌨️" }
];

export const MILESTONES = [
  { value: 100000, name: "🥉 Beginner", rewardName: "Móc Khóa Nhỏ" },
  { value: 250000, name: "🥈 Coin Collector", rewardName: "Chất Nhờn Slime" },
  { value: 500000, name: "🥇 Coin Hunter", rewardName: "Mô Hình Nhân Vật Nhỏ" },
  { value: 1000000, name: "💎 Millionaire", rewardName: "Chuột Có Dây" },
  { value: 2500000, name: "👑 Birthday Master", rewardName: "Chuột Gaming Tốt" },
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
  
  // Check achievements dynamically based on current coins
  const newAchievements = [];
  MILESTONES.forEach(m => {
    if (updatedCoins >= m.value) {
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

  // Check achievements dynamically based on current coins
  const newAchievements = [];
  MILESTONES.forEach(m => {
    if (updatedCoins >= m.value) {
      newAchievements.push(m.name);
    }
  });

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
    transactions: [tx, ...state.transactions].slice(0, 100),
    achievements: newAchievements
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
          if (loadedState.coins >= m.value) {
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
