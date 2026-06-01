import { useState, useEffect, useCallback } from 'react';
import type {
  AppState,
  User,
  CheckInProject,
  CheckInInstance,
  ShopItem,
  RedemptionRecord,
  RewardPunishmentRule,
  RewardPunishmentRecord,
  CheckInRecord,
  ReviveCardRecord,
  BackupRecord,
  Achievement,
  DailyChallenge,
  LevelConfig,
  UserLevel,
  UserAchievement,
  GameState,
  LevelDefinition,
  MaterialId,
  UserGameProgress,
  CampaignGameState,
  CampaignLevelDefinition,
  CampaignLevelResult,
  CampaignPlayerProgress,
  CampaignRunState,
  StartLevelResult,
  FinishLevelResult,
  FinishLevelStats,
  FailLevelResult,
} from '@/types';

const STORAGE_KEY = 'minecraft-checkin-app';
const BACKUP_STORAGE_KEY = 'minecraft-checkin-backups';
const MAX_BACKUPS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const APP_SCHEMA_VERSION = 2;
const FIRST_LEVEL_ID = 'lv-w1-overworld';
const CAMPAIGN_VERSION = 2;
const CAMPAIGN_FIRST_CLEAR_REWARD_SCORE = 60;
const CAMPAIGN_FIRST_CLEAR_REWARD_XP = 40;
const CAMPAIGN_REPEAT_CLEAR_REWARD_SCORE = 15;

const MATERIAL_CONFIG: Record<MaterialId, { name: string; price: number; weeklyLimit?: number; icon: string; color: string }> = {
  plank: { name: '木板', price: 2, icon: 'package', color: '#8b4513' },
  cobblestone: { name: '圆石', price: 4, icon: 'grass', color: '#7a7a7a' },
  iron_ingot: { name: '铁锭', price: 8, icon: 'gold', color: '#b0b0b0' },
  diamond_shard: { name: '钻石碎片', price: 16, weeklyLimit: 20, icon: 'diamond', color: '#00aaaa' },
  obsidian: { name: '黑曜石', price: 30, weeklyLimit: 8, icon: 'book', color: '#2a1b3d' },
};

const DEFAULT_CAMPAIGN_LEVELS: CampaignLevelDefinition[] = [
  { id: 'campaign-1-grass', index: 1, name: '草地训练营', biome: 'grassland', description: '白天主世界训练：挥镐开采、躲避怪物并冲向终点', objective: '开采 3 个矿块并抵达终点', parTimeMs: 110000 },
  { id: 'campaign-2-cave', index: 2, name: '矿洞陷阱带', biome: 'cave', description: '躲避落石与尖刺，切换地形机关', objective: '抵达终点并激活2个机关', parTimeMs: 120000 },
  { id: 'campaign-3-redstone', index: 3, name: '红石迷门', biome: 'redstone', description: '开关门、限时通路与路径判断', objective: '激活 3 个机关并穿越限时通路抵达终点', parTimeMs: 140000 },
  { id: 'campaign-4-rail', index: 4, name: '轨道追逐', biome: 'rail', description: '移动平台与节奏跳跃挑战', objective: '开采 6 个矿块并抵达终点', parTimeMs: 145000 },
  { id: 'campaign-5-nether', index: 5, name: '下界熔岩桥', biome: 'nether', description: '高风险跳跃与火焰敌人压制', objective: '开采 6 个矿块并抵达终点', parTimeMs: 170000 },
  { id: 'campaign-6-end', index: 6, name: '末地核心', biome: 'end', description: '终章关：机关组合与小Boss混战', objective: '开采 6 个矿块并击败Boss', parTimeMs: 190000 },
];

const createDefaultLevels = (): LevelDefinition[] => [
  {
    id: FIRST_LEVEL_ID,
    chapterId: 'overworld',
    chapterName: '主世界',
    name: '新手床核',
    weekUnlock: 1,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '羊毛', blockCount: 12, requiredPickaxeTier: 'wood', durabilityPerBlock: 1 },
      { material: '木板', blockCount: 8, requiredPickaxeTier: 'wood', durabilityPerBlock: 1 },
    ],
    // 首关无打卡门槛，进入即玩
    condition: { minCheckInsLast7: 0 },
  },
  {
    id: 'lv-w2-overworld',
    chapterId: 'overworld',
    chapterName: '主世界',
    name: '护床强化',
    weekUnlock: 2,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '羊毛', blockCount: 16, requiredPickaxeTier: 'wood', durabilityPerBlock: 1 },
      { material: '木板', blockCount: 12, requiredPickaxeTier: 'wood', durabilityPerBlock: 1 },
      { material: '圆石', blockCount: 10, requiredPickaxeTier: 'stone', durabilityPerBlock: 2 },
    ],
    condition: { minCheckInsLast7: 4 },
  },
  {
    id: 'lv-w3-overworld',
    chapterId: 'overworld',
    chapterName: '主世界',
    name: '主世界Boss床',
    weekUnlock: 3,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '木板', blockCount: 18, requiredPickaxeTier: 'wood', durabilityPerBlock: 1 },
      { material: '圆石', blockCount: 14, requiredPickaxeTier: 'stone', durabilityPerBlock: 2 },
      { material: '铁块', blockCount: 6, requiredPickaxeTier: 'iron', durabilityPerBlock: 3 },
    ],
    condition: { minCheckInsLast7: 5, minDistinctProjectsLast14: 2 },
  },
  {
    id: 'lv-w4-cave',
    chapterId: 'cave',
    chapterName: '矿洞',
    name: '矿洞入口床',
    weekUnlock: 4,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '圆石', blockCount: 20, requiredPickaxeTier: 'stone', durabilityPerBlock: 2 },
      { material: '铁块', blockCount: 8, requiredPickaxeTier: 'iron', durabilityPerBlock: 3 },
    ],
    condition: { minCheckInsLast7: 5, minDistinctProjectsLast14: 2 },
  },
  {
    id: 'lv-w5-cave',
    chapterId: 'cave',
    chapterName: '矿洞',
    name: '地牢封印床',
    weekUnlock: 5,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '末地石', blockCount: 18, requiredPickaxeTier: 'iron', durabilityPerBlock: 3 },
      { material: '铁块', blockCount: 12, requiredPickaxeTier: 'iron', durabilityPerBlock: 3 },
    ],
    condition: { minCheckInsLast7: 5, minDistinctProjectsLast14: 2 },
  },
  {
    id: 'lv-w6-cave',
    chapterId: 'cave',
    chapterName: '矿洞',
    name: '矿脉守卫床',
    weekUnlock: 6,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '末地石', blockCount: 20, requiredPickaxeTier: 'iron', durabilityPerBlock: 3 },
      { material: '黑曜石', blockCount: 6, requiredPickaxeTier: 'diamond', durabilityPerBlock: 5 },
    ],
    condition: { minCheckInsLast7: 5, minDistinctProjectsLast14: 2 },
  },
  {
    id: 'lv-w7-cave',
    chapterId: 'cave',
    chapterName: '矿洞',
    name: '矿洞Boss床',
    weekUnlock: 7,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '铁块', blockCount: 14, requiredPickaxeTier: 'iron', durabilityPerBlock: 3 },
      { material: '黑曜石', blockCount: 10, requiredPickaxeTier: 'diamond', durabilityPerBlock: 5 },
    ],
    condition: { minCheckInsLast7: 5, minDistinctProjectsLast14: 3 },
  },
  {
    id: 'lv-w8-nether',
    chapterId: 'nether',
    chapterName: '下界',
    name: '下界门户床',
    weekUnlock: 8,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '末地石', blockCount: 24, requiredPickaxeTier: 'iron', durabilityPerBlock: 3 },
      { material: '黑曜石', blockCount: 10, requiredPickaxeTier: 'diamond', durabilityPerBlock: 5 },
    ],
    condition: { minCheckInsLast7: 5, minDistinctProjectsLast14: 3 },
  },
  {
    id: 'lv-w9-nether',
    chapterId: 'nether',
    chapterName: '下界',
    name: '烈焰祭坛床',
    weekUnlock: 9,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '黑曜石', blockCount: 14, requiredPickaxeTier: 'diamond', durabilityPerBlock: 5 },
      { material: '远古碎片层', blockCount: 10, requiredPickaxeTier: 'diamond', durabilityPerBlock: 6 },
    ],
    condition: { minCheckInsLast7: 5, minDistinctProjectsLast14: 3 },
  },
  {
    id: 'lv-w10-nether',
    chapterId: 'nether',
    chapterName: '下界',
    name: '地狱堡垒床',
    weekUnlock: 10,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '黑曜石', blockCount: 16, requiredPickaxeTier: 'diamond', durabilityPerBlock: 5 },
      { material: '下界合金层', blockCount: 10, requiredPickaxeTier: 'diamond', durabilityPerBlock: 6 },
    ],
    condition: { minCheckInsLast7: 6, minDistinctProjectsLast14: 3 },
  },
  {
    id: 'lv-w11-nether',
    chapterId: 'nether',
    chapterName: '下界',
    name: '下界Boss床',
    weekUnlock: 11,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '下界合金层', blockCount: 12, requiredPickaxeTier: 'diamond', durabilityPerBlock: 6 },
      { material: '黑曜石', blockCount: 18, requiredPickaxeTier: 'diamond', durabilityPerBlock: 5 },
    ],
    condition: { minCheckInsLast7: 6, minDistinctProjectsLast14: 3 },
  },
  {
    id: 'lv-w12-nether',
    chapterId: 'nether',
    chapterName: '下界',
    name: '终焉前夜床',
    weekUnlock: 12,
    isBoss: true,
    rewardWeeklyBadge: true,
    layers: [
      { material: '远古碎片层', blockCount: 12, requiredPickaxeTier: 'diamond', durabilityPerBlock: 6 },
      { material: '黑曜石', blockCount: 20, requiredPickaxeTier: 'diamond', durabilityPerBlock: 5 },
    ],
    condition: { minCheckInsLast7: 6, minDistinctProjectsLast14: 3 },
  },
  {
    id: 'lv-w13-end-final',
    chapterId: 'end',
    chapterName: '末地',
    name: '末地最终床核',
    weekUnlock: 13,
    isBoss: true,
    rewardWeeklyBadge: true,
    isFinal: true,
    layers: [
      { material: '末地石', blockCount: 20, requiredPickaxeTier: 'diamond', durabilityPerBlock: 6 },
      { material: '黑曜石', blockCount: 24, requiredPickaxeTier: 'diamond', durabilityPerBlock: 6 },
    ],
    condition: { minCheckInsLast7: 6, minDistinctProjectsLast14: 3 },
  },
];

