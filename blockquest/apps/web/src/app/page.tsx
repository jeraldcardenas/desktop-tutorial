'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AvatarConfig } from '@blockquest/shared';
import { DEFAULT_AVATAR } from '@blockquest/shared';
import { api, getToken, setToken, clearToken } from '@/lib/api';
import { AvatarPreview } from '@/components/AvatarPreview';
import { SKIN_TONES, HAIR_COLORS, TOP_COLORS, BOTTOM_COLORS, HAIR_NAMES } from '@/game/avatarPixels';

/** Free creator options — higher indices are shop unlocks. */
const FREE = { skin: 4, hair: 2, hairColor: 4, top: 3, bottom: 3 } as const;

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'name' | 'avatar'>('name');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cfg, setCfg] = useState<AvatarConfig>({ ...DEFAULT_AVATAR });
  const hasSession = typeof window !== 'undefined' && !!getToken();

  async function createGuest() {
    setBusy(true);
    setError('');
    try {
      const res = await api<{ token: string }>('/auth/guest', {
        method: 'POST',
        body: { username },
      });
      setToken(res.token);
      setStep('avatar');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function enterWorld() {
    setBusy(true);
    try {
      await api('/profile/avatar', { method: 'PUT', body: { avatar: cfg } });
      router.push('/play');
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const randomize = () =>
    setCfg({
      skin: Math.floor(Math.random() * FREE.skin),
      hair: Math.floor(Math.random() * FREE.hair),
      hairColor: Math.floor(Math.random() * FREE.hairColor),
      top: Math.floor(Math.random() * FREE.top),
      bottom: Math.floor(Math.random() * FREE.bottom),
    });

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 42, margin: 0, color: '#5ad1a0', textShadow: '3px 3px 0 #2e3650' }}>
        ⬛ BlockQuest Online
      </h1>
      <p style={{ color: '#8d89a8', margin: 0 }}>
        Walk a pixel world. Duel in block-puzzle battles. Climb the ranks.
      </p>

      {step === 'name' && (
        <div className="panel" style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label htmlFor="bq-username">Choose a username</label>
          <input
            id="bq-username"
            className="input"
            maxLength={16}
            placeholder="PixelHero"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && username.trim().length >= 3 && createGuest()}
          />
          {error && <span style={{ color: '#d15a6e', fontSize: 13 }}>{error}</span>}
          <button className="btn" disabled={busy || username.trim().length < 3} onClick={createGuest}>
            {busy ? '...' : 'Play as Guest'}
          </button>
          {hasSession && (
            <>
              <button className="btn secondary" onClick={() => router.push('/play')}>
                Continue previous session
              </button>
              <button
                className="btn secondary"
                onClick={() => { clearToken(); location.reload(); }}
              >
                Forget previous session
              </button>
            </>
          )}
        </div>
      )}

      {step === 'avatar' && (
        <div className="panel" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'center' }}>
            <AvatarPreview cfg={cfg} />
            <div style={{ marginTop: 8, color: '#ffe97a' }}>{username}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 300 }}>
            <OptionRow label="Skin" colors={SKIN_TONES.slice(0, FREE.skin)} value={cfg.skin} onPick={(skin) => setCfg({ ...cfg, skin })} />
            <OptionRow label="Hair style" names={HAIR_NAMES.slice(0, FREE.hair)} value={cfg.hair} onPick={(hair) => setCfg({ ...cfg, hair })} />
            <OptionRow label="Hair color" colors={HAIR_COLORS.slice(0, FREE.hairColor)} value={cfg.hairColor} onPick={(hairColor) => setCfg({ ...cfg, hairColor })} />
            <OptionRow label="Top" colors={TOP_COLORS.slice(0, FREE.top)} value={cfg.top} onPick={(top) => setCfg({ ...cfg, top })} />
            <OptionRow label="Bottom" colors={BOTTOM_COLORS.slice(0, FREE.bottom)} value={cfg.bottom} onPick={(bottom) => setCfg({ ...cfg, bottom })} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn secondary" onClick={randomize}>🎲 Randomize</button>
              <button className="btn" disabled={busy} onClick={enterWorld} style={{ flex: 1 }}>
                Enter World →
              </button>
            </div>
            {error && <span style={{ color: '#d15a6e', fontSize: 13 }}>{error}</span>}
            <span style={{ color: '#8d89a8', fontSize: 12 }}>More styles & colors unlock in the village shop!</span>
          </div>
        </div>
      )}
    </main>
  );
}

function OptionRow({
  label, value, onPick, colors, names,
}: {
  label: string;
  value: number;
  onPick: (i: number) => void;
  colors?: string[];
  names?: string[];
}) {
  const count = colors?.length ?? names?.length ?? 0;
  return (
    <div>
      <div style={{ fontSize: 12, color: '#8d89a8', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            onClick={() => onPick(i)}
            style={{
              width: names ? undefined : 28,
              height: 28,
              padding: names ? '0 10px' : 0,
              background: colors ? colors[i] : '#3a3650',
              color: '#fff',
              border: value === i ? '3px solid #5ad1a0' : '3px solid transparent',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {names ? names[i] : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
