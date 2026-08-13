"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../utils/db";

export default function KiemTra() {
  const [loading, setLoading] = useState(true);
  const [inventoryList, setInventoryList] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sound effects via Web Audio API
  const playSound = (type) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "success") {
        osc.type = "square";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("Audio Context failed to play", e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");

    if (supabase) {
      try {
        // 1. Fetch profiles to link emails
        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("id, email");
        
        if (pErr) console.error("Error fetching profiles:", pErr);

        const pMap = {};
        if (profiles) {
          profiles.forEach(p => {
            pMap[p.id] = p.email || `User-${p.id.substring(0, 5)}`;
          });
        }
        setProfilesMap(pMap);

        // 2. Fetch inventory
        const { data: inventory, error: iErr } = await supabase
          .from("inventory")
          .select("*")
          .order("redeemed_at", { ascending: false });

        if (iErr) throw iErr;

        setInventoryList(inventory || []);
      } catch (err) {
        console.error("Database fetch failed, loading local...", err);
        setErrorMsg("Không kết nối được database Supabase, đang hiển thị dữ liệu thử nghiệm cục bộ.");
        loadLocalData();
      } finally {
        setLoading(false);
      }
    } else {
      setErrorMsg("Chưa cấu hình Supabase, đang tải dữ liệu thử nghiệm từ trình duyệt này.");
      loadLocalData();
      setLoading(false);
    }
  };

  const loadLocalData = () => {
    if (typeof window !== "undefined") {
      const localState = localStorage.getItem("birthday_quest_state");
      if (localState) {
        try {
          const parsed = JSON.parse(localState);
          if (parsed.inventory) {
            // Simulate user email as Local Guest
            const list = parsed.inventory.map(item => ({
              id: item.id,
              user_id: "local-guest",
              reward_id: item.rewardId,
              claim_code: item.claimCode,
              status: item.status,
              redeemed_at: item.redeemedAt,
              name: item.name // Save original item name
            }));
            setInventoryList(list);
            setProfilesMap({ "local-guest": "Khách Local (Trình duyệt này)" });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleClaimStatus = async (item) => {
    playSound("click");
    const nextStatus = item.status === "🎁 Ready to Claim" ? "✅ Đã Nhận Quà" : "🎁 Ready to Claim";
    
    // Confirms status change
    const confirmChange = confirm(`Xác nhận chuyển trạng thái quà sang: "${nextStatus}"?`);
    if (!confirmChange) return;

    if (supabase && item.user_id !== "local-guest") {
      try {
        const { error } = await supabase
          .from("inventory")
          .update({ status: nextStatus })
          .eq("claim_code", item.claim_code);

        if (error) throw error;
        
        setSuccessMsg(`Cập nhật trạng thái mã ${item.claim_code} thành công!`);
        playSound("success");
        setTimeout(() => setSuccessMsg(""), 3000);
        loadData();
      } catch (err) {
        alert("Lỗi khi cập nhật database: " + err.message);
      }
    } else {
      // Local storage update fallback
      if (typeof window !== "undefined") {
        const localState = localStorage.getItem("birthday_quest_state");
        if (localState) {
          try {
            const parsed = JSON.parse(localState);
            parsed.inventory = parsed.inventory.map(inv => {
              if (inv.claimCode === item.claim_code) {
                return { ...inv, status: nextStatus };
              }
              return inv;
            });
            localStorage.setItem("birthday_quest_state", JSON.stringify(parsed));
            setSuccessMsg("Cập nhật trạng thái cục bộ thành công!");
            playSound("success");
            setTimeout(() => setSuccessMsg(""), 3000);
            loadLocalData();
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  };

  // Filter items based on search term
  const filteredList = inventoryList.filter(item => {
    const email = (profilesMap[item.user_id] || "").toLowerCase();
    const code = (item.claim_code || "").toLowerCase();
    const rewardName = (item.name || item.reward_id || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    return email.includes(query) || code.includes(query) || rewardName.includes(query);
  });

  const totalRewards = inventoryList.length;
  const pendingCount = inventoryList.filter(i => i.status === "🎁 Ready to Claim").length;
  const claimedCount = totalRewards - pendingCount;

  // Translate reward ID back to Vietnamese name if live database item name is missing
  const getRewardLabel = (item) => {
    if (item.name) return item.name;
    const names = {
      snack: "🍫 Hộp Đồ Ăn Vặt",
      milk_tea: "🥤 Trà Sữa Trân Châu",
      meal: "🍜 Bữa Ăn Yêu Thích",
      roblox: "🎮 Thẻ Quà Tặng Roblox",
      minecraft: "⛏️ Thẻ Quà Tặng Minecraft",
      gundam: "🤖 Mô Hình Gundam Mini",
      blocks: "🧱 Bộ Xếp Hình Lego",
      controller: "🎮 Tay Cầm Chơi Game",
      headset: "🎧 Tai Nghe Gaming",
      keyboard: "⌨️ Bàn Phím Cơ",
      mystery: "🎁 Hộp Quà Bí Ẩn",
    };
    return names[item.reward_id] || item.reward_id;
  };

  return (
    <div className="min-h-screen bg-bg text-text-main p-6 font-mono flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-border-main pb-4">
          <div>
            <h1 className="font-press-start text-primary text-base md:text-xl tracking-wider uppercase">
              🎂 HỆ THỐNG KIỂM TRA ĐỔI QUÀ
            </h1>
            <p className="text-xs text-text-muted mt-1 uppercase font-bold tracking-wider">
              Đồng bộ dữ liệu thời gian thực và quản trị danh sách quà tặng
            </p>
          </div>
          <Link
            href="/"
            onClick={() => playSound("click")}
            className="retro-btn border border-primary text-primary px-4 py-2 text-xs font-bold hover:bg-primary/10 rounded-[6px]"
          >
            ◀ QUAY LẠI GAME
          </Link>
        </header>

        {/* Info Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-950/20 border border-danger/30 text-danger text-xs text-center rounded-[6px]">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-950/20 border border-success/30 text-success text-xs text-center rounded-[6px] animate-pulse">
            {successMsg}
          </div>
        )}

        {/* Dashboard Analytics Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="retro-panel p-4 text-center">
            <div className="text-sm text-text-muted font-bold">TỔNG QUÀ ĐÃ ĐỔI</div>
            <div className="text-3xl font-bold text-white mt-1">{totalRewards}</div>
          </div>
          <div className="retro-panel p-4 text-center border-l-4 border-l-yellow-500">
            <div className="text-sm text-text-muted font-bold text-yellow-500">ĐANG CHỜ NHẬN (PENDING)</div>
            <div className="text-3xl font-bold text-yellow-500 mt-1">{pendingCount}</div>
          </div>
          <div className="retro-panel p-4 text-center border-l-4 border-l-success">
            <div className="text-sm text-text-muted font-bold text-success">ĐÃ TRAO QUÀ (DONE)</div>
            <div className="text-3xl font-bold text-success mt-1">{claimedCount}</div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 pixel-border-border rounded-[4px] bg-bg-secondary px-4 py-2 text-sm text-white focus:outline-none focus:border-primary placeholder-text-muted"
            placeholder="Tìm kiếm theo Tài khoản (Email), Tên quà hoặc Mã Claim..."
          />
          <button
            onClick={loadData}
            className="retro-btn bg-purple text-black px-5 py-2 text-xs font-bold"
          >
            🔄 TẢI LẠI
          </button>
        </div>

        {/* Inventory List Table */}
        <div className="retro-panel p-6 overflow-hidden">
          <h3 className="font-press-start text-xs text-primary uppercase mb-4">Danh sách mã đổi thưởng</h3>

          {loading ? (
            <div className="text-center py-20 text-text-muted animate-pulse text-sm">
              Đang tải danh sách đổi quà...
            </div>
          ) : filteredList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border-main text-text-muted font-bold uppercase text-xs">
                    <th className="pb-3 pr-2">Tài khoản (Email)</th>
                    <th className="pb-3 pr-2">Món quà</th>
                    <th className="pb-3 pr-2">Mã Claim</th>
                    <th className="pb-3 pr-2">Thời gian đổi</th>
                    <th className="pb-3 pr-2">Trạng thái</th>
                    <th className="pb-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/20 font-mono">
                  {filteredList.map((item) => {
                    const isPending = item.status === "🎁 Ready to Claim";
                    return (
                      <tr key={item.id || item.claim_code} className="hover:bg-bg-secondary/50">
                        <td className="py-3.5 pr-2 font-bold text-white max-w-[200px] truncate">
                          {profilesMap[item.user_id] || item.user_id}
                        </td>
                        <td className="py-3.5 pr-2 font-bold text-primary">
                          {getRewardLabel(item)}
                        </td>
                        <td className="py-3.5 pr-2 font-bold tracking-wider text-xs">
                          <code className="bg-bg px-2 py-0.5 rounded border border-border-main">
                            {item.claim_code}
                          </code>
                        </td>
                        <td className="py-3.5 pr-2 text-xs text-text-muted">
                          {new Date(item.redeemed_at).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3.5 pr-2">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-bold rounded ${
                              isPending
                                ? "bg-yellow-950/30 border border-yellow-500/50 text-yellow-500"
                                : "bg-green-950/30 border border-success/50 text-success"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => handleToggleClaimStatus(item)}
                            className={`retro-btn px-3 py-1 text-xs font-bold border ${
                              isPending
                                ? "bg-success border-success text-black hover:bg-success-hover"
                                : "bg-bg-secondary border-border-main text-text-muted hover:bg-card-hover"
                            }`}
                          >
                            {isPending ? "TRAO QUÀ" : "REVERT"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-text-muted italic text-sm">
              Không tìm thấy giao dịch đổi quà nào.
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-border-main bg-bg-secondary/20 px-6 py-4 text-center">
        <div className="text-xs text-text-muted font-mono">
          Trang kiểm tra quà tặng Birthday Gift © 2026. Dùng để xem và xác thực phần thưởng cho em bạn.
        </div>
      </footer>
    </div>
  );
}