const getToday = () => new Date().toISOString().split('T')[0];

const getCurrentWeek = (startDate: string): number => {
  const start = new Date(startDate);
  const now = new Date(getToday());
  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / DAY_MS));
  return Math.min(13, Math.max(1, Math.floor(days / 7) + 1));
};

const createEmptyCampaignResult = (): CampaignLevelResult => ({
  stars: 0,
  bestTimeMs: null,
  clearCount: 0,
  firstClearAt: null,
  firstClearRewardClaimed: false,
  checkpoints: []
});

const createDefaultCampaignPlayerProgress = (): CampaignPlayerProgress => ({
  unlockedLevelIds: [DEFAULT_CAMPAIGN_LEVELS[0].id],
  completedLevelIds: [],
  currentLevelId: null,
  checkpointId: null,
  maxHearts: 5,
  tutorialCompleted: false,
  levelResults: {}
});

const createDefaultCampaignState = (users: User[] = []): CampaignGameState => {
  const progress: Record<string, CampaignPlayerProgress> = {};
  const activeRuns: Record<string, CampaignRunState | null> = {};
  users.forEach((user) => {
    progress[user.id] = createDefaultCampaignPlayerProgress();
    activeRuns[user.id] = null;
  });
  return {
    version: CAMPAIGN_VERSION,
    levels: DEFAULT_CAMPAIGN_LEVELS,
    progress,
    activeRuns
  };
};

const getDefaultGameState = (): GameState => {
  const today = getToday();
  return {
    campaign: createDefaultCampaignState(),
    season: {
      seasonId: `season-${today}`,
      startDate: today,
      currentWeek: 1,
    },
    inventory: {},
    tools: {},
    levels: createDefaultLevels(),
    progress: {},
  };
};

const getDefaultUserProgress = (): UserGameProgress => ({
  actionPoints: 3,
  maxActionPoints: 5,
  lastApRefreshDate: null,
  clearedLevelIds: [],
  weeklyBadges: [],
  usedDiamondPickaxe: false,
  finalCleared: false,
});

const ensureSystemMaterialItems = (items: ShopItem[]): ShopItem[] => {
  const merged = [...items];
  (Object.keys(MATERIAL_CONFIG) as MaterialId[]).forEach((materialId) => {
    const exists = merged.some(i => i.materialId === materialId || i.id === `sys-material-${materialId}`);
    if (exists) return;
    const config = MATERIAL_CONFIG[materialId];
    merged.push({
      id: `sys-material-${materialId}`,
      name: config.name,
      description: `用于工作台合成镐（${config.name}）`,
      cost: config.price,
      icon: config.icon,
      color: config.color,
      stock: 9999,
      unlimited: true,
      isSystemMaterial: true,
      materialId,
      weeklyLimit: config.weeklyLimit,
    });
  });
  return merged;
};

const relaxFirstLevelCondition = (levels: LevelDefinition[]): LevelDefinition[] =>
  levels.map((level) => {
    if (level.id !== FIRST_LEVEL_ID) return level;
    return {
      ...level,
      condition: {
        ...(level.condition || {}),
        minCheckInsLast7: 0,
      },
    };
  });

const normalizeGameState = (gameState: GameState | undefined, users: User[]): GameState => {
  const base = gameState ? { ...gameState } : getDefaultGameState();
  const levels = relaxFirstLevelCondition(base.levels?.length ? base.levels : createDefaultLevels());
  const currentWeek = getCurrentWeek(base.season.startDate || getToday());
  const baseCampaign = base.campaign || createDefaultCampaignState(users);
  const needsCampaignUpgrade = (baseCampaign.version || 1) < CAMPAIGN_VERSION;
  const storedCampaignLevels = baseCampaign.levels?.length ? baseCampaign.levels : DEFAULT_CAMPAIGN_LEVELS;
  const mergedDefaultCampaignLevels = DEFAULT_CAMPAIGN_LEVELS.map((defaultLevel) => {
    const stored = storedCampaignLevels.find(level => level.id === defaultLevel.id);
    return stored ? { ...stored, ...defaultLevel } : defaultLevel;
  });
  const extraStoredCampaignLevels = storedCampaignLevels.filter(
    storedLevel => !DEFAULT_CAMPAIGN_LEVELS.some(defaultLevel => defaultLevel.id === storedLevel.id)
  );
  const campaignLevels = needsCampaignUpgrade
    ? DEFAULT_CAMPAIGN_LEVELS
    : [...mergedDefaultCampaignLevels, ...extraStoredCampaignLevels];
  const normalizedCampaign: CampaignGameState = {
    version: CAMPAIGN_VERSION,
    levels: campaignLevels,
    progress: { ...(baseCampaign.progress || {}) },
    activeRuns: { ...(baseCampaign.activeRuns || {}) }
  };

  users.forEach((user) => {
    if (!normalizedCampaign.progress[user.id]) {
      normalizedCampaign.progress[user.id] = createDefaultCampaignPlayerProgress();
    }
    if (normalizedCampaign.activeRuns[user.id] === undefined) {
      normalizedCampaign.activeRuns[user.id] = null;
    }
  });

  Object.keys(normalizedCampaign.progress).forEach((userId) => {
    const playerProgress = normalizedCampaign.progress[userId];
    const levelResults = { ...(playerProgress.levelResults || {}) };
    campaignLevels.forEach((level) => {
      if (!levelResults[level.id]) {
        levelResults[level.id] = createEmptyCampaignResult();
      }
    });
    normalizedCampaign.progress[userId] = {
      ...createDefaultCampaignPlayerProgress(),
      ...playerProgress,
      levelResults
    };
  });

  const normalized: GameState = {
    campaign: normalizedCampaign,
    season: {
      seasonId: base.season.seasonId || `season-${base.season.startDate || getToday()}`,
      startDate: base.season.startDate || getToday(),
      currentWeek,
    },
    inventory: { ...(base.inventory || {}) },
    tools: { ...(base.tools || {}) },
    levels,
    progress: { ...(base.progress || {}) },
  };

  users.forEach((user) => {
    if (!normalized.inventory[user.id]) {
      normalized.inventory[user.id] = {
        plank: 0,
        cobblestone: 0,
        iron_ingot: 0,
        diamond_shard: 0,
        obsidian: 0,
      };
    }
    if (!normalized.tools[user.id]) {
      normalized.tools[user.id] = [];
    }
    if (!normalized.progress[user.id]) {
      normalized.progress[user.id] = getDefaultUserProgress();
    }
  });

  return normalized;
};

// 默认成就列表
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // 打卡成就
  { id: 'ach-1', name: '初次打卡', description: '完成第一次打卡', icon: '🌱', color: '#5d8c37', category: 'checkin', requirement: 1, type: 'checkin_count', reward: { score: 10 } },
  { id: 'ach-2', name: '打卡新星', description: '累计打卡10次', icon: '⭐', color: '#ffcc00', category: 'checkin', requirement: 10, type: 'checkin_count', reward: { score: 50 } },
  { id: 'ach-3', name: '打卡达人', description: '累计打卡50次', icon: '🌟', color: '#00ffff', category: 'checkin', requirement: 50, type: 'checkin_count', reward: { score: 200, reviveCard: 1 } },
  { id: 'ach-4', name: '打卡传奇', description: '累计打卡100次', icon: '💎', color: '#00aaaa', category: 'checkin', requirement: 100, type: 'checkin_count', reward: { score: 500, reviveCard: 3 } },
  { id: 'ach-5', name: '打卡王者', description: '累计打卡365次', icon: '👑', color: '#ffcc00', category: 'checkin', requirement: 365, type: 'checkin_count', reward: { score: 1000, reviveCard: 5 } },
  // 连续成就
  { id: 'ach-6', name: '初次连续', description: '连续打卡3天', icon: '🔥', color: '#ff6600', category: 'streak', requirement: 3, type: 'streak_days', reward: { score: 30 } },
  { id: 'ach-7', name: '一周连续', description: '连续打卡7天', icon: '🔥', color: '#ff4400', category: 'streak', requirement: 7, type: 'streak_days', reward: { score: 70 } },
  { id: 'ach-8', name: '两周连续', description: '连续打卡14天', icon: '🔥', color: '#ff0000', category: 'streak', requirement: 14, type: 'streak_days', reward: { score: 140 } },
  { id: 'ach-9', name: '一月连续', description: '连续打卡30天', icon: '🔥', color: '#cc0000', category: 'streak', requirement: 30, type: 'streak_days', reward: { score: 300, reviveCard: 2 } },
  { id: 'ach-10', name: '季度连续', description: '连续打卡90天', icon: '🌈', color: '#ff00ff', category: 'streak', requirement: 90, type: 'streak_days', reward: { score: 900, reviveCard: 5 } },
  { id: 'ach-11', name: '永不止步', description: '连续打卡365天', icon: '🚀', color: '#00ff00', category: 'streak', requirement: 365, type: 'streak_days', reward: { score: 3650, reviveCard: 10 } },
  // 绿宝石成就
  { id: 'ach-12', name: '初露锋芒', description: '累计获得100绿宝石', icon: '💰', color: '#ffcc00', category: 'milestone', requirement: 100, type: 'total_score', reward: { score: 20 } },
  { id: 'ach-13', name: '小有积蓄', description: '累计获得500绿宝石', icon: '💎', color: '#00ffff', category: 'milestone', requirement: 500, type: 'total_score', reward: { score: 50 } },
  { id: 'ach-14', name: '富甲一方', description: '累计获得2000绿宝石', icon: '🏆', color: '#ffcc00', category: 'milestone', requirement: 2000, type: 'total_score', reward: { score: 200 } },
  { id: 'ach-15', name: '腰缠万贯', description: '累计获得10000绿宝石', icon: '👑', color: '#ff00ff', category: 'milestone', requirement: 10000, type: 'total_score', reward: { score: 1000 } },
  // 项目成就
  { id: 'ach-16', name: '多面手', description: '同时参与3个打卡项目', icon: '🎯', color: '#00aaaa', category: 'milestone', requirement: 3, type: 'project_count', reward: { score: 100 } },
  { id: 'ach-17', name: '全能选手', description: '同时参与5个打卡项目', icon: '🎖️', color: '#ffcc00', category: 'milestone', requirement: 5, type: 'project_count', reward: { score: 250, reviveCard: 2 } },
  // 特殊成就
  { id: 'ach-18', name: '凌晨刷师', description: '在凌晨0-5点打卡', icon: '🦉', color: '#4a0080', category: 'special', requirement: 1, type: 'special', secret: true },
  { id: 'ach-19', name: '年末冲刺', description: '在12月31日打卡', icon: '🎄', color: '#ff0000', category: 'special', requirement: 1, type: 'special' },
];

