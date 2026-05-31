import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Phaser from 'phaser';
import cloudBlockAsset from '@/assets/game/cloud-block.svg';
import treeCrownAsset from '@/assets/game/tree-crown.svg';
import flowerRedAsset from '@/assets/game/flower-red.svg';
import slime0Asset from '@/assets/game/slime-0.svg';
import slime1Asset from '@/assets/game/slime-1.svg';
import type {
  CampaignLevelDefinition,
  FinishLevelResult,
  FinishLevelStats,
  GameState,
  StartLevelResult,
  User,
} from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, RotateCcw, Home, Gamepad2, Flag, Shield, Heart } from 'lucide-react';

interface GameModeProps {
  users: User[];
  gameState: GameState;
  soundEnabled: boolean;
  onStartLevel: (userId: string, levelId: string) => StartLevelResult;
  onFinishLevel: (userId: string, levelId: string, stats: FinishLevelStats) => FinishLevelResult;
  onFailLevel: (userId: string, levelId: string, reason: string) => { ok: boolean; message: string };
  onSaveCheckpoint: (userId: string, levelId: string, checkpointId: string) => void;
  onBattleLockChange: (locked: boolean) => void;
}

type Mode = 'hub' | 'playing' | 'result';
type GameAction = 'jump' | 'attack' | 'dig' | 'hit' | 'checkpoint' | 'win' | 'lose';

interface SimpleRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type EnemyKind = 'zombie' | 'slime' | 'skeleton' | 'creeper' | 'enderman';

interface StageEnemyConfig {
  type?: EnemyKind;
  x: number;
  y: number;
  range: number;
  speed: number;
  aggroRange?: number;
  dashSpeed?: number;
  dashDurationMs?: number;
  dashCooldownMs?: number;
  hopIntervalMs?: number;
}

interface StageLayout {
  worldWidth: number;
  worldHeight: number;
  spawn: { x: number; y: number };
  goal: { x: number; y: number };
  platforms: SimpleRect[];
  hazards: SimpleRect[];
  switches: { id: string; x: number; y: number }[];
  gates: { id: string; x: number; y: number; w: number; h: number; needs: number }[];
  enemies: StageEnemyConfig[];
  checkpoints: { id: string; x: number; y: number }[];
  mineNodes?: { id: string; x: number; y: number; hp: number }[];
  boss?: { x: number; y: number; hp: number };
}

const isCoarsePointer = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
};

const layoutByLevel = (level: CampaignLevelDefinition): StageLayout => {
  switch (level.index) {
    case 1:
      return {
        worldWidth: 2200,
        worldHeight: 540,
        spawn: { x: 90, y: 420 },
        goal: { x: 2050, y: 260 },
        platforms: [
          { x: 220, y: 500, w: 440, h: 50 },
          { x: 700, y: 500, w: 260, h: 50 },
          { x: 1040, y: 470, w: 220, h: 40 },
          { x: 1360, y: 430, w: 220, h: 40 },
          { x: 1710, y: 390, w: 220, h: 40 },
          { x: 1980, y: 320, w: 220, h: 36 },
        ],
        hazards: [{ x: 885, y: 520, w: 70, h: 20 }],
        switches: [{ id: 'sw-a', x: 740, y: 460 }],
        gates: [{ id: 'gate-a', x: 1910, y: 358, w: 28, h: 90, needs: 3 }],
        mineNodes: [
          { id: 'mine-1', x: 390, y: 454, hp: 3 },
          { id: 'mine-2', x: 1120, y: 424, hp: 3 },
          { id: 'mine-3', x: 1670, y: 344, hp: 3 },
        ],
        enemies: [
          { type: 'zombie', x: 980, y: 438, range: 90, speed: 70, aggroRange: 160, dashSpeed: 170, dashDurationMs: 210, dashCooldownMs: 1200 },
          { type: 'slime', x: 1210, y: 438, range: 80, speed: 58, aggroRange: 220, hopIntervalMs: 860 },
          { type: 'zombie', x: 1540, y: 358, range: 92, speed: 72, aggroRange: 180, dashSpeed: 185, dashDurationMs: 220, dashCooldownMs: 1150 },
          { type: 'slime', x: 1780, y: 318, range: 78, speed: 62, aggroRange: 240, hopIntervalMs: 760 },
        ],
        checkpoints: [{ id: 'cp-1', x: 1120, y: 430 }],
      };
    case 2:
      return {
        worldWidth: 2600,
        worldHeight: 540,
        spawn: { x: 100, y: 420 },
        goal: { x: 2440, y: 220 },
        platforms: [
          { x: 240, y: 500, w: 420, h: 50 },
          { x: 710, y: 460, w: 220, h: 40 },
          { x: 980, y: 420, w: 180, h: 36 },
          { x: 1220, y: 380, w: 200, h: 34 },
          { x: 1490, y: 430, w: 220, h: 36 },
          { x: 1780, y: 390, w: 220, h: 36 },
          { x: 2060, y: 350, w: 180, h: 34 },
          { x: 2380, y: 280, w: 220, h: 36 },
        ],
        hazards: [
          { x: 560, y: 520, w: 80, h: 20 },
          { x: 1640, y: 520, w: 90, h: 20 },
        ],
        switches: [
          { id: 'sw-a', x: 1020, y: 380 },
          { id: 'sw-b', x: 1800, y: 350 },
        ],
        gates: [{ id: 'gate-a', x: 2320, y: 310, w: 28, h: 100, needs: 4 }],
        mineNodes: [
          { id: 'mine-1', x: 400, y: 454, hp: 3 },
          { id: 'mine-2', x: 1080, y: 380, hp: 3 },
          { id: 'mine-3', x: 1680, y: 350, hp: 3 },
          { id: 'mine-4', x: 2200, y: 310, hp: 4 },
        ],
        enemies: [
          { type: 'zombie', x: 800, y: 420, range: 85, speed: 70, aggroRange: 150, dashSpeed: 180, dashDurationMs: 220, dashCooldownMs: 1100 },
          { type: 'slime', x: 1150, y: 340, range: 75, speed: 55, aggroRange: 200, hopIntervalMs: 900 },
          { type: 'zombie', x: 1420, y: 390, range: 90, speed: 72, aggroRange: 165, dashSpeed: 175, dashDurationMs: 210, dashCooldownMs: 1200 },
          { type: 'slime', x: 1950, y: 310, range: 80, speed: 60, aggroRange: 230, hopIntervalMs: 820 },
          { type: 'zombie', x: 2250, y: 240, range: 88, speed: 78, aggroRange: 170, dashSpeed: 190, dashDurationMs: 230, dashCooldownMs: 1050 },
        ],
        checkpoints: [{ id: 'cp-2', x: 1540, y: 390 }],
      };
    case 3:
      return {
        worldWidth: 2900,
        worldHeight: 540,
        spawn: { x: 100, y: 420 },
        goal: { x: 2740, y: 210 },
        platforms: [
          { x: 240, y: 500, w: 440, h: 50 },
          { x: 760, y: 465, w: 180, h: 36 },
          { x: 1020, y: 430, w: 170, h: 34 },
          { x: 1310, y: 390, w: 180, h: 34 },
          { x: 1570, y: 350, w: 180, h: 32 },
          { x: 1830, y: 390, w: 180, h: 34 },
          { x: 2100, y: 350, w: 180, h: 32 },
          { x: 2360, y: 310, w: 180, h: 32 },
          { x: 2670, y: 260, w: 220, h: 34 },
        ],
        hazards: [
          { x: 920, y: 520, w: 75, h: 20 },
          { x: 1730, y: 520, w: 120, h: 20 },
        ],
        switches: [
          { id: 'sw-a', x: 1080, y: 390 },
          { id: 'sw-b', x: 1910, y: 350 },
          { id: 'sw-c', x: 2400, y: 270 },
        ],
        gates: [
          { id: 'gate-a', x: 1480, y: 350, w: 26, h: 90, needs: 1 },
          { id: 'gate-b', x: 2620, y: 290, w: 28, h: 110, needs: 3 },
        ],
        enemies: [
          { x: 1410, y: 350, range: 85, speed: 80 },
          { x: 2210, y: 310, range: 90, speed: 90 },
        ],
        checkpoints: [{ id: 'cp-3', x: 1700, y: 330 }],
      };
    case 4:
      return {
        worldWidth: 3200,
        worldHeight: 540,
        spawn: { x: 110, y: 420 },
        goal: { x: 3010, y: 180 },
        platforms: [
          { x: 220, y: 500, w: 380, h: 50 },
          { x: 660, y: 450, w: 150, h: 30 },
          { x: 890, y: 410, w: 150, h: 30 },
          { x: 1120, y: 370, w: 150, h: 30 },
          { x: 1370, y: 430, w: 170, h: 34 },
          { x: 1620, y: 390, w: 170, h: 34 },
          { x: 1860, y: 350, w: 170, h: 34 },
          { x: 2130, y: 310, w: 170, h: 34 },
          { x: 2410, y: 270, w: 170, h: 32 },
          { x: 2700, y: 230, w: 170, h: 32 },
          { x: 3000, y: 210, w: 180, h: 30 },
        ],
        hazards: [
          { x: 500, y: 520, w: 80, h: 20 },
          { x: 1520, y: 520, w: 90, h: 20 },
          { x: 2560, y: 520, w: 90, h: 20 },
        ],
        switches: [
          { id: 'sw-a', x: 1170, y: 330 },
          { id: 'sw-b', x: 2140, y: 270 },
        ],
        gates: [{ id: 'gate-a', x: 2930, y: 230, w: 26, h: 95, needs: 2 }],
        enemies: [
          { type: 'zombie', x: 600, y: 410, range: 82, speed: 74, aggroRange: 165, dashSpeed: 185, dashDurationMs: 225, dashCooldownMs: 1100 },
          { type: 'slime', x: 950, y: 370, range: 72, speed: 60, aggroRange: 210, hopIntervalMs: 850 },
          { type: 'skeleton', x: 1250, y: 330, range: 70, speed: 48, aggroRange: 280, fireIntervalMs: 1350, projectileSpeed: 235 },
          { type: 'enderman', x: 1480, y: 390, range: 55, speed: 74, aggroRange: 270, teleportIntervalMs: 3200, hp: 2 },
          { type: 'zombie', x: 1780, y: 310, range: 85, speed: 78, aggroRange: 175, dashSpeed: 190, dashDurationMs: 230, dashCooldownMs: 1050 },
          { type: 'creeper', x: 2200, y: 270, range: 52, speed: 80, aggroRange: 210, fuseTimeMs: 1150, explosionRadius: 95 },
          { type: 'zombie', x: 2500, y: 230, range: 88, speed: 82, aggroRange: 180, dashSpeed: 195, dashDurationMs: 235, dashCooldownMs: 1020 },
        ],
        checkpoints: [{ id: 'cp-4', x: 1970, y: 290 }],
      };
    case 5:
      return {
        worldWidth: 3400,
        worldHeight: 540,
        spawn: { x: 120, y: 420 },
        goal: { x: 3200, y: 190 },
        platforms: [
          { x: 230, y: 500, w: 360, h: 50 },
          { x: 640, y: 460, w: 170, h: 34 },
          { x: 880, y: 420, w: 160, h: 34 },
          { x: 1100, y: 380, w: 150, h: 32 },
          { x: 1310, y: 340, w: 140, h: 32 },
          { x: 1560, y: 300, w: 150, h: 32 },
          { x: 1810, y: 360, w: 150, h: 32 },
          { x: 2040, y: 320, w: 150, h: 32 },
          { x: 2280, y: 280, w: 150, h: 32 },
          { x: 2520, y: 240, w: 150, h: 32 },
          { x: 2770, y: 220, w: 150, h: 30 },
          { x: 3050, y: 220, w: 220, h: 34 },
        ],
        hazards: [
          { x: 530, y: 520, w: 85, h: 20 },
          { x: 1450, y: 520, w: 280, h: 20 },
          { x: 2360, y: 520, w: 120, h: 20 },
        ],
        switches: [
          { id: 'sw-a', x: 1160, y: 340 },
          { id: 'sw-b', x: 1840, y: 320 },
          { id: 'sw-c', x: 2800, y: 180 },
        ],
        gates: [{ id: 'gate-a', x: 2970, y: 246, w: 28, h: 105, needs: 3 }],
        enemies: [
          { type: 'zombie', x: 550, y: 420, range: 80, speed: 76, aggroRange: 170, dashSpeed: 190, dashDurationMs: 230, dashCooldownMs: 1050 },
          { type: 'slime', x: 950, y: 380, range: 70, speed: 62, aggroRange: 220, hopIntervalMs: 820 },
          { type: 'skeleton', x: 1200, y: 340, range: 70, speed: 50, aggroRange: 290, fireIntervalMs: 1300, projectileSpeed: 240 },
          { type: 'creeper', x: 1480, y: 260, range: 50, speed: 82, aggroRange: 220, fuseTimeMs: 1100, explosionRadius: 100 },
          { type: 'enderman', x: 1750, y: 320, range: 52, speed: 76, aggroRange: 280, teleportIntervalMs: 3000, hp: 2 },
          { type: 'zombie', x: 2150, y: 280, range: 82, speed: 82, aggroRange: 180, dashSpeed: 195, dashDurationMs: 235, dashCooldownMs: 1000 },
          { type: 'skeleton', x: 2600, y: 200, range: 65, speed: 52, aggroRange: 300, fireIntervalMs: 1250, projectileSpeed: 250 },
          { type: 'zombie', x: 2900, y: 180, range: 78, speed: 85, aggroRange: 185, dashSpeed: 200, dashDurationMs: 240, dashCooldownMs: 980 },
        ],
        checkpoints: [{ id: 'cp-5', x: 2280, y: 290 }],
      };
    default:
      return {
        worldWidth: 3600,
        worldHeight: 540,
        spawn: { x: 120, y: 420 },
        goal: { x: 3380, y: 190 },
        platforms: [
          { x: 220, y: 500, w: 400, h: 50 },
          { x: 680, y: 450, w: 170, h: 34 },
          { x: 930, y: 410, w: 150, h: 34 },
          { x: 1150, y: 370, w: 150, h: 32 },
          { x: 1380, y: 330, w: 160, h: 32 },
          { x: 1620, y: 300, w: 150, h: 30 },
          { x: 1850, y: 340, w: 160, h: 32 },
          { x: 2090, y: 300, w: 170, h: 32 },
          { x: 2340, y: 260, w: 160, h: 32 },
          { x: 2590, y: 230, w: 160, h: 30 },
          { x: 2850, y: 210, w: 170, h: 30 },
          { x: 3120, y: 210, w: 260, h: 34 },
        ],
        hazards: [
          { x: 560, y: 520, w: 80, h: 20 },
          { x: 1460, y: 520, w: 240, h: 20 },
          { x: 2480, y: 520, w: 120, h: 20 },
        ],
        switches: [
          { id: 'sw-a', x: 980, y: 380 },
          { id: 'sw-b', x: 1890, y: 300 },
          { id: 'sw-c', x: 2670, y: 200 },
        ],
        gates: [{ id: 'gate-a', x: 3040, y: 242, w: 30, h: 108, needs: 3 }],
        enemies: [
          { type: 'zombie', x: 500, y: 410, range: 78, speed: 78, aggroRange: 175, dashSpeed: 195, dashDurationMs: 235, dashCooldownMs: 1000 },
          { type: 'slime', x: 800, y: 370, range: 68, speed: 64, aggroRange: 230, hopIntervalMs: 800 },
          { type: 'skeleton', x: 1250, y: 290, range: 65, speed: 52, aggroRange: 300, fireIntervalMs: 1250, projectileSpeed: 245 },
          { type: 'enderman', x: 1550, y: 260, range: 50, speed: 78, aggroRange: 290, teleportIntervalMs: 2900, hp: 2 },
          { type: 'zombie', x: 1950, y: 300, range: 80, speed: 82, aggroRange: 185, dashSpeed: 198, dashDurationMs: 240, dashCooldownMs: 980 },
          { type: 'creeper', x: 2250, y: 220, range: 48, speed: 84, aggroRange: 230, fuseTimeMs: 1050, explosionRadius: 105 },
          { type: 'skeleton', x: 2680, y: 190, range: 60, speed: 54, aggroRange: 310, fireIntervalMs: 1200, projectileSpeed: 255 },
          { type: 'zombie', x: 3000, y: 170, range: 75, speed: 86, aggroRange: 190, dashSpeed: 205, dashDurationMs: 245, dashCooldownMs: 950 },
        ],
        checkpoints: [{ id: 'cp-6', x: 2260, y: 250 }],
        boss: { x: 3240, y: 150, hp: 8 },
      };
  }
};

