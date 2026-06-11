'use client';
import { useEffect, useState } from 'react';
import type { ShopItem } from '@blockquest/shared';
import { useGameStore } from '@/stores/gameStore';
import { api } from '@/lib/api';
import { refreshProfile, getSocket } from '@/lib/socket';
import { bridge } from '@/lib/bridge';

const RARITY_COLORS: Record<string, string> = {
  COMMON: '#8d89a8',
  RARE: '#5a9bd1',
  EPIC: '#b066d0',
};

export function ShopModal() {
  const open = useGameStore((s) => s.shopOpen);
  const set = useGameStore((s) => s.set);
  const showToast = useGameStore((s) => s.showToast);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [coins, setCoins] = useState(0);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (open) void load();
  }, [open]);

  async function load() {
    try {
      const data = await api<{ items: ShopItem[]; coins: number }>('/shop/items');
      setItems(data.items);
      setCoins(data.coins);
    } catch (e) {
      showToast((e as Error).message);
    }
  }

  if (!open) return null;

  async function buy(item: ShopItem) {
    setBusy(item.id);
    try {
      await api('/shop/buy', { method: 'POST', body: { itemId: item.id } });
      showToast(`Bought ${item.name}!`);
      await Promise.all([load(), refreshProfile()]);
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  async function equip(item: ShopItem) {
    setBusy(item.id);
    try {
      await api('/inventory/equip', { method: 'POST', body: { itemId: item.id } });
      showToast(`Equipped ${item.name}!`);
      await Promise.all([load(), refreshProfile()]);
      bridge.emit('refresh-world'); // world re-joins so everyone sees the new look
    } catch (e) {
      showToast((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => set({ shopOpen: false })}>
      <div className="panel" style={{ width: 520, maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>🛒 Pixel Penny&apos;s Shop</h2>
          <span style={{ color: '#f2d250', fontSize: 18 }}>🪙 {coins}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          {items.map((item) => (
            <div key={item.id} className="panel" style={{ background: '#181527', padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{item.name}</strong>
                <span style={{ color: RARITY_COLORS[item.rarity] ?? '#8d89a8', fontSize: 11 }}>{item.rarity}</span>
              </div>
              <div style={{ color: '#8d89a8', fontSize: 12, margin: '4px 0 8px' }}>slot: {item.slot}</div>
              {!item.owned ? (
                <button className="btn" style={{ width: '100%' }} disabled={busy === item.id || coins < item.costCoins} onClick={() => buy(item)}>
                  Buy · 🪙 {item.costCoins}
                </button>
              ) : item.equipped ? (
                <button className="btn secondary" style={{ width: '100%' }} disabled>
                  ✓ Equipped
                </button>
              ) : (
                <button className="btn secondary" style={{ width: '100%' }} disabled={busy === item.id} onClick={() => equip(item)}>
                  Equip
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="btn secondary" style={{ width: '100%', marginTop: 14 }} onClick={() => set({ shopOpen: false })}>
          Close
        </button>
      </div>
    </div>
  );
}