// 默认等级配置
const DEFAULT_LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1, title: '新手冒险家', minXP: 0, maxXP: 100, icon: '🧱', color: '#8b7355', perks: ['基础打卡功能'] },
  { level: 2, title: '石斧收集者', minXP: 100, maxXP: 300, icon: '🪓', color: '#7a7a7a', perks: ['解锁基础成就'] },
  { level: 3, title: '煤炭探索者', minXP: 300, maxXP: 600, icon: '⚫', color: '#333333', perks: ['每日挑战'] },
  { level: 4, title: '铁锭锻造师', minXP: 600, maxXP: 1000, icon: '🔩', color: '#e6e6e6', perks: ['解锁商城特权'] },
  { level: 5, title: '红石工程师', minXP: 1000, maxXP: 1500, icon: '🔴', color: '#ff0000', perks: ['称号自定义'] },
  { level: 6, title: '钻石猎人', minXP: 1500, maxXP: 2200, icon: '💠', color: '#00ffff', perks: ['专属头像框'] },
  { level: 7, title: '绿宝石收藏家', minXP: 2200, maxXP: 3000, icon: '💚', color: '#00ff00', perks: ['VIP客服'] },
  { level: 8, title: '下界探险家', minXP: 3000, maxXP: 4000, icon: '🔥', color: '#ff4400', perks: ['稀有成就'] },
  { level: 9, title: '末影龙征服者', minXP: 4000, maxXP: 5500, icon: '🐉', color: '#4a0080', perks: ['传说称号'] },
  { level: 10, title: '我的世界大师', minXP: 5500, maxXP: 99999, icon: '⭐', color: '#ffcc00', perks: ['全功能解锁', '社区传奇称号'] },
];

// 生成每日挑战
const generateDailyChallenges = (): DailyChallenge[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const expiresAt = tomorrow.toISOString();

  const challenges: DailyChallenge[] = [
    {
      id: `daily-${today.toISOString().split('T')[0]}-1`,
      title: '今日打卡',
      description: '完成任意项目打卡',
      icon: '✅',
      color: '#5d8c37',
      type: 'checkin',
      requirement: 1,
      reward: { score: 15, xp: 10 },
      expiresAt
    },
    {
      id: `daily-${today.toISOString().split('T')[0]}-2`,
      title: '双重冲击',
      description: '在两个不同项目打卡',
      icon: '🎯',
      color: '#00aaaa',
      type: 'multi_checkin',
      requirement: 2,
      reward: { score: 30, xp: 20 },
      expiresAt
    },
    {
      id: `daily-${today.toISOString().split('T')[0]}-3`,
      title: '保持连续',
      description: '保持至少3天连续打卡',
      icon: '🔥',
      color: '#ff6600',
      type: 'streak',
      requirement: 3,
      reward: { score: 25, xp: 15 },
      expiresAt
    },
    {
      id: `daily-${today.toISOString().split('T')[0]}-4`,
      title: '绿宝石冲刺',
      description: '今日获得50绿宝石',
      icon: '💰',
      color: '#ffcc00',
      type: 'score',
      requirement: 50,
      reward: { score: 40, xp: 25 },
      expiresAt
    }
  ];

  return challenges;
};

// XP计算函数
const calculateXPForCheckIn = (streak: number): number => {
  let baseXP = 10;
  if (streak >= 7) baseXP += 5;
  if (streak >= 30) baseXP += 10;
  if (streak >= 90) baseXP += 20;
  return baseXP;
};

// 计算用户等级
const calculateUserLevel = (totalXP: number, configs: LevelConfig[]): UserLevel => {
  for (let i = configs.length - 1; i >= 0; i--) {
    if (totalXP >= configs[i].minXP) {
      return {
        level: configs[i].level,
        currentXP: totalXP - configs[i].minXP,
        totalXP,
        title: configs[i].title
      };
    }
  }
  return { level: 1, currentXP: totalXP, totalXP, title: configs[0]?.title || '新手冒险家' };
};

// 检查并解锁成就
const checkAndUnlockAchievements = (
  userId: string,
  user: User,
  instances: CheckInInstance[],
  achievements: Achievement[],
  currentAchievements: UserAchievement[]
): { newAchievements: UserAchievement[], achievementIds: string[] } => {
  const newAchievements: UserAchievement[] = [];
  const achievementIds: string[] = [];
  const today = new Date().toISOString();

  const unlockedIds = new Set(currentAchievements.map(a => a.achievementId));

  achievements.forEach(ach => {
    if (unlockedIds.has(ach.id)) return;

    let currentProgress = 0;
    let isComplete = false;

    switch (ach.type) {
      case 'checkin_count':
        currentProgress = user.checkInHistory.length;
        isComplete = currentProgress >= ach.requirement;
        break;
      case 'streak_days': {
        const maxStreak = instances
          .filter(i => i.userId === userId)
          .reduce((max, i) => Math.max(max, i.currentStreak), 0);
        currentProgress = maxStreak;
        isComplete = currentProgress >= ach.requirement;
        break;
      }
      case 'total_score':
        currentProgress = user.totalScore;
        isComplete = currentProgress >= ach.requirement;
        break;
      case 'project_count': {
        const activeProjects = instances.filter(i => i.userId === userId).length;
        currentProgress = activeProjects;
        isComplete = currentProgress >= ach.requirement;
        break;
      }
      case 'special':
        if (ach.id === 'ach-19') {
          const isDec31 = new Date().getMonth() === 11 && new Date().getDate() === 31;
          currentProgress = isDec31 ? 1 : 0;
          isComplete = currentProgress >= 1;
        }
        break;
    }

    if (isComplete) {
      const newAch: UserAchievement = {
        achievementId: ach.id,
        unlockedAt: today,
        progress: ach.requirement
      };
      newAchievements.push(newAch);
      achievementIds.push(ach.id);
    }
  });

  return { newAchievements, achievementIds };
};

// 默认史蒂夫头像（像素风格）
export const DEFAULT_STEVE_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23c48b5f' x='12' y='8' width='40' height='40'/%3E%3Crect fill='%23c48b5f' x='8' y='12' width='4' height='20'/%3E%3Crect fill='%23c48b5f' x='52' y='12' width='4' height='20'/%3E%3Crect fill='%233d1f0a' x='16' y='14' width='8' height='8'/%3E%3Crect fill='%233d1f0a' x='40' y='14' width='8' height='8'/%3E%3Crect fill='%23ffffff' x='24' y='20' width='4' height='4'/%3E%3Crect fill='%23ffffff' x='36' y='20' width='4' height='4'/%3E%3Crect fill='%235c2d0e' x='20' y='32' width='24' height='16'/%3E%3Crect fill='%2300aaaa' x='16' y='48' width='16' height='16'/%3E%3Crect fill='%2300aaaa' x='40' y='48' width='16' height='16'/%3E%3Crect fill='%233d1f0a' x='4' y='16' width='4' height='8'/%3E%3Crect fill='%233d1f0a' x='56' y='16' width='4' height='8'/%3E%3Crect fill='%2300aaaa' x='4' y='24' width='4' height='24'/%3E%3Crect fill='%2300aaaa' x='56' y='24' width='4' height='24'/%3E%3C/svg%3E`;