interface RunnerProps {
  level: CampaignLevelDefinition;
  sessionId: number;
  onCheckpoint: (id: string) => void;
  onComplete: (stats: FinishLevelStats) => void;
  onFail: (reason: string) => void;
  onAction: (action: GameAction) => void;
}

function PhaserRunner({ level, sessionId, onComplete, onFail, onCheckpoint, onAction }: RunnerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [touchEnabled, setTouchEnabled] = useState(false);
  const inputRef = useRef({ left: false, right: false, jump: false, attack: false, interact: false });
  const callbacksRef = useRef({ onComplete, onFail, onCheckpoint, onAction });

  useEffect(() => {
    callbacksRef.current = { onComplete, onFail, onCheckpoint, onAction };
  }, [onAction, onCheckpoint, onComplete, onFail]);

  useEffect(() => {
    setTouchEnabled(isCoarsePointer());
  }, []);

  useEffect(() => {
    if (!hostRef.current) return;

    const layout = layoutByLevel(level);
    const isLevelOne = level.index === 1;
    const hasMineNodes = (layout.mineNodes?.length ?? 0) > 0;
    const tileSize = 32;
    const biomeTheme = {
      grassland: {
        skyTop: 0x8cd1ff,
        skyBottom: 0xc8ecff,
        cloud: 0xf7fbff,
        far: 0x8bc58f,
        mid: 0x5f9d65,
        platform: 'tile-grass',
        platformTop: 'tile-grass-top',
      },
      cave: {
        skyTop: 0x434c56,
        skyBottom: 0x1f252b,
        cloud: 0x6e7781,
        far: 0x4e5a64,
        mid: 0x394048,
        platform: 'tile-cave',
        platformTop: 'tile-cave',
      },
      redstone: {
        skyTop: 0x5a4548,
        skyBottom: 0x2d2426,
        cloud: 0x8b6f74,
        far: 0x6d4f52,
        mid: 0x4c393d,
        platform: 'tile-redstone',
        platformTop: 'tile-redstone',
      },
      rail: {
        skyTop: 0x7784a0,
        skyBottom: 0x44516a,
        cloud: 0xafbdd4,
        far: 0x6a7588,
        mid: 0x545e71,
        platform: 'tile-rail',
        platformTop: 'tile-rail',
      },
      nether: {
        skyTop: 0x6a2f26,
        skyBottom: 0x281411,
        cloud: 0xa65e4f,
        far: 0x7b3f34,
        mid: 0x5b2a21,
        platform: 'tile-nether',
        platformTop: 'tile-nether',
      },
      end: {
        skyTop: 0x5a5a72,
        skyBottom: 0x252536,
        cloud: 0xc4bbe6,
        far: 0x75718f,
        mid: 0x57556f,
        platform: 'tile-end',
        platformTop: 'tile-end',
      },
    }[level.biome];
    let finished = false;

    class StageScene extends Phaser.Scene {
      private player!: Phaser.Physics.Arcade.Sprite;
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private keyA!: Phaser.Input.Keyboard.Key;
      private keyD!: Phaser.Input.Keyboard.Key;
      private keyJ!: Phaser.Input.Keyboard.Key;
      private keyK!: Phaser.Input.Keyboard.Key;
      private keySpace!: Phaser.Input.Keyboard.Key;
      private platforms!: Phaser.Physics.Arcade.StaticGroup;
      private hazards!: Phaser.Physics.Arcade.Group;
      private switches: Phaser.Physics.Arcade.Sprite[] = [];
      private gates: Phaser.Physics.Arcade.Sprite[] = [];
      private checkpoints: Phaser.Physics.Arcade.Sprite[] = [];
      private enemies!: Phaser.Physics.Arcade.Group;
      private arrowGroup!: Phaser.Physics.Arcade.Group;
      private goal!: Phaser.Physics.Arcade.Sprite;
      private boss: Phaser.Physics.Arcade.Sprite | null = null;
      private pickaxe!: Phaser.GameObjects.Sprite;
      private mineNodes: Phaser.Physics.Arcade.Sprite[] = [];
      private mineNodeHp = new Map<string, number>();
      private totalMineNodes = 0;
      private firstMineHitPlayed = false;
      private gateOpenedFxPlayed = false;
      private bossHp = 0;
      private jumpsLeft = 2;
      private lastAttackAt = 0;
      private lastHitAt = 0;
      private deaths = 0;
      private hits = 0;
      private hearts = 5;
      private activatedSwitches = new Set<string>();
      private activatedCheckpoints = new Set<string>();
      private respawn = { ...layout.spawn };
      private prevVirtual = { jump: false, attack: false, interact: false };
      private hudText!: Phaser.GameObjects.Text;
      private tipText!: Phaser.GameObjects.Text;
      private facing: -1 | 1 = 1;
      private attackDisplayUntil = 0;
      private hitDisplayUntil = 0;
      private digDisplayUntil = 0;
      private runStartMs = 0;

      constructor() {
        super('stage-scene');
      }

      preload() {
        const makeTexture = (key: string, width: number, height: number, painter: (g: Phaser.GameObjects.Graphics) => void) => {
          if (this.textures.exists(key)) return;
          const g = this.add.graphics({ x: 0, y: 0 });
          painter(g);
          g.generateTexture(key, width, height);
          g.destroy();
        };

        if (!this.textures.exists('deco-cloud-block')) this.load.image('deco-cloud-block', cloudBlockAsset);
        if (!this.textures.exists('deco-tree-crown')) this.load.image('deco-tree-crown', treeCrownAsset);
        if (!this.textures.exists('deco-flower-red')) this.load.image('deco-flower-red', flowerRedAsset);
        if (!this.textures.exists('slime-0')) this.load.image('slime-0', slime0Asset);
        if (!this.textures.exists('slime-1')) this.load.image('slime-1', slime1Asset);

        const makeBlockTexture = (
          key: string,
          palette: { top?: number; base: number; shade: number; edge: number; detail: number }
        ) => {
          makeTexture(key, tileSize, tileSize, (g) => {
            g.fillStyle(palette.base, 1);
            g.fillRect(0, 0, tileSize, tileSize);
            if (palette.top !== undefined) {
              g.fillStyle(palette.top, 1);
              g.fillRect(0, 0, tileSize, 8);
            }
            g.fillStyle(palette.edge, 1);
            g.fillRect(0, 0, tileSize, 2);
            g.fillRect(0, 0, 2, tileSize);
            g.fillStyle(palette.shade, 1);
            g.fillRect(0, tileSize - 5, tileSize, 5);
            g.fillRect(tileSize - 3, 0, 3, tileSize);
            g.fillStyle(palette.detail, 0.9);
            for (let i = 0; i < 12; i += 1) {
              const x = (i * 7) % 28;
              const y = (i * 11) % 22;
              g.fillRect(2 + x, 6 + y, 3, 2);
            }
          });
        };

        makeBlockTexture('tile-grass-top', { top: 0x66be48, base: 0x7f5a37, shade: 0x5f4328, edge: 0x93cb5f, detail: 0x6b4f31 });
        makeBlockTexture('tile-grass', { base: 0x7f5a37, shade: 0x5f4328, edge: 0x98724a, detail: 0x6d5235 });
        makeBlockTexture('tile-cave', { base: 0x6e747d, shade: 0x444a51, edge: 0x89929d, detail: 0x575f67 });
        makeBlockTexture('tile-redstone', { base: 0x7f555a, shade: 0x52363a, edge: 0xa17177, detail: 0x6d494e });
        makeBlockTexture('tile-rail', { base: 0x7f6748, shade: 0x5a4732, edge: 0xa58a65, detail: 0x8f734d });
        makeBlockTexture('tile-nether', { base: 0x6c3b33, shade: 0x43221d, edge: 0x8f5549, detail: 0x563028 });
        makeBlockTexture('tile-end', { base: 0x8c87a7, shade: 0x645f7f, edge: 0xb3abd2, detail: 0x78739a });

        makeTexture('switch-off', 24, 24, (g) => {
          g.fillStyle(0x5f5f62, 1);
          g.fillRect(0, 0, 24, 24);
          g.fillStyle(0x2f2f33, 1);
          g.fillRect(0, 18, 24, 6);
          g.fillStyle(0xc04e35, 1);
          g.fillRect(8, 6, 8, 8);
          g.fillStyle(0xf2c17a, 1);
          g.fillRect(11, 2, 2, 6);
        });
        makeTexture('switch-on', 24, 24, (g) => {
          g.fillStyle(0x5f5f62, 1);
          g.fillRect(0, 0, 24, 24);
          g.fillStyle(0x2f2f33, 1);
          g.fillRect(0, 18, 24, 6);
          g.fillStyle(0x54cc6d, 1);
          g.fillRect(8, 6, 8, 8);
          g.fillStyle(0xe8e58a, 1);
          g.fillRect(11, 2, 2, 6);
        });
        makeTexture('gate-locked', 32, 96, (g) => {
          g.fillStyle(0x2f3340, 1);
          g.fillRect(0, 0, 32, 96);
          g.fillStyle(0x1e2029, 1);
          g.fillRect(0, 88, 32, 8);
          g.fillStyle(0x616776, 1);
          for (let i = 0; i < 4; i += 1) g.fillRect(5 + i * 7, 4, 3, 84);
          g.fillStyle(0x8bcbff, 0.75);
          g.fillRect(13, 40, 6, 14);
        });
        makeTexture('checkpoint', 20, 56, (g) => {
          g.fillStyle(0x4b3928, 1);
          g.fillRect(8, 0, 4, 56);
          g.fillStyle(0x4fd1ff, 1);
          g.fillRect(12, 8, 8, 14);
          g.fillStyle(0x9de8ff, 1);
          g.fillRect(13, 10, 5, 5);
          g.fillStyle(0x2ca9d6, 1);
          g.fillRect(12, 22, 8, 2);
        });
        makeTexture('goal-portal', 42, 78, (g) => {
          g.fillStyle(0x6f4c2a, 1);
          g.fillRect(0, 0, 42, 78);
          g.fillStyle(0x2f2134, 1);
          g.fillRect(6, 6, 30, 66);
          g.fillStyle(0x7c60ad, 0.95);
          g.fillRect(10, 10, 22, 58);
          g.fillStyle(0xd3c6f7, 0.6);
          for (let i = 0; i < 8; i += 1) g.fillRect(12 + ((i * 3) % 16), 14 + i * 6, 2, 2);
          g.fillStyle(0xa98650, 1);
          g.fillRect(2, 0, 38, 6);
        });

        makeTexture('pickaxe', 24, 24, (g) => {
          g.fillStyle(0x6b4a30, 1);
          g.fillRect(11, 7, 3, 15);
          g.fillStyle(0x8e6843, 1);
          g.fillRect(12, 8, 1, 12);
          g.fillStyle(0x9a744f, 1);
          g.fillRect(10, 12, 5, 2);

          // Pickaxe head: left adze + right pointed tip, avoid hammer silhouette.
          g.fillStyle(0xbac7d3, 1);
          g.fillRect(5, 4, 12, 3);
          g.fillRect(3, 5, 3, 2);
          g.fillRect(2, 6, 2, 1);
          g.fillRect(17, 4, 4, 2);
          g.fillRect(20, 3, 2, 2);
          g.fillRect(21, 2, 1, 1);

          g.fillStyle(0x8ea2b4, 1);
          g.fillRect(6, 6, 10, 1);
          g.fillRect(17, 5, 3, 1);
          g.fillStyle(0xe8f1f8, 1);
          g.fillRect(7, 4, 5, 1);
          g.fillRect(18, 4, 2, 1);
        });

        const makeMineNodeTexture = (key: string, stage: 3 | 2 | 1) => {
          makeTexture(key, 30, 30, (g) => {
            g.fillStyle(0x7d827f, 1);
            g.fillRect(0, 0, 30, 30);
            g.fillStyle(0x585d5a, 1);
            g.fillRect(0, 24, 30, 6);
            g.fillStyle(0x99a19d, 1);
            g.fillRect(2, 2, 12, 3);
            g.fillStyle(0x6ddf67, 1);
            g.fillRect(5, 7, 5, 5);
            g.fillRect(16, 10, 6, 5);
            g.fillRect(10, 17, 4, 4);
            if (stage <= 2) {
              g.fillStyle(0x2b2f2d, 0.8);
              g.fillRect(6, 6, 4, 2);
              g.fillRect(15, 14, 6, 2);
            }
            if (stage <= 1) {
              g.fillStyle(0x2b2f2d, 0.85);
              g.fillRect(8, 10, 12, 3);
              g.fillRect(12, 18, 8, 2);
            }
          });
        };
        makeMineNodeTexture('mine-node-3', 3);
        makeMineNodeTexture('mine-node-2', 2);
        makeMineNodeTexture('mine-node-1', 1);

        const makeLavaFrame = (key: string, offset: number) => {
          makeTexture(key, 32, 22, (g) => {
            g.fillStyle(0x551a0f, 1);
            g.fillRect(0, 0, 32, 22);
            g.fillStyle(0xc73a1d, 1);
            g.fillRect(0, 3, 32, 19);
            g.fillStyle(0xed6f26, 1);
            for (let i = 0; i < 6; i += 1) {
              const x = (i * 6 + offset * 3) % 30;
              g.fillRect(x, 7 + ((i + offset) % 3) * 3, 5, 3);
            }
            g.fillStyle(0xffc24a, 1);
            for (let i = 0; i < 5; i += 1) g.fillRect((i * 7 + offset * 2) % 31, 5 + (i % 2) * 2, 3, 2);
          });
        };
        makeLavaFrame('lava-0', 0);
        makeLavaFrame('lava-1', 1);
        makeLavaFrame('lava-2', 2);

        const makePlayerFrame = (
          key: string,
          pose: { legOffset: number; armOffset: number; jump: boolean; attack: boolean; hit: boolean; dig: boolean }
        ) => {
          makeTexture(key, 48, 56, (g) => {
            const skin = 0xd9b08c;
            const hair = 0x4a3020;
            const shirt = 0x4ca8d6;
            const shirtDark = 0x2f799d;
            const pants = 0x3a4b84;
            const boot = 0x3d2c21;
            const leftLegX = 17 + pose.legOffset;
            const rightLegX = 26 - pose.legOffset;
            const leftArmY = 20 - pose.armOffset + (pose.jump ? -2 : 0) + (pose.dig ? -3 : 0);
            const rightArmY = pose.attack ? 19 : pose.dig ? 15 : 20 + pose.armOffset + (pose.jump ? -2 : 0);

            g.fillStyle(hair, 1);
            g.fillRect(15, 3, 18, 5);
            g.fillStyle(skin, 1);
            g.fillRect(16, 8, 16, 12);
            g.fillStyle(0x2c2018, 1);
            g.fillRect(19, 12, 2, 2);
            g.fillRect(27, 12, 2, 2);
            g.fillStyle(0xb08262, 1);
            g.fillRect(22, 16, 4, 2);

            g.fillStyle(shirt, 1);
            g.fillRect(16, 20, 16, 16);
            g.fillStyle(shirtDark, 1);
            g.fillRect(16, 30, 16, 6);
            g.fillStyle(0x2b5f7a, 1);
            g.fillRect(23, 23, 2, 13);

            g.fillStyle(skin, 1);
            g.fillRect(11, leftArmY, 5, 14);
            g.fillRect(32, rightArmY, 5, pose.attack ? 10 : 14);
            g.fillStyle(shirtDark, 1);
            g.fillRect(11, leftArmY + 5, 5, 7);
            g.fillRect(32, rightArmY + 5, 5, pose.attack ? 5 : 7);

            g.fillStyle(pants, 1);
            g.fillRect(leftLegX, 36, 6, 14);
            g.fillRect(rightLegX, 36, 6, 14);
            g.fillStyle(boot, 1);
            g.fillRect(leftLegX, 49, 6, 5);
            g.fillRect(rightLegX, 49, 6, 5);

            if (pose.attack || pose.dig) {
              g.fillStyle(0x9bc2dd, 1);
              g.fillRect(37, 19, 8, 3);
              g.fillStyle(0xd9e8f3, 1);
              g.fillRect(45, 18, 2, 5);
            }
            if (pose.hit) {
              g.fillStyle(0xff5e66, 0.5);
              g.fillRect(14, 10, 20, 20);
            }
          });
        };
        makePlayerFrame('player-idle', { legOffset: 0, armOffset: 0, jump: false, attack: false, hit: false, dig: false });
        makePlayerFrame('player-run-0', { legOffset: -2, armOffset: 2, jump: false, attack: false, hit: false, dig: false });
        makePlayerFrame('player-run-1', { legOffset: 2, armOffset: -2, jump: false, attack: false, hit: false, dig: false });
        makePlayerFrame('player-run-2', { legOffset: 0, armOffset: 1, jump: false, attack: false, hit: false, dig: false });
        makePlayerFrame('player-jump', { legOffset: 1, armOffset: -3, jump: true, attack: false, hit: false, dig: false });
        makePlayerFrame('player-attack', { legOffset: 1, armOffset: 0, jump: false, attack: true, hit: false, dig: false });
        makePlayerFrame('player-hit', { legOffset: 0, armOffset: 0, jump: false, attack: false, hit: true, dig: false });
        makePlayerFrame('player-dig-0', { legOffset: 0, armOffset: 0, jump: false, attack: false, hit: false, dig: true });
        makePlayerFrame('player-dig-1', { legOffset: 1, armOffset: 2, jump: false, attack: false, hit: false, dig: true });

        const makeEnemyFrame = (key: string, variant: 0 | 1) => {
          makeTexture(key, 40, 44, (g) => {
            g.fillStyle(0x3b7f42, 1);
            g.fillRect(10, 8, 20, 12);
            g.fillStyle(0x73b779, 1);
            g.fillRect(12, 10, 16, 8);
            g.fillStyle(0x233626, 1);
            g.fillRect(15, 12, 3, 2);
            g.fillRect(22, 12, 3, 2);
            g.fillStyle(0x4b2f25, 1);
            g.fillRect(12, 20, 16, 11);
            g.fillStyle(0x2f5e35, 1);
            g.fillRect(8, 20 + variant, 4, 10);
            g.fillRect(28, 21 - variant, 4, 10);
            g.fillStyle(0x2d4472, 1);
            g.fillRect(13, 31, 6, 11);
            g.fillRect(21, 31, 6, 11);
          });
        };
        makeEnemyFrame('enemy-0', 0);
        makeEnemyFrame('enemy-1', 1);

        const makeBossFrame = (key: string, variant: 0 | 1) => {
          makeTexture(key, 74, 74, (g) => {
            g.fillStyle(0x2c1f40, 1);
            g.fillRect(18, 6, 38, 24);
            g.fillStyle(0x6846a8, 1);
            g.fillRect(20, 8, 34, 20);
            g.fillStyle(0xd4baff, 1);
            g.fillRect(28, 16, 6, 3);
            g.fillRect(40, 16, 6, 3);
            g.fillStyle(0x1e1a2a, 1);
            g.fillRect(22, 30, 30, 30);
            g.fillStyle(0x47345f, 1);
            g.fillRect(18, 32 + variant, 8, 22);
            g.fillRect(48, 32 - variant, 8, 22);
            g.fillStyle(0x8f7ad8, 1);
            g.fillRect(28, 24, 18, 4);
          });
        };
        makeBossFrame('boss-0', 0);
        makeBossFrame('boss-1', 1);
      }

      private createAnimations() {
        if (!this.anims.exists('player-idle')) this.anims.create({ key: 'player-idle', frames: [{ key: 'player-idle' }], frameRate: 1, repeat: -1 });
        if (!this.anims.exists('player-jump')) this.anims.create({ key: 'player-jump', frames: [{ key: 'player-jump' }], frameRate: 1, repeat: -1 });
        if (!this.anims.exists('player-hit')) this.anims.create({ key: 'player-hit', frames: [{ key: 'player-hit' }], frameRate: 1, repeat: -1 });
        if (!this.anims.exists('player-attack')) this.anims.create({ key: 'player-attack', frames: [{ key: 'player-attack' }], frameRate: 1, repeat: -1 });
        if (!this.anims.exists('player-dig')) {
          this.anims.create({
            key: 'player-dig',
            frames: [{ key: 'player-dig-0' }, { key: 'player-dig-1' }],
            frameRate: 9,
            repeat: -1,
          });
        }
        if (!this.anims.exists('player-run')) {
          this.anims.create({
            key: 'player-run',
            frames: [{ key: 'player-run-0' }, { key: 'player-run-1' }, { key: 'player-run-2' }, { key: 'player-run-1' }],
            frameRate: 10,
            repeat: -1,
          });
        }
        if (!this.anims.exists('enemy-walk')) this.anims.create({ key: 'enemy-walk', frames: [{ key: 'enemy-0' }, { key: 'enemy-1' }], frameRate: 5, repeat: -1 });
        if (!this.anims.exists('slime-hop')) this.anims.create({ key: 'slime-hop', frames: [{ key: 'slime-0' }, { key: 'slime-1' }], frameRate: 4, repeat: -1 });
        if (!this.anims.exists('boss-float')) this.anims.create({ key: 'boss-float', frames: [{ key: 'boss-0' }, { key: 'boss-1' }], frameRate: 3, repeat: -1 });
        if (!this.anims.exists('lava-flow')) this.anims.create({ key: 'lava-flow', frames: [{ key: 'lava-0' }, { key: 'lava-1' }, { key: 'lava-2' }], frameRate: 6, repeat: -1 });
      }

      private buildBackdrop() {
        const bg = this.add.graphics().setDepth(-20);
        bg.fillGradientStyle(biomeTheme.skyTop, biomeTheme.skyTop, biomeTheme.skyBottom, biomeTheme.skyBottom, 1);
        bg.fillRect(0, 0, layout.worldWidth, layout.worldHeight);

        if (!hasMineNodes) {
          const far = this.add.graphics().setDepth(-9);
          far.fillStyle(biomeTheme.far, 0.95);
          for (let i = 0; i < 12; i += 1) {
            const baseX = i * 340 - 120;
            const ridge = 180 + ((i % 3) * 34);
            far.fillTriangle(baseX, layout.worldHeight, baseX + 180, ridge, baseX + 360, layout.worldHeight);
          }

          const mid = this.add.graphics().setDepth(-8);
          mid.fillStyle(biomeTheme.mid, 0.95);
          for (let i = 0; i < 11; i += 1) {
            const baseX = i * 360 - 150;
            const ridge = 240 + ((i % 2) * 40);
            mid.fillTriangle(baseX, layout.worldHeight, baseX + 210, ridge, baseX + 420, layout.worldHeight);
          }

          for (let i = 0; i < 7; i += 1) {
            const cloud = this.add.graphics().setDepth(-7);
            cloud.fillStyle(biomeTheme.cloud, 0.45);
            const x = 140 + i * 520;
            const y = 80 + (i % 3) * 46;
            cloud.fillRect(x, y, 90, 20);
            cloud.fillRect(x + 18, y - 12, 56, 12);
            cloud.fillRect(x + 36, y + 20, 40, 8);
          }
          return;
        }

        this.add.circle(210, 88, 36, 0xfff4b3, 0.92).setScrollFactor(0.03).setDepth(-19);
        this.add.circle(210, 88, 52, 0xfff4b3, 0.2).setScrollFactor(0.03).setDepth(-19);

        const skyMist = this.add.graphics().setDepth(-18).setScrollFactor(0.08);
        skyMist.fillStyle(0xd9f4ff, 0.18);
        skyMist.fillRect(0, 96, layout.worldWidth, 90);

        for (let i = 0; i < 14; i += 1) {
          const clusterX = 90 + i * 170;
          const clusterY = 52 + (i % 3) * 24;
          for (let block = 0; block < 4; block += 1) {
            const cloudBlock = this.add.image(clusterX + block * 24, clusterY + (block % 2) * 2, 'deco-cloud-block')
              .setOrigin(0, 0)
              .setDepth(-17)
              .setScrollFactor(0.12)
              .setScale(block % 3 === 0 ? 1.04 : 1);
            cloudBlock.alpha = 0.5 + (block % 2) * 0.12;
            this.tweens.add({
              targets: cloudBlock,
              x: cloudBlock.x + 18 + (i % 2) * 6,
              yoyo: true,
              repeat: -1,
              duration: 5200 + i * 280 + block * 160,
              ease: 'Sine.easeInOut',
            });
          }
        }

        const farMountains = this.add.graphics().setDepth(-15).setScrollFactor(0.22);
        farMountains.fillStyle(0x8aa4c0, 0.95);
        for (let i = 0; i < 12; i += 1) {
          const baseX = i * 340 - 140;
          const ridge = 170 + ((i % 4) * 18);
          farMountains.fillTriangle(baseX, layout.worldHeight, baseX + 180, ridge, baseX + 360, layout.worldHeight);
        }

        const nearMountains = this.add.graphics().setDepth(-14).setScrollFactor(0.36);
        nearMountains.fillStyle(0x7190ac, 0.96);
        for (let i = 0; i < 11; i += 1) {
          const baseX = i * 360 - 170;
          const ridge = 220 + ((i % 3) * 20);
          nearMountains.fillTriangle(baseX, layout.worldHeight, baseX + 220, ridge, baseX + 430, layout.worldHeight);
        }

        const forestTrunk = this.add.graphics().setDepth(-13).setScrollFactor(0.52);
        forestTrunk.fillStyle(0x5d422b, 0.98);
        for (let i = 0; i < 32; i += 1) {
          const x = i * 116 - 40;
          const treeH = 52 + ((i % 4) * 10);
          forestTrunk.fillRect(x + 28, layout.worldHeight - treeH - 18, 8, treeH);
          this.add.image(x + 32, layout.worldHeight - treeH - 22, 'deco-tree-crown')
            .setDepth(-13)
            .setScrollFactor(0.52)
            .setOrigin(0.5, 1)
            .setScale(1 + (i % 3) * 0.08);
        }

        const foregroundGrass = this.add.graphics().setDepth(-12).setScrollFactor(0.74);
        foregroundGrass.fillStyle(0x5ea64b, 0.92);
        for (let i = 0; i < 70; i += 1) {
          const x = i * 64;
          const h = 8 + (i % 3);
          foregroundGrass.fillRect(x, layout.worldHeight - 18 - h, 64, h);
        }

        for (let i = 0; i < 42; i += 1) {
          this.add.image(
            36 + i * 54 + ((i % 3) * 8),
            layout.worldHeight - 23 - (i % 2),
            'deco-flower-red'
          )
            .setDepth(-11)
            .setScrollFactor(0.78)
            .setScale(i % 4 === 0 ? 1.05 : 0.9)
            .setAlpha(0.82);
        }
      }

      create() {
        this.runStartMs = performance.now();
        this.createAnimations();
        this.buildBackdrop();
        this.physics.world.setBounds(0, 0, layout.worldWidth, layout.worldHeight, true, true, true, false);
        this.cameras.main.setBounds(0, 0, layout.worldWidth, layout.worldHeight);

        this.platforms = this.physics.add.staticGroup();
        this.hazards = this.physics.add.group({ allowGravity: false, immovable: true });

        layout.platforms.forEach((platform) => {
          const left = platform.x - platform.w / 2;
          const top = platform.y - platform.h / 2;
          const cols = Math.max(1, Math.ceil(platform.w / tileSize));
          const rows = Math.max(1, Math.ceil(platform.h / tileSize));
          for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
              const key = row === 0 ? biomeTheme.platformTop : biomeTheme.platform;
              const tile = this.platforms.create(left + col * tileSize + tileSize / 2, top + row * tileSize + tileSize / 2, key) as Phaser.Physics.Arcade.Sprite;
              tile.refreshBody();
            }
          }
        });

        layout.hazards.forEach((hazard) => {
          const left = hazard.x - hazard.w / 2;
          const cols = Math.max(1, Math.ceil(hazard.w / tileSize));
          for (let col = 0; col < cols; col += 1) {
            const hz = this.hazards.create(left + col * tileSize + tileSize / 2, hazard.y, 'lava-0') as Phaser.Physics.Arcade.Sprite;
            hz.setDisplaySize(tileSize, Math.max(16, hazard.h));
            hz.play('lava-flow');
            const body = hz.body as Phaser.Physics.Arcade.Body;
            body.setAllowGravity(false);
            body.setImmovable(true);
            body.setSize(tileSize - 4, Math.max(14, hazard.h - 2), true);
          }
        });

        this.player = this.physics.add.sprite(layout.spawn.x, layout.spawn.y, 'player-idle');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.02);
        this.player.setDragX(1200);
        this.player.setMaxVelocity(250, 900);
        this.player.setDepth(5);
        this.player.setSize(20, 50);
        this.player.setOffset(14, 6);
        this.player.anims.play('player-idle', true);
        this.pickaxe = this.add.sprite(this.player.x + 10, this.player.y + 2, 'pickaxe').setDepth(6);
        this.pickaxe.setOrigin(0.32, 0.86);
        this.pickaxe.setVisible(hasMineNodes);

        if (layout.mineNodes?.length) {
          this.totalMineNodes = layout.mineNodes.length;
          this.mineNodes = layout.mineNodes.map((node) => {
            const sprite = this.physics.add.staticSprite(node.x, node.y, 'mine-node-3');
            sprite.setData('id', node.id);
            sprite.setData('maxHp', node.hp);
            sprite.setScale(1.05);
            this.mineNodeHp.set(node.id, node.hp);
            return sprite;
          });
        }

        this.goal = this.physics.add.staticSprite(layout.goal.x, layout.goal.y, 'goal-portal');
        this.goal.setDisplaySize(42, 78);
        this.goal.setDepth(3);

        this.switches = hasMineNodes ? [] : layout.switches.map((switchConfig) => {
          const sw = this.physics.add.staticSprite(switchConfig.x, switchConfig.y, 'switch-off');
          sw.setScale(1.1);
          sw.setData('id', switchConfig.id);
          return sw;
        });

        this.gates = layout.gates.map((gateConfig) => {
          const gate = this.physics.add.staticSprite(gateConfig.x, gateConfig.y, 'gate-locked');
          gate.setDisplaySize(gateConfig.w, gateConfig.h);
          gate.refreshBody();
          gate.setData('id', gateConfig.id);
          gate.setData('needs', gateConfig.needs);
          return gate;
        });

        this.checkpoints = layout.checkpoints.map((checkpointConfig) => {
          const cp = this.physics.add.staticSprite(checkpointConfig.x, checkpointConfig.y, 'checkpoint');
          cp.setDisplaySize(20, 56);
          cp.setData('id', checkpointConfig.id);
          return cp;
        });

        this.enemies = this.physics.add.group({ allowGravity: false, immovable: true });
        this.arrowGroup = this.physics.add.group({ allowGravity: false });
        layout.enemies.forEach((enemyConfig) => {
          const enemyKind: EnemyKind = enemyConfig.type || 'zombie';
          const enemyTexture = enemyKind === 'slime' ? 'slime-0' : 'enemy-0';
          const enemy = this.enemies.create(enemyConfig.x, enemyConfig.y, enemyTexture) as Phaser.Physics.Arcade.Sprite;
          enemy.setData('baseX', enemyConfig.x);
          enemy.setData('range', enemyConfig.range);
          enemy.setData('speed', enemyConfig.speed);
          enemy.setData('baseSpeed', enemyConfig.speed);
          enemy.setData('type', enemyKind);
          enemy.setData('aggroRange', enemyConfig.aggroRange ?? 0);
          enemy.setData('dashSpeed', enemyConfig.dashSpeed ?? enemyConfig.speed * 2.2);
          enemy.setData('dashDurationMs', enemyConfig.dashDurationMs ?? 220);
          enemy.setData('dashCooldownMs', enemyConfig.dashCooldownMs ?? 1300);
          enemy.setData('hopIntervalMs', enemyConfig.hopIntervalMs ?? 900);
          enemy.setData('fireIntervalMs', enemyConfig.fireIntervalMs ?? 1500);
          enemy.setData('projectileSpeed', enemyConfig.projectileSpeed ?? 220);
          enemy.setData('fuseTimeMs', enemyConfig.fuseTimeMs ?? 1300);
          enemy.setData('explosionRadius', enemyConfig.explosionRadius ?? 90);
          enemy.setData('teleportIntervalMs', enemyConfig.teleportIntervalMs ?? 3500);
          enemy.setData('hp', enemyConfig.hp ?? 1);
          enemy.setData('dashUntil', 0);
          enemy.setData('lastDashAt', -99999);
          enemy.setData('nextHopAt', this.time.now + Phaser.Math.Between(180, 420));
          enemy.setData('nextFireAt', this.time.now + Phaser.Math.Between(600, 1200));
          enemy.setData('fuseState', 'idle');
          enemy.setData('lastTeleportAt', -99999);
          if (enemyKind === 'slime') {
            enemy.setDisplaySize(34, 24);
            enemy.setOrigin(0.5, 0.62);
            enemy.play('slime-hop');
          } else {
            enemy.setDisplaySize(40, 44);
            enemy.play('enemy-walk');
          }
          enemy.setVelocityX(enemyConfig.speed);
        });

        if (layout.boss) {
          this.boss = this.physics.add.sprite(layout.boss.x, layout.boss.y, 'boss-0');
          (this.boss.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
          this.boss.setImmovable(true);
          this.boss.setCollideWorldBounds(true);
          this.boss.setDisplaySize(74, 74);
          this.boss.play('boss-float');
          this.boss.setData('baseX', layout.boss.x);
          this.boss.setData('range', 120);
          this.boss.setData('speed', 70);
          this.boss.setVelocityX(70);
          this.bossHp = layout.boss.hp;
        }

        this.physics.add.overlap(this.player, this.arrowGroup, (_player, arrowObj) => {
          const arrow = arrowObj as Phaser.Physics.Arcade.Sprite;
          if (!arrow.active) return;
          this.applyHit('被箭矢击中');
          arrow.destroy();
        }, undefined, this);
        this.physics.add.collider(this.arrowGroup, this.platforms, (arrowObj) => {
          (arrowObj as Phaser.Physics.Arcade.Sprite).destroy();
        }, undefined, this);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        if (this.boss) this.physics.add.collider(this.boss, this.platforms);

        this.physics.add.overlap(this.player, this.hazards, () => this.applyHit('掉入危险区域'), undefined, this);
        this.physics.add.overlap(this.player, this.enemies, () => this.applyHit('被怪物击中'), undefined, this);
        if (this.boss) this.physics.add.overlap(this.player, this.boss, () => this.applyHit('被首领击中'), undefined, this);
        this.physics.add.overlap(this.player, this.goal, () => this.tryComplete(), undefined, this);

        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
        this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A) as Phaser.Input.Keyboard.Key;
        this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D) as Phaser.Input.Keyboard.Key;
        this.keyJ = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.J) as Phaser.Input.Keyboard.Key;
        this.keyK = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.K) as Phaser.Input.Keyboard.Key;
        this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE) as Phaser.Input.Keyboard.Key;

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        this.hudText = this.add.text(18, 14, '', {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#00000066',
          padding: { left: 6, right: 6, top: 2, bottom: 2 },
        }).setScrollFactor(0).setDepth(20);
        const objectiveText = hasMineNodes ? '目标：开采 3 个矿块并抵达终点' : `目标：${level.objective}`;
        this.tipText = this.add.text(18, 44, objectiveText, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#ffe893',
          backgroundColor: '#00000055',
          padding: { left: 6, right: 6, top: 2, bottom: 2 },
        }).setScrollFactor(0).setDepth(20);

        if (hasMineNodes) {
          const title = this.add.text(530, 80, `第${level.index}关 · ${level.name}`, {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: '#00000066',
            padding: { left: 10, right: 10, top: 6, bottom: 6 },
          }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);
          this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 240,
            yoyo: true,
            hold: 520,
            onComplete: () => title.destroy(),
          });
          this.cameras.main.pan(this.player.x + 120, this.player.y - 30, 900, 'Sine.easeInOut');
          this.tweens.add({
            targets: this.cameras.main,
            zoom: 1.04,
            duration: 420,
            yoyo: true,
            hold: 260,
            ease: 'Sine.easeInOut',
          });
        }
        this.refreshHud();
      }

      private refreshHud() {
        const switchCount = this.activatedSwitches.size;
        const needSwitchCount = this.totalMineNodes > 0 ? this.totalMineNodes : layout.switches.length;
        const bossText = this.boss ? `  首领:${Math.max(this.bossHp, 0)}` : '';
        this.hudText.setText(`生命:${this.hearts}  进度:${switchCount}/${needSwitchCount}${bossText}`);
      }

      private interactOneShot() {
        const pointer = this.input.activePointer;
        const interactPressed = Phaser.Input.Keyboard.JustDown(this.keyK) || (inputRef.current.interact && !this.prevVirtual.interact);
        this.prevVirtual.interact = inputRef.current.interact;
        if (!interactPressed) return;

        let activatedAny = false;
        if (this.mineNodes.length > 0) {
          for (const mineNode of this.mineNodes) {
            const id = String(mineNode.getData('id'));
            const hp = this.mineNodeHp.get(id) ?? 0;
            if (hp <= 0) continue;
            if (Phaser.Math.Distance.Between(mineNode.x, mineNode.y, this.player.x, this.player.y) > 64) continue;

            const nextHp = Math.max(0, hp - 1);
            this.mineNodeHp.set(id, nextHp);
            this.digDisplayUntil = this.time.now + 220;
            callbacksRef.current.onAction('dig');
            activatedAny = true;
            this.cameras.main.shake(60, 0.0018);

            for (let i = 0; i < 6; i += 1) {
              const chip = this.add.rectangle(
                mineNode.x + Phaser.Math.Between(-8, 8),
                mineNode.y + Phaser.Math.Between(-8, 8),
                3,
                3,
                Phaser.Math.RND.pick([0xb6bcbc, 0x74c772, 0x8d9491])
              ).setDepth(12);
              this.tweens.add({
                targets: chip,
                x: chip.x + Phaser.Math.Between(-24, 24),
                y: chip.y + Phaser.Math.Between(-24, -8),
                alpha: 0,
                duration: 180 + i * 14,
                onComplete: () => chip.destroy(),
              });
            }

            if (!this.firstMineHitPlayed) {
              this.firstMineHitPlayed = true;
              this.cameras.main.flash(120, 190, 255, 180, false);
            }

            if (nextHp === 2) mineNode.setTexture('mine-node-2');
            if (nextHp === 1) mineNode.setTexture('mine-node-1');

            if (nextHp === 0) {
              this.activatedSwitches.add(id);
              mineNode.setVisible(false);
              (mineNode.body as Phaser.Physics.Arcade.StaticBody).enable = false;
              this.tipText.setText(`矿块已开采：${this.activatedSwitches.size}/${this.totalMineNodes}`);
              if (this.activatedSwitches.size >= this.totalMineNodes) {
                this.tipText.setText('所有矿块已开采，前方大门已开启！');
                this.cameras.main.flash(120, 120, 255, 120, false);
              }
              this.refreshHud();
            } else {
              this.tipText.setText(`继续开采（剩余耐久：${nextHp}）`);
            }
            break;
          }
        } else {
          this.switches.forEach((sw) => {
            const id = String(sw.getData('id'));
            if (this.activatedSwitches.has(id)) return;
            if (Phaser.Math.Distance.Between(sw.x, sw.y, this.player.x, this.player.y) <= 52) {
              this.activatedSwitches.add(id);
              sw.setTexture('switch-on');
              this.cameras.main.flash(120, 120, 255, 120, false);
              callbacksRef.current.onAction('dig');
              activatedAny = true;
            }
          });
        }

        if (hasMineNodes && !activatedAny) {
          this.tipText.setText('靠近矿块后按 K 挥镐开采');
        }

        this.checkpoints.forEach((cp) => {
          const id = String(cp.getData('id'));
          if (this.activatedCheckpoints.has(id)) return;
          if (Phaser.Math.Distance.Between(cp.x, cp.y, this.player.x, this.player.y) <= 54) {
            this.activatedCheckpoints.add(id);
            this.respawn = { x: cp.x, y: cp.y - 36 };
            this.tweens.add({ targets: cp, alpha: 0.25, yoyo: true, duration: 180, repeat: 2 });
            callbacksRef.current.onCheckpoint(id);
            callbacksRef.current.onAction('checkpoint');
            activatedAny = true;
          }
        });

        if (activatedAny) this.refreshHud();
      }

      private attackOneShot() {
        const now = this.time.now;
        const attackPressed = Phaser.Input.Keyboard.JustDown(this.keyJ) || (inputRef.current.attack && !this.prevVirtual.attack);
        this.prevVirtual.attack = inputRef.current.attack;
        if (!attackPressed || now - this.lastAttackAt < 260) return;
        this.lastAttackAt = now;
        this.attackDisplayUntil = now + 190;
        callbacksRef.current.onAction('attack');
        this.cameras.main.shake(80, 0.0022);

        this.enemies.getChildren().forEach((entity) => {
          const enemy = entity as Phaser.Physics.Arcade.Sprite;
          if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 80) {
            this.tweens.add({
              targets: enemy,
              alpha: 0,
              y: enemy.y - 14,
              duration: 120,
              onComplete: () => enemy.destroy(),
            });
          }
        });

        if (this.boss && this.boss.active && Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y) < 90) {
          this.bossHp -= 1;
          this.cameras.main.flash(100, 255, 120, 120, false);
          if (this.bossHp <= 0) {
            const targetBoss = this.boss;
            this.boss = null;
            this.tweens.add({
              targets: targetBoss,
              alpha: 0,
              scale: 0.6,
              duration: 260,
              onComplete: () => targetBoss.destroy(),
            });
          } else {
            this.tweens.add({ targets: this.boss, x: this.boss.x + this.facing * 16, yoyo: true, duration: 90 });
          }
          this.refreshHud();
        }
      }

      private applyHit(reason: string) {
        const now = this.time.now;
        if (now - this.lastHitAt < 900 || finished) return;
        this.lastHitAt = now;
        this.hitDisplayUntil = now + 260;
        this.hits += 1;
        this.hearts -= 1;
        callbacksRef.current.onAction('hit');
        this.player.setTint(0xff7070);
        this.time.delayedCall(120, () => this.player.clearTint());
        this.cameras.main.shake(130, 0.004);
        this.refreshHud();

        if (this.hearts <= 0) {
          finished = true;
          callbacksRef.current.onAction('lose');
          callbacksRef.current.onFail(reason);
          return;
        }

        this.deaths += 1;
        this.player.setVelocity(0, 0);
        this.player.setPosition(this.respawn.x, this.respawn.y);
      }

      private tryComplete() {
        if (finished) return;
        const requiredCount = this.totalMineNodes > 0 ? this.totalMineNodes : layout.switches.length;
        if (this.activatedSwitches.size < requiredCount) {
          this.tipText.setText(`剩余目标：${requiredCount - this.activatedSwitches.size}`);
          return;
        }
        if (this.boss && this.boss.active) {
          this.tipText.setText('首领尚未击败');
          return;
        }

        finished = true;
        callbacksRef.current.onAction('win');
        callbacksRef.current.onComplete({
          clearTimeMs: Math.floor(performance.now() - this.runStartMs),
          remainingHearts: this.hearts,
          deaths: this.deaths,
          hits: this.hits,
          checkpoints: Array.from(this.activatedCheckpoints),
        });
      }

      update() {
        if (finished) return;

        if (this.player.y > layout.worldHeight + 80) {
          this.applyHit('掉入虚空');
          return;
        }

        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        const onGround = playerBody.blocked.down || playerBody.touching.down;
        if (onGround) this.jumpsLeft = 2;

        const left = (this.cursors.left?.isDown ?? false) || this.keyA.isDown || inputRef.current.left;
        const right = (this.cursors.right?.isDown ?? false) || this.keyD.isDown || inputRef.current.right;
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keySpace) || (inputRef.current.jump && !this.prevVirtual.jump);
        this.prevVirtual.jump = inputRef.current.jump;

        if (left) this.player.setVelocityX(-185);
        if (right) this.player.setVelocityX(185);
        if (!left && !right) this.player.setVelocityX(playerBody.velocity.x * 0.88);
        if (left) this.facing = -1;
        if (right) this.facing = 1;

        if (jumpPressed && this.jumpsLeft > 0) {
          this.player.setVelocityY(-360);
          this.jumpsLeft -= 1;
          callbacksRef.current.onAction('jump');
        }

        this.interactOneShot();
        this.attackOneShot();

        const isDigging = this.time.now < this.digDisplayUntil;
        if (isDigging) {
          this.player.setVelocityX(playerBody.velocity.x * 0.72);
        }

        this.gates.forEach((gate) => {
          const needs = Number(gate.getData('needs') || 0);
          const open = this.activatedSwitches.size >= needs;
          const body = gate.body as Phaser.Physics.Arcade.StaticBody;
          if (open) {
            gate.setAlpha(0.2);
            body.enable = false;
            if (hasMineNodes && !this.gateOpenedFxPlayed) {
              this.gateOpenedFxPlayed = true;
              this.cameras.main.flash(110, 160, 255, 140, false);
              this.cameras.main.shake(120, 0.0018);
            }
          } else {
            gate.setAlpha(1);
            body.enable = true;
          }
        });

        this.enemies.getChildren().forEach((entity) => {
          const enemy = entity as Phaser.Physics.Arcade.Sprite;
          const enemyBody = enemy.body as Phaser.Physics.Arcade.Body;
          const now = this.time.now;
          const kind = String(enemy.getData('type') || 'zombie') as EnemyKind;
          const baseX = Number(enemy.getData('baseX'));
          const range = Number(enemy.getData('range'));
          const baseSpeed = Number(enemy.getData('baseSpeed') || enemy.getData('speed') || 60);
          const aggroRange = Number(enemy.getData('aggroRange') || 0);
          const leftBound = baseX - range;
          const rightBound = baseX + range;
          let velocityX = enemyBody.velocity.x;

          if (kind === 'slime') {
            const hopIntervalMs = Number(enemy.getData('hopIntervalMs') || 900);
            const nextHopAt = Number(enemy.getData('nextHopAt') || 0);
            if (now >= nextHopAt) {
              enemy.setData('nextHopAt', now + hopIntervalMs + Phaser.Math.Between(-80, 120));
              this.tweens.add({
                targets: enemy,
                y: enemy.y - 14,
                yoyo: true,
                duration: 170,
                ease: 'Sine.easeOut',
              });
            }
            const shouldChase = aggroRange > 0 && Math.abs(this.player.x - enemy.x) <= aggroRange;
            if (shouldChase) {
              velocityX = this.player.x >= enemy.x ? baseSpeed * 1.2 : -baseSpeed * 1.2;
            } else if (Math.abs(velocityX) < 12) {
              velocityX = baseSpeed * (Phaser.Math.Between(0, 1) ? 1 : -1);
            } else {
              velocityX = Math.sign(velocityX) * baseSpeed;
            }
            const bob = Math.sin((now + enemy.x) * 0.012);
            enemy.setScale(1 + Math.abs(bob) * 0.08, 1 - Math.abs(bob) * 0.05);
          } else if (kind === 'skeleton') {
            const nearPlayer =
              aggroRange > 0 &&
              Math.abs(this.player.x - enemy.x) <= aggroRange &&
              Math.abs(this.player.y - enemy.y) <= 80;
            if (nearPlayer) {
              enemy.setVelocityX(0);
              const fireIntervalMs = Number(enemy.getData('fireIntervalMs') || 1500);
              const nextFireAt = Number(enemy.getData('nextFireAt') || 0);
              if (now >= nextFireAt) {
                enemy.setData('nextFireAt', now + fireIntervalMs + Phaser.Math.Between(-200, 200));
                const arrow = this.arrowGroup.create(enemy.x, enemy.y - 6, 'arrow') as Phaser.Physics.Arcade.Sprite;
                arrow.setDisplaySize(16, 6);
                const projectileSpeed = Number(enemy.getData('projectileSpeed') || 220);
                arrow.setVelocityX(this.player.x >= enemy.x ? projectileSpeed : -projectileSpeed);
                arrow.setFlipX(this.player.x < enemy.x);
                arrow.setData('lifespan', now + 2200);
                this.cameras.main.shake(40, 0.001);
              }
            } else if (Math.abs(velocityX) < 12) {
              velocityX = baseSpeed * (Phaser.Math.Between(0, 1) ? 1 : -1);
            } else {
              velocityX = Math.sign(velocityX) * baseSpeed;
            }
            enemy.setScale(1, 1);
          } else if (kind === 'creeper') {
            const nearPlayer =
              aggroRange > 0 &&
              Math.abs(this.player.x - enemy.x) <= aggroRange &&
              Math.abs(this.player.y - enemy.y) <= 70;
            const fuseState = String(enemy.getData('fuseState') || 'idle');
            if (nearPlayer) {
              if (fuseState === 'idle') {
                enemy.setData('fuseState', 'fusing');
                enemy.setData('fuseStartedAt', now);
                enemy.setTint(0xff8888);
              }
              const fuseStartedAt = Number(enemy.getData('fuseStartedAt') || now);
              const fuseTimeMs = Number(enemy.getData('fuseTimeMs') || 1300);
              if (now - fuseStartedAt >= fuseTimeMs) {
                const explosionRadius = Number(enemy.getData('explosionRadius') || 90);
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                if (dist <= explosionRadius) {
                  this.applyHit('被苦力怕炸伤');
                }
                this.cameras.main.shake(180, 0.008);
                this.cameras.main.flash(140, 255, 180, 120);
                enemy.destroy();
              } else {
                const progress = (now - fuseStartedAt) / fuseTimeMs;
                enemy.setScale(1 + progress * 0.2, 1 - progress * 0.1);
                velocityX = 0;
              }
            } else {
              if (fuseState === 'fusing') {
                enemy.setData('fuseState', 'idle');
                enemy.clearTint();
              }
              if (Math.abs(velocityX) < 12) {
                velocityX = baseSpeed * (Phaser.Math.Between(0, 1) ? 1 : -1);
              } else {
                velocityX = Math.sign(velocityX) * baseSpeed;
              }
              enemy.setScale(1, 1);
            }
          } else if (kind === 'enderman') {
            const nearPlayer =
              aggroRange > 0 &&
              Math.abs(this.player.x - enemy.x) <= aggroRange;
            const teleportIntervalMs = Number(enemy.getData('teleportIntervalMs') || 3500);
            const lastTeleportAt = Number(enemy.getData('lastTeleportAt') || -99999);
            if (nearPlayer && now - lastTeleportAt >= teleportIntervalMs) {
              enemy.setData('lastTeleportAt', now);
              const tpLeft = leftBound;
              const tpRight = rightBound;
              this.tweens.add({
                targets: enemy,
                alpha: 0,
                duration: 100,
                onComplete: () => {
                  if (!enemy.active) return;
                  const offsetX = this.player.x + Phaser.Math.Between(-120, 120);
                  const clampedX = Phaser.Math.Clamp(offsetX, tpLeft, tpRight);
                  enemy.setPosition(clampedX, this.player.y - 10);
                  this.tweens.add({ targets: enemy, alpha: 1, duration: 120 });
                  this.cameras.main.shake(60, 0.002);
                },
              });
            }
            if (nearPlayer) {
              velocityX = this.player.x >= enemy.x ? baseSpeed * 1.15 : -baseSpeed * 1.15;
            } else if (Math.abs(velocityX) < 12) {
              velocityX = baseSpeed * (Phaser.Math.Between(0, 1) ? 1 : -1);
            } else {
              velocityX = Math.sign(velocityX) * baseSpeed;
            }
            enemy.setScale(1, 1);
          } else {
            const dashSpeed = Number(enemy.getData('dashSpeed') || baseSpeed * 2.2);
            const dashDurationMs = Number(enemy.getData('dashDurationMs') || 220);
            const dashCooldownMs = Number(enemy.getData('dashCooldownMs') || 1300);
            const dashUntil = Number(enemy.getData('dashUntil') || 0);
            const lastDashAt = Number(enemy.getData('lastDashAt') || -99999);
            const nearPlayer =
              aggroRange > 0 &&
              Math.abs(this.player.x - enemy.x) <= aggroRange &&
              Math.abs(this.player.y - enemy.y) <= 70;
            if (nearPlayer && now - lastDashAt >= dashCooldownMs && now >= dashUntil) {
              enemy.setData('lastDashAt', now);
              enemy.setData('dashUntil', now + dashDurationMs);
            }

            const activeDashUntil = Number(enemy.getData('dashUntil') || 0);
            if (now < activeDashUntil) {
              velocityX = this.player.x >= enemy.x ? dashSpeed : -dashSpeed;
            } else if (nearPlayer) {
              velocityX = this.player.x >= enemy.x ? baseSpeed * 1.12 : -baseSpeed * 1.12;
            } else if (Math.abs(velocityX) < 12) {
              velocityX = baseSpeed * (Phaser.Math.Between(0, 1) ? 1 : -1);
            } else {
              velocityX = Math.sign(velocityX) * baseSpeed;
            }
            enemy.setScale(1, 1);
          }

          if (enemy.x < leftBound) velocityX = Math.abs(baseSpeed);
          if (enemy.x > rightBound) velocityX = -Math.abs(baseSpeed);
          enemy.setVelocityX(velocityX);
          enemy.setFlipX(velocityX < 0);
        });

        if (this.boss && this.boss.active) {
          const baseX = Number(this.boss.getData('baseX'));
          const range = Number(this.boss.getData('range'));
          const speed = Number(this.boss.getData('speed'));
          if (this.boss.x < baseX - range) this.boss.setVelocityX(speed);
          if (this.boss.x > baseX + range) this.boss.setVelocityX(-speed);
          const bossBody = this.boss.body as Phaser.Physics.Arcade.Body;
          this.boss.setFlipX(bossBody.velocity.x < 0);
          this.boss.y += Math.sin((this.time.now + this.boss.x) * 0.006) * 0.08;
        }

        let targetAnim = 'player-idle';
        if (this.time.now < this.hitDisplayUntil) {
          targetAnim = 'player-hit';
        } else if (isDigging) {
          targetAnim = 'player-dig';
        } else if (this.time.now < this.attackDisplayUntil) {
          targetAnim = 'player-attack';
        } else if (!onGround) {
          targetAnim = 'player-jump';
        } else if (Math.abs(playerBody.velocity.x) > 35) {
          targetAnim = 'player-run';
        }
        if (this.player.anims.currentAnim?.key !== targetAnim) {
          this.player.play(targetAnim, true);
        }
        this.player.setFlipX(this.facing < 0);

        if (this.pickaxe.visible) {
          const handOffsetX = this.facing < 0 ? -12 : 12;
          const handOffsetY = isDigging ? -2 : 2;
          this.pickaxe.setPosition(this.player.x + handOffsetX, this.player.y + handOffsetY);
          this.pickaxe.setFlipX(this.facing < 0);
          if (isDigging) {
            const progress = 1 - Math.max(0, this.digDisplayUntil - this.time.now) / 220;
            const swing = Math.sin(progress * Math.PI) * 78;
            this.pickaxe.setAngle(this.facing < 0 ? -116 + swing : 116 - swing);
          } else if (this.time.now < this.attackDisplayUntil) {
            this.pickaxe.setAngle(this.facing < 0 ? -62 : 62);
          } else {
            this.pickaxe.setAngle(this.facing < 0 ? -32 : 32);
          }
        }
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: layout.worldWidth > 3000 ? 1280 : 1120,
      height: layout.worldHeight,
      backgroundColor: `#${biomeTheme.skyTop.toString(16).padStart(6, '0')}`,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 880 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [StageScene],
    });

    return () => {
      finished = true;
      game.destroy(true);
    };
  }, [level, sessionId]);

  const setVirtual = (key: keyof typeof inputRef.current, value: boolean) => {
    inputRef.current[key] = value;
  };

  return (
    <div className="relative">
      <div ref={hostRef} className="w-full min-h-[520px] rounded-lg border-4 border-minecraft-stone overflow-hidden" />
      {touchEnabled && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-4 left-4 flex gap-3 pointer-events-auto">
            <button
              className="h-14 w-14 rounded-full border-2 border-white/40 bg-black/45 text-xl font-bold text-white shadow-md"
              onTouchStart={() => setVirtual('left', true)}
              onTouchEnd={() => setVirtual('left', false)}
              onTouchCancel={() => setVirtual('left', false)}
              onMouseDown={() => setVirtual('left', true)}
              onMouseUp={() => setVirtual('left', false)}
              onMouseLeave={() => setVirtual('left', false)}
            >
              ◀
            </button>
            <button
              className="h-14 w-14 rounded-full border-2 border-white/40 bg-black/45 text-xl font-bold text-white shadow-md"
              onTouchStart={() => setVirtual('right', true)}
              onTouchEnd={() => setVirtual('right', false)}
              onTouchCancel={() => setVirtual('right', false)}
              onMouseDown={() => setVirtual('right', true)}
              onMouseUp={() => setVirtual('right', false)}
              onMouseLeave={() => setVirtual('right', false)}
            >
              ▶
            </button>
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto">
            <button
              className="rounded-xl border-2 border-cyan-200/70 bg-cyan-500/65 px-3 py-2 text-xs font-bold tracking-wide text-white shadow-md"
              onTouchStart={() => setVirtual('jump', true)}
              onTouchEnd={() => setVirtual('jump', false)}
              onTouchCancel={() => setVirtual('jump', false)}
              onMouseDown={() => setVirtual('jump', true)}
              onMouseUp={() => setVirtual('jump', false)}
              onMouseLeave={() => setVirtual('jump', false)}
            >
              跳
            </button>
            <button
              className="rounded-xl border-2 border-orange-200/70 bg-orange-500/75 px-3 py-2 text-xs font-bold tracking-wide text-white shadow-md"
              onTouchStart={() => setVirtual('attack', true)}
              onTouchEnd={() => setVirtual('attack', false)}
              onTouchCancel={() => setVirtual('attack', false)}
              onMouseDown={() => setVirtual('attack', true)}
              onMouseUp={() => setVirtual('attack', false)}
              onMouseLeave={() => setVirtual('attack', false)}
            >
              打
            </button>
            <button
              className="rounded-xl border-2 border-emerald-200/70 bg-emerald-500/75 px-3 py-2 text-xs font-bold tracking-wide text-white shadow-md"
              onTouchStart={() => setVirtual('interact', true)}
              onTouchEnd={() => setVirtual('interact', false)}
              onTouchCancel={() => setVirtual('interact', false)}
              onMouseDown={() => setVirtual('interact', true)}
              onMouseUp={() => setVirtual('interact', false)}
              onMouseLeave={() => setVirtual('interact', false)}
            >
              用
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function GameMode({
  users,
  gameState,
  soundEnabled,
  onStartLevel,
  onFinishLevel,
  onFailLevel,
  onSaveCheckpoint,
  onBattleLockChange,
}: GameModeProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [mode, setMode] = useState<Mode>('hub');
  const [currentLevel, setCurrentLevel] = useState<CampaignLevelDefinition | null>(null);
  const [result, setResult] = useState<FinishLevelResult | { ok: boolean; message: string } | null>(null);
  const [sessionId, setSessionId] = useState(0);
  const bgmRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeUserId = selectedUserId || users[0]?.id || '';
  const campaignState = gameState.campaign;
  const levels = useMemo(() => [...campaignState.levels].sort((a, b) => a.index - b.index), [campaignState.levels]);
  const progress = activeUserId ? campaignState.progress[activeUserId] : undefined;

  const ensureAudioContext = () => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current;
  };

  const playTone = useCallback((freq: number, duration = 0.08, type: OscillatorType = 'square', gainValue = 0.06) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.type = type;
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, []);

  const playActionSound = useCallback((action: GameAction) => {
    if (!soundEnabled) return;
    switch (action) {
      case 'jump':
        playTone(720, 0.07, 'square');
        break;
      case 'attack':
        playTone(420, 0.06, 'sawtooth');
        playTone(260, 0.05, 'square');
        break;
      case 'dig':
        playTone(280, 0.07, 'triangle');
        break;
      case 'hit':
        playTone(160, 0.15, 'sawtooth');
        break;
      case 'checkpoint':
        playTone(860, 0.08, 'sine');
        break;
      case 'win':
        playTone(540, 0.09, 'square');
        playTone(700, 0.09, 'square');
        playTone(980, 0.12, 'square');
        break;
      case 'lose':
        playTone(220, 0.25, 'triangle');
        break;
    }
  }, [playTone, soundEnabled]);

  useEffect(() => {
    onBattleLockChange(mode === 'playing');
  }, [mode, onBattleLockChange]);

  useEffect(() => {
    if (bgmRef.current !== null) {
      window.clearInterval(bgmRef.current);
      bgmRef.current = null;
    }
    if (!soundEnabled || mode !== 'playing') return;
    const notes = [220, 261.63, 293.66, 349.23, 392, 349.23, 293.66, 261.63];
    let idx = 0;
    bgmRef.current = window.setInterval(() => {
      playTone(notes[idx % notes.length], 0.18, 'triangle', 0.035);
      idx += 1;
    }, 290);
    return () => {
      if (bgmRef.current !== null) {
        window.clearInterval(bgmRef.current);
        bgmRef.current = null;
      }
    };
  }, [mode, playTone, soundEnabled]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (bgmRef.current !== null) window.clearInterval(bgmRef.current);
    };
  }, []);

  const startLevel = (level: CampaignLevelDefinition) => {
    if (!activeUserId) return;
    const start = onStartLevel(activeUserId, level.id);
    if (!start.ok) {
      window.alert(start.message);
      return;
    }
    setCurrentLevel(level);
    setResult(null);
    setMode('playing');
    setSessionId((prev) => prev + 1);
  };

  const onRunnerComplete = (stats: FinishLevelStats) => {
    if (!activeUserId || !currentLevel) return;
    const finish = onFinishLevel(activeUserId, currentLevel.id, stats);
    setResult(finish);
    setMode('result');
  };

  const onRunnerFail = (reason: string) => {
    if (!activeUserId || !currentLevel) return;
    const fail = onFailLevel(activeUserId, currentLevel.id, reason);
    setResult(fail);
    setMode('result');
  };

  const rerunCurrent = () => {
    if (!currentLevel) return;
    startLevel(currentLevel);
  };

  if (!users.length) {
    return (
      <Card className="minecraft-card border-4 border-minecraft-stone">
        <CardContent className="p-6 text-center">
          <p className="font-pixel text-minecraft-stone">请先创建用户，再进入闯关模式。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="minecraft-card border-4 border-minecraft-wood">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div>
              <h2 className="text-2xl font-pixel text-minecraft-gold flex items-center gap-2">
                <Gamepad2 className="w-6 h-6" />
                像素方块闯关
              </h2>
              <p className="font-pixel text-minecraft-stone text-sm">
                A/D 或 左/右 移动，Space 跳跃（支持二段跳），J 攻击，K 交互；手机端会自动显示触控按键。
              </p>
            </div>
            <div className="w-full sm:w-64">
              <Select value={activeUserId} onValueChange={setSelectedUserId} disabled={mode === 'playing'}>
                <SelectTrigger className="minecraft-input font-pixel">
                  <SelectValue placeholder="选择用户" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id} className="font-pixel">
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="minecraft-panel p-3 border border-minecraft-stone/50">
              <div className="font-pixel text-minecraft-stone text-sm">已解锁关卡</div>
              <div className="font-pixel text-2xl text-minecraft-emerald">{progress?.unlockedLevelIds.length ?? 1}</div>
            </div>
            <div className="minecraft-panel p-3 border border-minecraft-stone/50">
              <div className="font-pixel text-minecraft-stone text-sm">已完成关卡</div>
              <div className="font-pixel text-2xl text-minecraft-gold">{progress?.completedLevelIds.length ?? 0}</div>
            </div>
            <div className="minecraft-panel p-3 border border-minecraft-stone/50">
              <div className="font-pixel text-minecraft-stone text-sm">状态</div>
              <div className="font-pixel text-2xl text-minecraft-diamond">{mode === 'playing' ? '进行中' : '待命'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {mode !== 'playing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {levels.map(level => {
            const unlocked = progress?.unlockedLevelIds.includes(level.id) ?? level.index === 1;
            const levelResult = progress?.levelResults?.[level.id];
            const displayObjective = level.objective;
            return (
              <Card key={level.id} className="minecraft-card border-2 border-minecraft-stone/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-pixel text-minecraft-gold text-lg">第 {level.index} 关 · {level.name}</div>
                      <div className="font-pixel text-minecraft-stone text-sm">{level.description}</div>
                    </div>
                    <div className={`font-pixel text-sm ${unlocked ? 'text-minecraft-emerald' : 'text-minecraft-lava'}`}>
                      {unlocked ? '已解锁' : '未解锁'}
                    </div>
                  </div>
                  <div className="font-pixel text-sm text-white flex items-center gap-2">
                    <Flag className="w-4 h-4 text-minecraft-gold" />
                    {displayObjective}
                  </div>
                  <div className="font-pixel text-xs text-minecraft-stone">目标时间：{Math.round(level.parTimeMs / 1000)} 秒</div>
                  <div className="font-pixel text-xs text-minecraft-stone flex gap-4">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 星级：{levelResult?.stars ?? 0}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> 通关：{levelResult?.clearCount ?? 0} 次</span>
                    <span>最佳：{levelResult?.bestTimeMs ? `${Math.floor(levelResult.bestTimeMs / 1000)} 秒` : '--'}</span>
                  </div>
                  <Button
                    disabled={!unlocked}
                    className={`minecraft-btn w-full ${unlocked ? 'bg-minecraft-lava hover:bg-minecraft-lava/90' : 'bg-minecraft-stone'}`}
                    onClick={() => startLevel(level)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    进入关卡
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {mode === 'playing' && currentLevel && (
        <Card className="minecraft-card border-4 border-minecraft-lava">
          <CardContent className="p-2 md:p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="font-pixel text-minecraft-gold text-lg">关卡进行中：{currentLevel.name}</div>
              <Button className="minecraft-btn bg-minecraft-stone hover:bg-minecraft-stone/90" onClick={() => setMode('hub')}>
                <Home className="w-4 h-4 mr-2" />
                退出本局
              </Button>
            </div>
            <PhaserRunner
              key={sessionId}
              level={currentLevel}
              sessionId={sessionId}
              onCheckpoint={(checkpointId) => activeUserId && onSaveCheckpoint(activeUserId, currentLevel.id, checkpointId)}
              onComplete={onRunnerComplete}
              onFail={onRunnerFail}
              onAction={playActionSound}
            />
          </CardContent>
        </Card>
      )}

      {mode === 'result' && result && (
        <Card className="minecraft-card border-4 border-minecraft-diamond">
          <CardContent className="p-5 text-center space-y-3">
            <div className="font-pixel text-2xl text-white">{result.ok ? '结算完成' : '挑战失败'}</div>
            <div className="font-pixel text-minecraft-stone">{result.message}</div>
            {'stars' in result && (
              <div className="font-pixel text-minecraft-gold">
                星级：{result.stars} · 奖励：{result.rewardScore} 绿宝石{result.rewardXp > 0 ? ` · +${result.rewardXp} XP` : ''}
              </div>
            )}
            <div className="flex justify-center gap-2 flex-wrap">
              <Button className="minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90" onClick={rerunCurrent}>
                <RotateCcw className="w-4 h-4 mr-2" />
                再来一次
              </Button>
              <Button className="minecraft-btn bg-minecraft-stone hover:bg-minecraft-stone/90" onClick={() => setMode('hub')}>
                <Home className="w-4 h-4 mr-2" />
                返回大厅
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


