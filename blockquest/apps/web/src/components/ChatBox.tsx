'use client';
import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { getSocket } from '@/lib/socket';

export function ChatBox() {
  const chat = useGameStore((s) => s.chat);
  const set = useGameStore((s) => s.set);
  const phase = useGameStore((s) => s.phase);
  const [text, setText] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [chat]);

  if (phase !== 'world') return null;

  const send = () => {
    const t = text.trim();
    if (!t) return;
    getSocket().emit('chat_send', { text: t });
    setText('');
  };

  return (
    <div style={{ position: 'absolute', bottom: 12, left: 12, width: 320, zIndex: 50 }}>
      <div
        ref={logRef}
        style={{ background: 'rgba(20,18,31,0.85)', border: '2px solid #3a3650', borderRadius: '8px 8px 0 0', height: 130, overflowY: 'auto', padding: 8, fontSize: 13 }}
      >
        {chat.length === 0 && <span style={{ color: '#8d89a8' }}>Say hi to the village...</span>}
        {chat.map((m, i) => (
          <div key={i}>
            <span style={{ color: '#9ad0ff' }}>{m.username}:</span> {m.text}
          </div>
        ))}
      </div>
      <input
        className="input"
        style={{ width: '100%', borderRadius: '0 0 8px 8px', borderTop: 0 }}
        placeholder="Press Enter to chat"
        maxLength={140}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => set({ typing: true })}
        onBlur={() => set({ typing: false })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') send();
          e.stopPropagation();
        }}
      />
    </div>
  );
}