export const DEFAULT_ALEX_AVATAR = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23f9d5b8' x='12' y='8' width='40' height='40'/%3E%3Crect fill='%23f9d5b8' x='4' y='12' width='8' height='20'/%3E%3Crect fill='%23f9d5b8' x='52' y='12' width='8' height='20'/%3E%3Crect fill='%23d48b8b' x='16' y='14' width='8' height='8'/%3E%3Crect fill='%23d48b8b' x='40' y='14' width='8' height='8'/%3E%3Crect fill='%23ffffff' x='24' y='20' width='4' height='4'/%3E%3Crect fill='%23ffffff' x='36' y='20' width='4' height='4'/%3E%3Crect fill='%23994d00' x='20' y='32' width='24' height='16'/%3E%3Crect fill='%239b59b6' x='12' y='48' width='16' height='16'/%3E%3Crect fill='%239b59b6' x='44' y='48' width='16' height='16'/%3E%3Crect fill='%239b59b6' x='0' y='24' width='4' height='24'/%3E%3Crect fill='%239b59b6' x='60' y='24' width='4' height='24'/%3E%3Crect fill='%239b59b6' x='4' y='20' width='4' height='4'/%3E%3Crect fill='%239b59b6' x='56' y='20' width='4' height='4'/%3E%3C/svg%3E`;

// 默认草方块图标
export const GRASS_BLOCK_ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%235d8c37' x='8' y='8' width='48' height='48'/%3E%3Crect fill='%2370a845' x='8' y='8' width='48' height='16'/%3E%3Crect fill='%234a3728' x='8' y='48' width='48' height='8'/%3E%3Crect fill='%235d8c37' x='8' y='24' width='8' height='8'/%3E%3Crect fill='%2370a845' x='16' y='24' width='8' height='8'/%3E%3Crect fill='%235d8c37' x='32' y='32' width='8' height='8'/%3E%3C/svg%3E`;

// 默认钻石图标
export const DIAMOND_ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpolygon fill='%2300ffff' points='32,8 56,24 32,56 8,24'/%3E%3Cpolygon fill='%2300cccc' points='32,8 56,24 32,32'/%3E%3Cpolygon fill='%23009999' points='32,32 56,24 32,56'/%3E%3Cpolygon fill='%2300dddd' points='8,24 32,32 32,56'/%3E%3C/svg%3E`;

// 默认金锭图标
export const GOLD_INGOT_ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23ffcc00' x='12' y='20' width='40' height='24' rx='4'/%3E%3Crect fill='%23ffdd44' x='12' y='20' width='40' height='12' rx='4'/%3E%3Crect fill='%23e6b800' x='16' y='28' width='32' height='4'/%3E%3C/svg%3E`;

// 默认书本图标
export const BOOK_ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%238b4513' x='8' y='8' width='48' height='48' rx='4'/%3E%3Crect fill='%23a0522d' x='12' y='12' width='40' height='40' rx='2'/%3E%3Crect fill='%23f4e4c1' x='16' y='16' width='32' height='32'/%3E%3Crect fill='%238b4513' x='20' y='24' width='24' height='4'/%3E%3Crect fill='%238b4513' x='20' y='32' width='24' height='4'/%3E%3Crect fill='%238b4513' x='20' y='40' width='16' height='4'/%3E%3C/svg%3E`;

// 默认初始状态
const getDefaultState = (): AppState => ({
  schemaVersion: APP_SCHEMA_VERSION,
  users: [],
  projects: [
    {
      id: 'default-1',
      name: '每日签到',
      description: '每天登录打卡，保持连续记录',
      rule: 'daily',
      scorePerCheckIn: 10,
      streakTarget: 7,
      streakBonusScore: 50,
      streakBonusReviveCards: 1,
      icon: 'book',
      color: '#8b4513'
    },
    {
      id: 'default-2',
      name: '运动健身',
      description: '每周至少运动3次',
      rule: 'weekly',
      weeklyCount: 3,
      scorePerCheckIn: 20,
      streakTarget: 30,
      streakBonusScore: 200,
      streakBonusReviveCards: 2,
      icon: 'diamond',
      color: '#00aaaa'
    }
  ],
  instances: [],
  shopItems: ensureSystemMaterialItems([
    {
      id: 'shop-1',
      name: '复活卡',
      description: '打卡中断时可延续连续记录',
      cost: 100,
      icon: 'gold',
      color: '#ffcc00',
      stock: 999,
      unlimited: true
    },
    {
      id: 'shop-2',
      name: '游戏时间',
      description: '兑换1小时游戏时间',
      cost: 200,
      icon: 'diamond',
      color: '#00ffff',
      stock: 10,
      unlimited: false
    }
  ]),
  redemptionRecords: [],
  rewardPunishmentRules: [
    {
      id: 'reward-1',
      name: '完成任务',
      description: '按时完成指定任务',
      points: 10,
      type: 'reward',
      icon: 'diamond',
      color: '#00aaaa'
    },
    {
      id: 'punish-1',
      name: '未完成任务',
      description: '未按时完成指定任务',
      points: 20,
      type: 'punishment',
      icon: 'grass',
      color: '#5d8c37'
    }
  ],
  rewardPunishmentRecords: [],
  rewardPunishmentReasons: [
    { name: '完成任务', lastUsed: 0, type: 'reward' },
    { name: '表现优秀', lastUsed: 0, type: 'reward' },
    { name: '迟到早退', lastUsed: 0, type: 'punishment' },
    { name: '未完成任务', lastUsed: 0, type: 'punishment' }
  ],
  reviveCardExchangeRate: 100,
  achievements: DEFAULT_ACHIEVEMENTS,
  userAchievements: {},
  dailyChallenges: generateDailyChallenges(),
  userChallengeProgress: {},
  levelConfigs: DEFAULT_LEVEL_CONFIGS,
  userLevels: {},
  gameState: getDefaultGameState()
});

