import { useCallback } from 'react';
import confetti from 'canvas-confetti';

// 我的世界主题颜色
const MINECRAFT_COLORS = {
  grass: '#5d8c37',
  dirt: '#8b7355',
  stone: '#7a7a7a',
  diamond: '#00ffff',
  gold: '#ffcc00',
  iron: '#e6e6e6',
  redstone: '#ff0000',
  lapis: '#0000ff',
  emerald: '#00ff00',
  wood: '#8b4513',
  leaves: '#228b22',
  sand: '#f4e4c1',
  water: '#00aaaa',
  lava: '#ff6600',
  obsidian: '#2d004d'
};

export function useConfetti() {
  // 基础庆祝效果
  const celebrate = useCallback(() => {
    const colors = Object.values(MINECRAFT_COLORS);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
      shapes: ['square'],
      scalar: 1.2
    });
  }, []);

  // 打卡成功特效
  const checkInSuccess = useCallback(() => {
    const colors = [MINECRAFT_COLORS.diamond, MINECRAFT_COLORS.emerald, MINECRAFT_COLORS.gold];
    
    // 从底部发射
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 1 },
      colors: colors,
      shapes: ['square'],
      scalar: 1.5,
      drift: 0,
      gravity: 0.8
    });
    
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 1 },
      colors: colors,
      shapes: ['square'],
      scalar: 1.5,
      drift: 0,
      gravity: 0.8
    });
  }, []);

  // 连续打卡奖励特效
  const streakBonus = useCallback((_days: number) => {
    const colors = [MINECRAFT_COLORS.gold, MINECRAFT_COLORS.diamond, MINECRAFT_COLORS.emerald];
    
    // 多次发射
    const end = Date.now() + 1000;
    const frame = () => {
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
        shapes: ['square'],
        scalar: 1.5
      });
      
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
        shapes: ['square'],
        scalar: 1.5
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // 升级特效
  const levelUp = useCallback(() => {
    const colors = Object.values(MINECRAFT_COLORS);
    
    const end = Date.now() + 2000;
    const frame = () => {
      confetti({
        particleCount: 50,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors: colors,
        shapes: ['square'],
        scalar: 2,
        drift: 0,
        gravity: 0.5,
        ticks: 100
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // 复活卡使用特效
  const revive = useCallback(() => {
    const colors = [MINECRAFT_COLORS.emerald, MINECRAFT_COLORS.diamond, MINECRAFT_COLORS.water];
    
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors,
      shapes: ['square'],
      scalar: 1.5,
      drift: 0,
      gravity: 0.6
    });
  }, []);

  // 商城兑换特效
  const shopRedeem = useCallback(() => {
    const colors = [MINECRAFT_COLORS.gold, MINECRAFT_COLORS.diamond];
    
    confetti({
      particleCount: 60,
      angle: 90,
      spread: 100,
      origin: { y: 0.5 },
      colors: colors,
      shapes: ['square'],
      scalar: 1.3
    });
  }, []);

  // 惩罚特效
  const punishment = useCallback(() => {
    const colors = [MINECRAFT_COLORS.lava, MINECRAFT_COLORS.redstone];
    
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: colors,
      shapes: ['square'],
      scalar: 1.2,
      drift: 0,
      gravity: 1.2
    });
  }, []);

  return {
    celebrate,
    checkInSuccess,
    streakBonus,
    levelUp,
    revive,
    shopRedeem,
    punishment
  };
}
