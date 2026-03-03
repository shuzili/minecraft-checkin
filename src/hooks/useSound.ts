import { useCallback, useRef, useEffect } from 'react';
import type { SoundType } from '@/types';

export function useSound(_soundEnabled?: boolean) {
  const isSoundEnabled = () => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? saved === 'true' : true;
  };
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // 初始化AudioContext
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // 生成点击音效（短促的高频音）
  const playClick = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, []);

  // 生成打卡成功音效（上升的音符）
  const playCheckIn = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.15);
      
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.15);
    });
  }, []);

  // 生成成功音效（欢快的和弦）
  const playSuccess = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C major chord + high C
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    });
  }, []);

  // 生成错误音效（下降的音）
  const playError = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, []);

  // 生成升级音效（华丽的上升音阶）
  const playLevelUp = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.04);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.04 + 0.1);
      
      osc.start(ctx.currentTime + i * 0.04);
      osc.stop(ctx.currentTime + i * 0.04 + 0.1);
    });
  }, []);

  // 生成金币音效（清脆的叮当声）
  const playCoin = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }, []);

  // 生成弹出音效（短促的音）
  const playPop = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }, []);

  // 生成复活卡音效（神奇的音效）
  const playRevive = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const notes = [440, 554, 659, 880, 1108, 1318];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.2);
      
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.2);
    });
  }, []);

  const play = useCallback((type: SoundType) => {
    if (!isSoundEnabled()) return;
    
    switch (type) {
      case 'click':
        playClick();
        break;
      case 'checkIn':
        playCheckIn();
        break;
      case 'success':
        playSuccess();
        break;
      case 'error':
        playError();
        break;
      case 'levelUp':
        playLevelUp();
        break;
      case 'coin':
        playCoin();
        break;
      case 'pop':
        playPop();
        break;
      case 'revive':
        playRevive();
        break;
    }
  }, [playClick, playCheckIn, playSuccess, playError, playLevelUp, playCoin, playPop, playRevive]);

  return { play };
}