export function useLocalStorage() {
  const [state, setState] = useState<AppState>(getDefaultState());
  const [isLoaded, setIsLoaded] = useState(false);

  // 数据迁移：重新计算previousStreak
  const migrateData = useCallback((state: AppState): AppState => {
    console.log('执行数据迁移...');
    let hasChanges = false;
    const newInstances = state.instances.map(instance => {
      const user = state.users.find(u => u.id === instance.userId);
      if (!user) return instance;

      // 检查是否需要迁移（previousStreak > 0说明已经迁移过）
      if (instance.previousStreak > 0) {
        console.log(`Instance ${instance.id} 无需迁移，previousStreak=${instance.previousStreak}`);
        return instance;
      }
      if (instance.totalCheckIns === 0) {
        console.log(`Instance ${instance.id} 无打卡记录，跳过`);
        return instance;
      }

      // 获取该项目的所有打卡记录并排序
      const projectCheckIns = user.checkInHistory
        .filter(record => record.projectId === instance.projectId)
        .map(record => record.date)
        .sort();

      if (projectCheckIns.length === 0) {
        console.log(`Instance ${instance.id} 无打卡历史，跳过`);
        return instance;
      }

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const lastCheckIn = projectCheckIns[projectCheckIns.length - 1];

      console.log(`Instance ${instance.id}: today=${today}, yesterday=${yesterdayStr}, lastCheckIn=${lastCheckIn}`);

      // 分析打卡历史，找到最近一次中断
      // 从后往前遍历，找到第一个中断点
      let beforeStreak = 0; // 中断前的连续天数
      let afterStreak = 0;  // 中断后的连续天数
      let foundBreak = false;
      for (let i = projectCheckIns.length - 1; i >= 1; i--) {
        const prevDate = new Date(projectCheckIns[i - 1]);
        const currDate = new Date(projectCheckIns[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          if (!foundBreak) {
            // 还没找到中断，累加中断后的连续天数
            afterStreak++;
          } else {
            // 已经找到中断，但还在继续遍历，累加中断前的连续天数
            beforeStreak++;
          }
        } else {
          // 找到中断点
          if (!foundBreak) {
            // 第一次找到中断点
            foundBreak = true;
            beforeStreak = 1; // 从1开始计数
          } else {
            // 已经有中断点了，又找到新的中断点，停止遍历
            // 此时beforeStreak已经是最近一次中断前的连续天数
            break;
          }
        }
      }

      // 如果只有一段连续（没有找到中断），不需要迁移
      if (!foundBreak) {
        console.log(`Instance ${instance.id} 只有一段连续打卡，跳过`);
        return instance;
      }

      // 如果中断后还在继续打卡（lastCheckIn是今天或昨天），afterStreak要加1
      if (lastCheckIn === today || lastCheckIn === yesterdayStr) {
        afterStreak++;
      }

      console.log(`Instance ${instance.id}: 中断前=${beforeStreak}, 中断后=${afterStreak}`);

      // 如果中断后的连续天数 >= 中断前的连续天数，说明之前的最长连续已经被超越了
      if (afterStreak >= beforeStreak) {
        console.log(`Instance ${instance.id} 中断后连续已经超越中断前连续，不需要恢复`);
        return instance;
      }

      // 保存previousStreak（中断前的连续天数）
      hasChanges = true;
      console.log(`Instance ${instance.id} 迁移成功，设置previousStreak=${beforeStreak}`);
      return {
        ...instance,
        previousStreak: beforeStreak,
        currentStreak: afterStreak,
        lastCheckInDate: lastCheckIn
      };
    });

    if (hasChanges) {
      console.log('数据迁移完成，有变化');
      return { ...state, instances: newInstances };
    }
    console.log('数据迁移完成，无变化');
    return state;
  }, []);

  // 从本地存储加载数据
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!parsed.schemaVersion || parsed.schemaVersion !== APP_SCHEMA_VERSION) {
            const reset = getDefaultState();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
            setState(reset);
            setIsLoaded(true);
            return;
          }
          // 执行数据迁移
          const migrated = migrateData(parsed);
          const merged = { ...getDefaultState(), ...migrated };
          merged.shopItems = ensureSystemMaterialItems(merged.shopItems);
          merged.gameState = normalizeGameState(merged.gameState, merged.users);
          setState(merged);
        } else {
          setState(prev => {
            const next = { ...getDefaultState(), ...prev };
            next.shopItems = ensureSystemMaterialItems(next.shopItems);
            next.gameState = normalizeGameState(next.gameState, next.users);
            return next;
          });
        }
      } catch (error) {
        console.error('Failed to load data from localStorage:', error);
      }
      setIsLoaded(true);
    };
    loadData();
  }, [migrateData]);

  // 保存到本地存储
  const saveState = useCallback((newState: AppState | ((prev: AppState) => AppState)) => {
    setState(prev => {
      const rawUpdated = typeof newState === 'function' ? newState(prev) : newState;
      const updated = {
        ...rawUpdated,
        schemaVersion: APP_SCHEMA_VERSION,
        shopItems: ensureSystemMaterialItems(rawUpdated.shopItems),
        gameState: normalizeGameState(rawUpdated.gameState, rawUpdated.users)
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save data to localStorage:', error);
      }
      return updated;
    });
  }, []);

  // 用户管理
  const addUser = useCallback((name: string, avatar: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      avatar: avatar || DEFAULT_STEVE_AVATAR,
      totalScore: 0,
      todayScore: 0,
      reviveCards: 0,
      streakDays: 0,
      lastCheckInDate: null,
      checkInHistory: [],
      reviveCardHistory: []
    };
    saveState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      userAchievements: {
        ...prev.userAchievements,
        [newUser.id]: []
      },
      userLevels: {
        ...prev.userLevels,
        [newUser.id]: calculateUserLevel(0, prev.levelConfigs)
      },
      userChallengeProgress: {
        ...prev.userChallengeProgress,
        [newUser.id]: []
      },
      gameState: {
        ...prev.gameState,
        inventory: {
          ...prev.gameState.inventory,
          [newUser.id]: {
            plank: 0,
            cobblestone: 0,
            iron_ingot: 0,
            diamond_shard: 0,
            obsidian: 0
          }
        },
        tools: {
          ...prev.gameState.tools,
          [newUser.id]: []
        },
        progress: {
          ...prev.gameState.progress,
          [newUser.id]: getDefaultUserProgress()
        }
      }
    }));
    return newUser.id;
  }, [saveState]);

  const deleteUser = useCallback((userId: string) => {
    saveState(prev => {
      const newUserAchievements = { ...prev.userAchievements };
      delete newUserAchievements[userId];
      const newUserLevels = { ...prev.userLevels };
      delete newUserLevels[userId];
      const newUserChallengeProgress = { ...prev.userChallengeProgress };
      delete newUserChallengeProgress[userId];
      const newInventory = { ...prev.gameState.inventory };
      delete newInventory[userId];
      const newTools = { ...prev.gameState.tools };
      delete newTools[userId];
      const newProgress = { ...prev.gameState.progress };
      delete newProgress[userId];
      return {
        ...prev,
        users: prev.users.filter(u => u.id !== userId),
        instances: prev.instances.filter(i => i.userId !== userId),
        userAchievements: newUserAchievements,
        userLevels: newUserLevels,
        userChallengeProgress: newUserChallengeProgress,
        gameState: {
          ...prev.gameState,
          inventory: newInventory,
          tools: newTools,
          progress: newProgress
        }
      };
    });
  }, [saveState]);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    saveState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u)
    }));
  }, [saveState]);

  // 打卡项目管理
  const addProject = useCallback((project: Omit<CheckInProject, 'id'>) => {
    const newProject: CheckInProject = {
      ...project,
      id: `project-${Date.now()}`
    };
    saveState(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
    return newProject.id;
  }, [saveState]);

  const deleteProject = useCallback((projectId: string) => {
    saveState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== projectId),
      instances: prev.instances.filter(i => i.projectId !== projectId)
    }));
  }, [saveState]);

  const updateProject = useCallback((projectId: string, updates: Partial<CheckInProject>) => {
    saveState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === projectId ? { ...p, ...updates } : p)
    }));
  }, [saveState]);

  const refreshActionPoints = useCallback((progress: UserGameProgress, date: string): UserGameProgress => {
    if (progress.lastApRefreshDate === date) return progress;
    return {
      ...progress,
      actionPoints: Math.min(progress.maxActionPoints, progress.actionPoints + 3),
      lastApRefreshDate: date
    };
  }, []);

  const calculateEmeraldReward = useCallback((baseEmerald: number, streakDays: number, checkInCountToday: number, distinctProjectsToday: number): number => {
    const streakMultiplier = Math.min(1 + Math.max(streakDays - 1, 0) * 0.05, 1.4);
    const multiProjectBonus = distinctProjectsToday >= 3 ? 2 : distinctProjectsToday === 2 ? 1 : 0;
    const dailyDecay = checkInCountToday <= 3 ? 1 : 0.5;
    return Math.max(1, Math.floor((baseEmerald * streakMultiplier + multiProjectBonus) * dailyDecay));
  }, []);

  // 打卡功能（即时奖励仅绿宝石）
  const checkIn = useCallback((userId: string, projectId: string) => {
    const today = getToday();

    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      const project = prev.projects.find(p => p.id === projectId);
      if (!user || !project) return prev;

      const alreadyCheckedIn = user.checkInHistory.some(
        record => record.date === today && record.projectId === projectId
      );
      if (alreadyCheckedIn) return prev;

      const existingInstance = prev.instances.find(
        i => i.userId === userId && i.projectId === projectId
      );
      const instance = existingInstance ?? {
        id: `instance-${Date.now()}`,
        userId,
        projectId,
        currentStreak: 0,
        previousStreak: 0,
        maxStreak: 0,
        totalCheckIns: 0,
        lastCheckInDate: null,
        streakHistory: []
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      let newPreviousStreak = instance.previousStreak;
      if (instance.lastCheckInDate === yesterdayStr) {
        newStreak = instance.currentStreak + 1;
      } else if (instance.lastCheckInDate) {
        newPreviousStreak = instance.currentStreak;
        newStreak = 1;
      }

      const checkInCountTodayBefore = user.checkInHistory.filter(r => r.date === today).length;
      const distinctProjectsToday = new Set([
        ...user.checkInHistory.filter(r => r.date === today).map(r => r.projectId),
        projectId
      ]).size;
      const emeraldEarned = calculateEmeraldReward(
        project.scorePerCheckIn,
        newStreak,
        checkInCountTodayBefore + 1,
        distinctProjectsToday
      );

      const updatedCheckInHistory = [...user.checkInHistory, {
        date: today,
        projectId,
        projectName: project.name,
        score: emeraldEarned
      }];

      const projectCheckIns = updatedCheckInHistory
        .filter(record => record.projectId === projectId)
        .map(record => record.date)
        .sort();

      let maxStreak = instance.maxStreak;
      let tempStreak = 1;
      for (let i = 1; i < projectCheckIns.length; i++) {
        const prevDate = new Date(projectCheckIns[i - 1]);
        const currDate = new Date(projectCheckIns[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / DAY_MS);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
      maxStreak = Math.max(maxStreak, tempStreak);

      let bonusReviveCards = 0;
      if (newStreak >= project.streakTarget && newStreak % project.streakTarget === 0) {
        bonusReviveCards = project.streakBonusReviveCards;
      }

      const xpGained = calculateXPForCheckIn(newStreak);
      const newCheckInRecord: CheckInRecord = {
        date: today,
        projectId,
        projectName: project.name,
        score: emeraldEarned
      };

      const newReviveCardRecords: ReviveCardRecord[] = [];
      if (bonusReviveCards > 0) {
        newReviveCardRecords.push({
          date: today,
          type: 'obtain',
          reason: `连续打卡${newStreak}天奖励`,
          count: bonusReviveCards
        });
      }

      const currentUserAchievements = prev.userAchievements[userId] || [];
      const baseInstances = existingInstance ? prev.instances : [...prev.instances, instance];
      const { newAchievements } = checkAndUnlockAchievements(
        userId,
        { ...user, checkInHistory: updatedCheckInHistory },
        baseInstances,
        prev.achievements,
        currentUserAchievements
      );

      let achievementScoreBonus = 0;
      let achievementReviveCardBonus = 0;
      newAchievements.forEach(na => {
        const ach = prev.achievements.find(a => a.id === na.achievementId);
        if (ach?.reward) {
          achievementScoreBonus += ach.reward.score || 0;
          achievementReviveCardBonus += ach.reward.reviveCard || 0;
        }
      });

      const newTotalXP = (prev.userLevels[userId]?.totalXP || 0) + xpGained;
      const newLevel = calculateUserLevel(newTotalXP, prev.levelConfigs);
      const totalEmeraldGain = emeraldEarned + achievementScoreBonus;

      const userProgress = prev.userChallengeProgress[userId] || [];
      const updatedProgress = userProgress.map(progress => {
        const challenge = prev.dailyChallenges.find(c => c.id === progress.challengeId);
        if (!challenge || progress.completed) return progress;

        let newCurrent = progress.current;
        let completed: boolean = progress.completed;

        switch (challenge.type) {
          case 'checkin':
            if (challenge.requirement === 1) {
              newCurrent = 1;
              completed = true;
            }
            break;
          case 'multi_checkin':
            newCurrent = updatedCheckInHistory.filter(r => r.date === today).length;
            if (newCurrent >= challenge.requirement) completed = true;
            break;
          case 'streak':
            if (newStreak >= challenge.requirement) {
              newCurrent = newStreak;
              completed = true;
            }
            break;
          case 'score':
            newCurrent += totalEmeraldGain;
            if (newCurrent >= challenge.requirement) completed = true;
            break;
        }

        return {
          ...progress,
          current: newCurrent,
          completed,
          completedAt: completed && !progress.completed ? new Date().toISOString() : progress.completedAt
        };
      });

      const normalizedGameState = normalizeGameState(prev.gameState, prev.users);
      const rawUserProgress = normalizedGameState.progress[userId] || getDefaultUserProgress();
      const refreshedProgress = refreshActionPoints(rawUserProgress, today);

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            totalScore: u.totalScore + totalEmeraldGain,
            todayScore: u.todayScore + totalEmeraldGain,
            reviveCards: u.reviveCards + bonusReviveCards + achievementReviveCardBonus,
            streakDays: Math.max(u.streakDays, newStreak),
            lastCheckInDate: today,
            checkInHistory: [...u.checkInHistory, newCheckInRecord],
            reviveCardHistory: [...u.reviveCardHistory, ...newReviveCardRecords]
          };
        }),
        instances: baseInstances.map(i => {
          if (i.id !== instance.id) return i;
          return {
            ...i,
            currentStreak: newStreak,
            previousStreak: newPreviousStreak,
            maxStreak,
            totalCheckIns: i.totalCheckIns + 1,
            lastCheckInDate: today
          };
        }),
        userAchievements: {
          ...prev.userAchievements,
          [userId]: [...(prev.userAchievements[userId] || []), ...newAchievements]
        },
        userLevels: {
          ...prev.userLevels,
          [userId]: newLevel
        },
        userChallengeProgress: {
          ...prev.userChallengeProgress,
          [userId]: updatedProgress
        },
        gameState: {
          ...normalizedGameState,
          progress: {
            ...normalizedGameState.progress,
            [userId]: refreshedProgress
          }
        }
      };
    });
  }, [calculateEmeraldReward, refreshActionPoints, saveState]);

  // 使用复活卡
  const useReviveCard = useCallback((userId: string, projectId: string) => {
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      if (!user || user.reviveCards <= 0) return prev;

      const instance = prev.instances.find(
        i => i.userId === userId && i.projectId === projectId
      );
      if (!instance) return prev;

      const today = new Date().toISOString().split('T')[0];

      // 计算昨天的日期
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // 计算新的连续天数
      // 如果有previousStreak > 0，恢复 previousStreak + currentStreak
      // 否则从currentStreak继续 + 1
      let newStreak = 1;
      let newPreviousStreak = instance.previousStreak;

      if (instance.previousStreak > 0) {
        // 之前有连续打卡记录被中断过，恢复 previousStreak + currentStreak
        newStreak = instance.previousStreak + instance.currentStreak;
        newPreviousStreak = 0; // 恢复后清除previousStreak
      } else if (instance.lastCheckInDate === yesterdayStr) {
        // 昨天打卡了，今天使用复活卡，连续天数+1
        newStreak = instance.currentStreak + 1;
      } else if (instance.lastCheckInDate) {
        // 打卡已经中断有一段时间了，延续当前的连续天数
        newStreak = instance.currentStreak + 1;
      } else {
        // 从未打卡过，使用复活卡开始新的连续打卡
        newStreak = 1;
      }

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            reviveCards: u.reviveCards - 1,
            reviveCardHistory: [
              ...u.reviveCardHistory,
              {
                date: today,
                type: 'use',
                reason: `延续打卡记录`,
                count: 1
              }
            ]
          };
        }),
        instances: prev.instances.map(i => {
          if (i.id !== instance.id) return i;
          return {
            ...i,
            currentStreak: newStreak,
            previousStreak: newPreviousStreak,
            lastCheckInDate: today
          };
        })
      };
    });
  }, [saveState]);

  // 补打卡功能
  const checkInWithDate = useCallback((userId: string, projectId: string, date: string) => {
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      const project = prev.projects.find(p => p.id === projectId);
      const instance = prev.instances.find(i => i.userId === userId && i.projectId === projectId);
      
      if (!user || !project || !instance) return prev;
      
      // 检查是否已经在该日期打卡过
      const alreadyCheckedIn = user.checkInHistory.some(
        record => record.date === date && record.projectId === projectId
      );
      if (alreadyCheckedIn) return prev;

      const checkInRecord: CheckInRecord = {
        projectId,
        projectName: project.name,
        date,
        score: project.scorePerCheckIn
      };

      // 计算连续打卡天数
      const updatedCheckInHistory = [...user.checkInHistory, checkInRecord];
      const projectCheckIns = updatedCheckInHistory
        .filter(record => record.projectId === projectId)
        .map(record => record.date)
        .sort();

      let maxStreak = instance.maxStreak;
      let tempStreak = 1;

      for (let i = 1; i < projectCheckIns.length; i++) {
        const prevDate = new Date(projectCheckIns[i - 1]);
        const currDate = new Date(projectCheckIns[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }

      maxStreak = Math.max(maxStreak, tempStreak);

      // 计算当前连续打卡天数
      let currentStreak = 0;
      let previousStreak = instance.previousStreak;
      if (projectCheckIns.length > 0) {
        currentStreak = 1;
        for (let i = projectCheckIns.length - 1; i >= 0; i--) {
          if (i === 0) break;
          const prevDate = new Date(projectCheckIns[i - 1]);
          const currDate = new Date(projectCheckIns[i]);
          const diffTime = currDate.getTime() - prevDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            currentStreak++;
          } else {
            // 打卡中断，保存当前连续天数到previousStreak
            if (currentStreak > previousStreak) {
              previousStreak = currentStreak;
            }
            currentStreak = 1;
          }
        }

        // 检查最后一次打卡是否是今天或昨天
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastCheckIn = projectCheckIns[projectCheckIns.length - 1];

        if (lastCheckIn !== today && lastCheckIn !== yesterdayStr) {
          // 打卡已中断，保存当前连续天数到previousStreak
          if (currentStreak > previousStreak) {
            previousStreak = currentStreak;
          }
          currentStreak = 0;
        }
      }

      // 补打卡只发基础绿宝石，不享受连击加成
      const totalScore = project.scorePerCheckIn;

      // 检查最后一次打卡是否是今天或补打卡的日期
      const today = new Date().toISOString().split('T')[0];

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            totalScore: u.totalScore + totalScore,
            todayScore: date === today ? u.todayScore + project.scorePerCheckIn : u.todayScore,
            streakDays: Math.max(u.streakDays, currentStreak),
            checkInHistory: updatedCheckInHistory,
            reviveCardHistory: u.reviveCardHistory
          };
        }),
        instances: prev.instances.map(i => {
          if (i.id !== instance.id) return i;
          return {
            ...i,
            currentStreak,
            previousStreak,
            maxStreak,
            totalCheckIns: instance.totalCheckIns + 1,
            lastCheckInDate: date
          };
        })
      };
    });
  }, [saveState]);

  // 绿宝石兑换复活卡
  const exchangeReviveCard = useCallback((userId: string, count: number = 1) => {
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      if (!user) return prev;

      const cost = prev.reviveCardExchangeRate * count;
      if (user.totalScore < cost) return prev;

      const today = new Date().toISOString().split('T')[0];

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            totalScore: u.totalScore - cost,
            reviveCards: u.reviveCards + count,
            reviveCardHistory: [
              ...u.reviveCardHistory,
              {
                date: today,
                type: 'obtain',
                reason: `使用${cost}绿宝石兑换`,
                count
              }
            ]
          };
        })
      };
    });
  }, [saveState]);

  // 商城功能
  const addShopItem = useCallback((item: Omit<ShopItem, 'id'>) => {
    const newItem: ShopItem = {
      ...item,
      id: `shop-${Date.now()}`
    };
    saveState(prev => ({
      ...prev,
      shopItems: [...prev.shopItems, newItem]
    }));
    return newItem.id;
  }, [saveState]);

  const deleteShopItem = useCallback((itemId: string) => {
    saveState(prev => ({
      ...prev,
      shopItems: prev.shopItems.filter(i => i.id !== itemId)
    }));
  }, [saveState]);

  const redeemItem = useCallback((userId: string, itemId: string, quantity: number = 1) => {
    if (quantity <= 0) return;
    
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      const item = prev.shopItems.find(i => i.id === itemId);
      if (!user || !item) return prev;
      
      const totalCost = item.cost * quantity;
      const totalStockNeeded = quantity;
      
      if (user.totalScore < totalCost) return prev;
      if (!item.unlimited && item.stock < totalStockNeeded) return prev;

      const normalizedGameState = normalizeGameState(prev.gameState, prev.users);
      const materialId = item.materialId;
      const currentWeek = normalizedGameState.season.currentWeek;

      if (item.isSystemMaterial && materialId) {
        const weeklyLimit = item.weeklyLimit ?? MATERIAL_CONFIG[materialId]?.weeklyLimit;
        if (weeklyLimit) {
          const purchasedThisWeek = prev.redemptionRecords
            .filter(r => r.userId === userId && r.materialId === materialId && r.weekNumber === currentWeek)
            .reduce((sum, r) => sum + (r.quantity || 1), 0);
          if (purchasedThisWeek + quantity > weeklyLimit) return prev;
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const redemptionRecord: RedemptionRecord = {
        id: `redemption-${Date.now()}`,
        userId,
        userName: user.name,
        itemId,
        itemName: item.name,
        cost: totalCost,
        date: today,
        quantity,
        materialId: materialId || undefined,
        weekNumber: materialId ? currentWeek : undefined
      };

      let updatedGameState = normalizedGameState;
      if (item.isSystemMaterial && materialId) {
        const userInventory = normalizedGameState.inventory[userId] || {
          plank: 0,
          cobblestone: 0,
          iron_ingot: 0,
          diamond_shard: 0,
          obsidian: 0
        };
        updatedGameState = {
          ...normalizedGameState,
          inventory: {
            ...normalizedGameState.inventory,
            [userId]: {
              ...userInventory,
              [materialId]: (userInventory[materialId] || 0) + quantity
            }
          }
        };
      }

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            totalScore: u.totalScore - totalCost
          };
        }),
        shopItems: prev.shopItems.map(i => {
          if (i.id !== itemId || i.unlimited) return i;
          return {
            ...i,
            stock: i.stock - totalStockNeeded
          };
        }),
        redemptionRecords: [...prev.redemptionRecords, redemptionRecord],
        gameState: updatedGameState
      };
    });
  }, [saveState]);

  // 奖惩规则
  const addRewardPunishmentRule = useCallback((rule: Omit<RewardPunishmentRule, 'id'>) => {
    const newRule: RewardPunishmentRule = {
      ...rule,
      id: `${rule.type === 'reward' ? 'reward' : 'punish'}-${Date.now()}`
    };
    saveState(prev => ({
      ...prev,
      rewardPunishmentRules: [...prev.rewardPunishmentRules, newRule]
    }));
    return newRule.id;
  }, [saveState]);

  const deleteRewardPunishmentRule = useCallback((ruleId: string) => {
    saveState(prev => ({
      ...prev,
      rewardPunishmentRules: prev.rewardPunishmentRules.filter(r => r.id !== ruleId)
    }));
  }, [saveState]);

  const applyRewardPunishment = useCallback((userId: string, reason: string, type: 'reward' | 'punishment', points: number, remark: string = '') => {
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      if (!user) return prev;

      const today = new Date().toISOString().split('T')[0];
      const rewardPunishmentRecord: RewardPunishmentRecord = {
        id: `${type === 'reward' ? 'reward' : 'punish'}-${Date.now()}`,
        userId,
        userName: user.name,
        ruleId: reason,
        ruleName: reason,
        points: points,
        type: type,
        date: today,
        reason: remark || reason
      };

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          const scoreChange = type === 'reward' ? points : -points;
          return {
            ...u,
            totalScore: u.totalScore + scoreChange
          };
        }),
        rewardPunishmentRecords: [...prev.rewardPunishmentRecords, rewardPunishmentRecord]
      };
    });
  }, [saveState]);

  // 删除奖惩记录并恢复绿宝石
  const deleteRewardPunishmentRecord = useCallback((recordId: string) => {
    saveState(prev => {
      const record = prev.rewardPunishmentRecords.find(r => r.id === recordId);
      if (!record) return prev;

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== record.userId) return u;
          const scoreChange = record.type === 'reward' ? -record.points : record.points;
          return {
            ...u,
            totalScore: u.totalScore + scoreChange
          };
        }),
        rewardPunishmentRecords: prev.rewardPunishmentRecords.filter(r => r.id !== recordId)
      };
    });
  }, [saveState]);

  // 奖惩事由管理
  const addRewardPunishmentReason = useCallback((reason: { name: string; type: 'reward' | 'punishment' }) => {
    saveState(prev => {
      if (prev.rewardPunishmentReasons.some(r => r.name === reason.name && r.type === reason.type)) {
        return prev;
      }
      return {
        ...prev,
        rewardPunishmentReasons: [...prev.rewardPunishmentReasons, { ...reason, lastUsed: 0 }]
      };
    });
  }, [saveState]);

  const deleteRewardPunishmentReason = useCallback((reasonName: string, type: 'reward' | 'punishment') => {
    saveState(prev => ({
      ...prev,
      rewardPunishmentReasons: prev.rewardPunishmentReasons.filter(r => !(r.name === reasonName && r.type === type))
    }));
  }, [saveState]);

  const updateRewardPunishmentReasonLastUsed = useCallback((reasonName: string) => {
    saveState(prev => ({
      ...prev,
      rewardPunishmentReasons: prev.rewardPunishmentReasons.map(r => 
        r.name === reasonName ? { ...r, lastUsed: Date.now() } : r
      )
    }));
  }, [saveState]);

  // 重置今日绿宝石（每天调用一次）
  const resetDailyScores = useCallback(() => {
    saveState(prev => ({
      ...prev,
      users: prev.users.map(u => ({
        ...u,
        todayScore: 0
      }))
    }));
  }, [saveState]);

  // 导入数据
  const importState = useCallback((newState: AppState) => {
    // 重新计算每个用户每个项目的连续打卡数
    const updatedState = { ...newState };
    updatedState.shopItems = ensureSystemMaterialItems(updatedState.shopItems || []);
    updatedState.gameState = normalizeGameState(updatedState.gameState, updatedState.users);
    
    updatedState.instances = updatedState.instances.map(instance => {
      const user = updatedState.users.find(u => u.id === instance.userId);
      if (!user) return instance;
      
      // 获取该用户该项目的所有打卡记录
      const projectCheckIns = user.checkInHistory
        .filter(record => record.projectId === instance.projectId)
        .map(record => record.date)
        .sort();
      
      if (projectCheckIns.length === 0) return instance;
      
      // 计算连续打卡天数
      let maxStreak = 0;
      let currentStreak = 0;
      let tempStreak = 1;
      
      for (let i = 1; i < projectCheckIns.length; i++) {
        const prevDate = new Date(projectCheckIns[i - 1]);
        const currDate = new Date(projectCheckIns[i]);
        const diffTime = currDate.getTime() - prevDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          maxStreak = Math.max(maxStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      maxStreak = Math.max(maxStreak, tempStreak);
      
      // 计算当前连续打卡天数
      if (projectCheckIns.length > 0) {
        currentStreak = 1;
        for (let i = projectCheckIns.length - 1; i > 0; i--) {
          const prevDate = new Date(projectCheckIns[i - 1]);
          const currDate = new Date(projectCheckIns[i]);
          const diffTime = currDate.getTime() - prevDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
        
        // 检查最后一次打卡是否是今天或昨天
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const lastCheckIn = projectCheckIns[projectCheckIns.length - 1];
        
        if (lastCheckIn !== today && lastCheckIn !== yesterdayStr) {
          currentStreak = 0;
        }
      }
      
      return {
        ...instance,
        currentStreak,
        maxStreak
      };
    });
    
    saveState(() => updatedState);
  }, [saveState]);

  // 删除打卡记录并回滚绿宝石
  const deleteCheckInRecord = useCallback((userId: string, recordIndex: number) => {
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      if (!user || !user.checkInHistory[recordIndex]) return prev;

      const record = user.checkInHistory[recordIndex];
      const newHistory = [...user.checkInHistory];
      newHistory.splice(recordIndex, 1);

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            totalScore: Math.max(0, u.totalScore - record.score),
            todayScore: Math.max(0, u.todayScore - record.score),
            checkInHistory: newHistory
          };
        })
      };
    });
  }, [saveState]);

  // 获取备份列表
  const getBackupList = useCallback((): BackupRecord[] => {
    try {
      const saved = localStorage.getItem(BACKUP_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // 创建备份
  const createBackup = useCallback((name?: string) => {
    const backupList = getBackupList();
    const now = new Date();
    const backup: BackupRecord = {
      id: `backup-${Date.now()}`,
      date: now.toISOString(),
      name: name || `备份 ${now.toLocaleDateString('zh-CN')} ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
      dataSize: JSON.stringify(state).length,
      data: JSON.parse(JSON.stringify(state))
    };
    
    const newBackupList = [backup, ...backupList].slice(0, MAX_BACKUPS);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(newBackupList));
    
    return backup.id;
  }, [state, getBackupList]);

  // 恢复备份
  const restoreBackup = useCallback((backupId: string) => {
    const backupList = getBackupList();
    const backup = backupList.find(b => b.id === backupId);
    if (backup) {
      saveState(() => backup.data);
      return true;
    }
    return false;
  }, [getBackupList, saveState]);

  // 删除备份
  const deleteBackup = useCallback((backupId: string) => {
    const backupList = getBackupList();
    const newBackupList = backupList.filter(b => b.id !== backupId);
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(newBackupList));
  }, [getBackupList]);

  // 自动创建每日备份
  useEffect(() => {
    if (!isLoaded) return;
    
    const lastAutoBackup = localStorage.getItem('last-auto-backup');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastAutoBackup !== today) {
      createBackup('自动每日备份');
      localStorage.setItem('last-auto-backup', today);
    }
  }, [isLoaded, createBackup]);

  // 手动计算连续打卡奖励
  const calculateStreakRewards = useCallback((userId: string) => {
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      if (!user) return prev;
      
      let totalBonusScore = 0;
      let totalBonusReviveCards = 0;
      const newReviveCardRecords: ReviveCardRecord[] = [];
      
      // 按项目分组打卡记录
      const projectCheckInsMap = user.checkInHistory.reduce((acc, record) => {
        if (!acc[record.projectId]) {
          acc[record.projectId] = [];
        }
        acc[record.projectId].push(record.date);
        return acc;
      }, {} as Record<string, string[]>);
      
      // 处理每个项目的连续打卡
      Object.entries(projectCheckInsMap).forEach(([projectId, dates]) => {
        const project = prev.projects.find(p => p.id === projectId);
        if (!project) return;
        
        const sortedDates = dates.sort();
        let currentStreak = 1;
        let lastDate = new Date(sortedDates[0]);
        
        // 遍历所有打卡记录，计算连续打卡
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i]);
          const diffTime = currentDate.getTime() - lastDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            currentStreak++;
          } else {
            currentStreak = 1;
          }
          
          lastDate = currentDate;
          
          // 检查是否达成连续目标
          if (currentStreak >= project.streakTarget && currentStreak % project.streakTarget === 0) {
            // 检查是否已经发放过该奖励
            const alreadyRewarded = user.reviveCardHistory.some(record => 
              record.reason === `连续打卡${currentStreak}天奖励` && 
              record.date === sortedDates[i]
            );
            
            if (!alreadyRewarded) {
              totalBonusScore += project.streakBonusScore;
              totalBonusReviveCards += project.streakBonusReviveCards;
              newReviveCardRecords.push({
                date: sortedDates[i],
                type: 'obtain',
                reason: `连续打卡${currentStreak}天奖励`,
                count: project.streakBonusReviveCards
              });
            }
          }
        }
      });
      
      // 更新用户数据
      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            totalScore: u.totalScore + totalBonusScore,
            reviveCards: u.reviveCards + totalBonusReviveCards,
            reviveCardHistory: [...u.reviveCardHistory, ...newReviveCardRecords]
          };
        })
      };
    });
  }, [saveState]);
  const saveCheckpoint = useCallback((userId: string, levelId: string, checkpointId: string): void => {
    saveState(prev => {
      const normalizedGameState = normalizeGameState(prev.gameState, prev.users);
      const playerProgress = normalizedGameState.campaign.progress[userId];
      if (!playerProgress) return prev;

      const activeRun = normalizedGameState.campaign.activeRuns[userId];
      if (!activeRun || activeRun.levelId !== levelId) return prev;

      const nextRun: CampaignRunState = {
        ...activeRun,
        checkpoints: activeRun.checkpoints.includes(checkpointId)
          ? activeRun.checkpoints
          : [...activeRun.checkpoints, checkpointId]
      };

      return {
        ...prev,
        gameState: {
          ...normalizedGameState,
          campaign: {
            ...normalizedGameState.campaign,
            progress: {
              ...normalizedGameState.campaign.progress,
              [userId]: {
                ...playerProgress,
                currentLevelId: levelId,
                checkpointId
              }
            },
            activeRuns: {
              ...normalizedGameState.campaign.activeRuns,
              [userId]: nextRun
            }
          }
        }
      };
    });
  }, [saveState]);

  const startLevel = useCallback((userId: string, levelId: string): StartLevelResult => {
    let response: StartLevelResult = { ok: false, message: '无法开始关卡' };
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      if (!user) {
        response = { ok: false, message: '用户不存在' };
        return prev;
      }

      const normalizedGameState = normalizeGameState(prev.gameState, prev.users);
      const level = normalizedGameState.campaign.levels.find(l => l.id === levelId);
      if (!level) {
        response = { ok: false, message: '关卡不存在' };
        return prev;
      }

      const playerProgress = normalizedGameState.campaign.progress[userId] || createDefaultCampaignPlayerProgress();
      if (!playerProgress.unlockedLevelIds.includes(levelId)) {
        response = { ok: false, message: '关卡尚未解锁' };
        return prev;
      }

      const run: CampaignRunState = {
        levelId,
        startedAt: new Date().toISOString(),
        deathCount: 0,
        hitCount: 0,
        checkpoints: []
      };
      response = { ok: true, message: '关卡开始', run };

      return {
        ...prev,
        gameState: {
          ...normalizedGameState,
          campaign: {
            ...normalizedGameState.campaign,
            progress: {
              ...normalizedGameState.campaign.progress,
              [userId]: {
                ...playerProgress,
                currentLevelId: levelId,
                checkpointId: null
              }
            },
            activeRuns: {
              ...normalizedGameState.campaign.activeRuns,
              [userId]: run
            }
          }
        }
      };
    });
    return response;
  }, [saveState]);

  const finishLevel = useCallback((userId: string, levelId: string, stats: FinishLevelStats): FinishLevelResult => {
    let response: FinishLevelResult = {
      ok: false,
      message: '结算失败',
      stars: 0,
      firstClear: false,
      rewardScore: 0,
      rewardXp: 0
    };

    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      if (!user) {
        response = { ...response, message: '用户不存在' };
        return prev;
      }

      const normalizedGameState = normalizeGameState(prev.gameState, prev.users);
      const level = normalizedGameState.campaign.levels.find(l => l.id === levelId);
      if (!level) {
        response = { ...response, message: '关卡不存在' };
        return prev;
      }

      const playerProgress = normalizedGameState.campaign.progress[userId] || createDefaultCampaignPlayerProgress();
      const activeRun = normalizedGameState.campaign.activeRuns[userId];
      if (activeRun && activeRun.levelId !== levelId) {
        response = { ...response, message: '当前关卡状态异常，请重试' };
        return prev;
      }

      const currentResult = playerProgress.levelResults[levelId] || createEmptyCampaignResult();
      const firstClear = !playerProgress.completedLevelIds.includes(levelId);
      const stars = stats.clearTimeMs <= level.parTimeMs ? 3 : stats.clearTimeMs <= level.parTimeMs * 1.35 ? 2 : 1;
      const rewardScore = firstClear ? CAMPAIGN_FIRST_CLEAR_REWARD_SCORE : CAMPAIGN_REPEAT_CLEAR_REWARD_SCORE;
      const rewardXp = firstClear ? CAMPAIGN_FIRST_CLEAR_REWARD_XP : 0;

      const nextLevel = normalizedGameState.campaign.levels.find(l => l.index === level.index + 1);
      const unlockedLevelIds = [...playerProgress.unlockedLevelIds];
      if (nextLevel && !unlockedLevelIds.includes(nextLevel.id)) unlockedLevelIds.push(nextLevel.id);

      const completedLevelIds = playerProgress.completedLevelIds.includes(levelId)
        ? playerProgress.completedLevelIds
        : [...playerProgress.completedLevelIds, levelId];

      const nextLevelResult: CampaignLevelResult = {
        stars: Math.max(currentResult.stars, stars),
        bestTimeMs: currentResult.bestTimeMs === null ? stats.clearTimeMs : Math.min(currentResult.bestTimeMs, stats.clearTimeMs),
        clearCount: currentResult.clearCount + 1,
        firstClearAt: firstClear ? new Date().toISOString() : currentResult.firstClearAt,
        firstClearRewardClaimed: currentResult.firstClearRewardClaimed || firstClear,
        checkpoints: Array.from(new Set([...(currentResult.checkpoints || []), ...(stats.checkpoints || [])]))
      };

      const nextTotalXp = (prev.userLevels[userId]?.totalXP || 0) + rewardXp;
      const nextLevelData = calculateUserLevel(nextTotalXp, prev.levelConfigs);

      response = {
        ok: true,
        message: firstClear ? `首通成功！奖励 +${rewardScore} 绿宝石` : `通关成功！奖励 +${rewardScore} 绿宝石`,
        stars,
        firstClear,
        rewardScore,
        rewardXp
      };

      return {
        ...prev,
        users: prev.users.map(u => (u.id === userId ? { ...u, totalScore: u.totalScore + rewardScore } : u)),
        userLevels: {
          ...prev.userLevels,
          [userId]: nextLevelData
        },
        gameState: {
          ...normalizedGameState,
          campaign: {
            ...normalizedGameState.campaign,
            progress: {
              ...normalizedGameState.campaign.progress,
              [userId]: {
                ...playerProgress,
                unlockedLevelIds,
                completedLevelIds,
                currentLevelId: null,
                checkpointId: null,
                tutorialCompleted: playerProgress.tutorialCompleted || level.index === 1,
                levelResults: {
                  ...playerProgress.levelResults,
                  [levelId]: nextLevelResult
                }
              }
            },
            activeRuns: {
              ...normalizedGameState.campaign.activeRuns,
              [userId]: null
            }
          }
        }
      };
    });

    return response;
  }, [saveState]);

  const failLevel = useCallback((userId: string, levelId: string, reason: string): FailLevelResult => {
    let response: FailLevelResult = { ok: false, message: reason || '挑战失败' };
    saveState(prev => {
      const normalizedGameState = normalizeGameState(prev.gameState, prev.users);
      const playerProgress = normalizedGameState.campaign.progress[userId];
      if (!playerProgress) {
        response = { ok: false, message: '用户不存在' };
        return prev;
      }

      const activeRun = normalizedGameState.campaign.activeRuns[userId];
      if (!activeRun || activeRun.levelId !== levelId) {
        response = { ok: false, message: reason || '关卡运行状态不存在' };
        return prev;
      }

      response = { ok: true, message: reason || '挑战失败，请重试' };
      return {
        ...prev,
        gameState: {
          ...normalizedGameState,
          campaign: {
            ...normalizedGameState.campaign,
            progress: {
              ...normalizedGameState.campaign.progress,
              [userId]: {
                ...playerProgress,
                currentLevelId: null
              }
            },
            activeRuns: {
              ...normalizedGameState.campaign.activeRuns,
              [userId]: null
            }
          }
        }
      };
    });
    return response;
  }, [saveState]);

  return {
    state,
    isLoaded,
    addUser,
    deleteUser,
    updateUser,
    addProject,
    deleteProject,
    updateProject,
    checkIn,
    useReviveCard,
    exchangeReviveCard,
    addShopItem,
    deleteShopItem,
    redeemItem,
    addRewardPunishmentRule,
    deleteRewardPunishmentRule,
    applyRewardPunishment,
    deleteRewardPunishmentRecord,
    resetDailyScores,
    importState,
    setReviveCardExchangeRate: (rate: number) => {
      saveState(prev => ({
        ...prev,
        reviveCardExchangeRate: rate
      }));
    },
    getBackupList,
    createBackup,
    restoreBackup,
    deleteBackup,
    deleteCheckInRecord,
    checkInWithDate,
    addRewardPunishmentReason,
    deleteRewardPunishmentReason,
    updateRewardPunishmentReasonLastUsed,
    calculateStreakRewards,
    startLevel,
    finishLevel,
    failLevel,
    saveCheckpoint
  };
}



