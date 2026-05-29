// 用户类型
export interface User {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  todayScore: number;
  reviveCards: number;
  streakDays: number;
  lastCheckInDate: string | null;
  checkInHistory: CheckInRecord[];
  reviveCardHistory: ReviveCardRecord[];
}

// 打卡记录
export interface CheckInRecord {
  date: string;
  projectId: string;
  projectName: string;
  score: number;
}

// 复活卡使用记录
export interface ReviveCardRecord {
  date: string;
  type: 'obtain' | 'use';
  reason: string;
  count: number;
}

// 打卡项目类型
export interface CheckInProject {
  id: string;
  name: string;
  description: string;
  rule: 'daily' | 'weekly' | 'custom';
  weeklyCount?: number;
  customDays?: number[];
  scorePerCheckIn: number;
  streakTarget: number;
  streakBonusScore: number;
  streakBonusReviveCards: number;
  icon: string;
  color: string;
}

// 打卡实例（用户与项目的关联）
export interface CheckInInstance {
  id: string;
  userId: string;
  projectId: string;
  currentStreak: number;
  previousStreak: number; // 中断前的连续天数
  maxStreak: number;
  totalCheckIns: number;
  lastCheckInDate: string | null;
  streakHistory: StreakRecord[];
}

// 连续打卡记录
export interface StreakRecord {
  startDate: string;
  endDate: string;
  days: number;
  completed: boolean;
}

// 商城商品类型
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  color: string;
  stock: number;
  unlimited: boolean;
  isSystemMaterial?: boolean;
  materialId?: MaterialId;
  weeklyLimit?: number;
}

// 兑换记录
export interface RedemptionRecord {
  id: string;
  userId: string;
  userName: string;
  itemId: string;
  itemName: string;
  cost: number;
  date: string;
  quantity?: number;
  materialId?: MaterialId;
  weekNumber?: number;
}

export type MaterialId = 'plank' | 'cobblestone' | 'iron_ingot' | 'diamond_shard' | 'obsidian';
export type PickaxeTier = 'wood' | 'stone' | 'iron' | 'diamond';

export interface ToolRecipe {
  tier: PickaxeTier;
  maxDurability: number;
  costs: Partial<Record<MaterialId, number>>;
}

export interface ToolInstance {
  id: string;
  tier: PickaxeTier;
  durability: number;
  maxDurability: number;
  craftedAt: string;
  usedCount: number;
}

export interface BedLayer {
  material: string;
  blockCount: number;
  requiredPickaxeTier: PickaxeTier;
  durabilityPerBlock: number;
}

export interface LevelCondition {
  minCheckInsLast7?: number;
  minDistinctProjectsLast14?: number;
}

export interface LevelDefinition {
  id: string;
  chapterId: 'overworld' | 'cave' | 'nether' | 'end';
  chapterName: string;
  name: string;
  weekUnlock: number;
  isBoss: boolean;
  rewardWeeklyBadge: boolean;
  isFinal?: boolean;
  layers: BedLayer[];
  condition?: LevelCondition;
}

export interface SeasonState {
  seasonId: string;
  startDate: string;
  currentWeek: number;
}

export interface UserGameProgress {
  actionPoints: number;
  maxActionPoints: number;
  lastApRefreshDate: string | null;
  clearedLevelIds: string[];
  weeklyBadges: number[];
  usedDiamondPickaxe: boolean;
  finalCleared: boolean;
}

export type CampaignBiome = 'grassland' | 'cave' | 'redstone' | 'rail' | 'nether' | 'end';

export interface CampaignLevelDefinition {
  id: string;
  index: number;
  name: string;
  biome: CampaignBiome;
  description: string;
  objective: string;
  parTimeMs: number;
}

export interface CampaignLevelResult {
  stars: number;
  bestTimeMs: number | null;
  clearCount: number;
  firstClearAt: string | null;
  firstClearRewardClaimed: boolean;
  checkpoints: string[];
}

export interface CampaignPlayerProgress {
  unlockedLevelIds: string[];
  completedLevelIds: string[];
  currentLevelId: string | null;
  checkpointId: string | null;
  maxHearts: number;
  tutorialCompleted: boolean;
  levelResults: Record<string, CampaignLevelResult>;
}

export interface CampaignRunState {
  levelId: string;
  startedAt: string;
  deathCount: number;
  hitCount: number;
  checkpoints: string[];
}

export interface CampaignGameState {
  version: number;
  levels: CampaignLevelDefinition[];
  progress: Record<string, CampaignPlayerProgress>;
  activeRuns: Record<string, CampaignRunState | null>;
}

export interface GameState {
  campaign: CampaignGameState;
  season: SeasonState;
  inventory: Record<string, Record<MaterialId, number>>;
  tools: Record<string, ToolInstance[]>;
  levels: LevelDefinition[];
  progress: Record<string, UserGameProgress>;
}

// 奖惩规则类型
export interface RewardPunishmentRule {
  id: string;
  name: string;
  description: string;
  points: number;
  type: 'reward' | 'punishment';
  icon: string;
  color: string;
}

// 奖惩记录
export interface RewardPunishmentRecord {
  id: string;
  userId: string;
  userName: string;
  ruleId: string;
  ruleName: string;
  points: number;
  type: 'reward' | 'punishment';
  date: string;
  reason: string;
}

// 应用状态
export interface AppState {
  schemaVersion?: number;
  users: User[];
  projects: CheckInProject[];
  instances: CheckInInstance[];
  shopItems: ShopItem[];
  redemptionRecords: RedemptionRecord[];
  rewardPunishmentRules: RewardPunishmentRule[];
  rewardPunishmentRecords: RewardPunishmentRecord[];
  reviveCardExchangeRate: number;
  rewardPunishmentReasons: {
    name: string;
    lastUsed: number;
    type: 'reward' | 'punishment';
  }[];
  // 游戏化系统
  achievements: Achievement[];
  userAchievements: Record<string, UserAchievement[]>;  // key: userId
  dailyChallenges: DailyChallenge[];
  userChallengeProgress: Record<string, UserChallengeProgress[]>;  // key: userId
  levelConfigs: LevelConfig[];
  userLevels: Record<string, UserLevel>;  // key: userId
  gameState: GameState;
}

// 音效类型
export type SoundType = 
  | 'click' 
  | 'checkIn' 
  | 'success' 
  | 'error' 
  | 'levelUp' 
  | 'coin' 
  | 'pop' 
  | 'revive';

// 备份记录类型
export interface BackupRecord {
  id: string;
  date: string;
  name: string;
  dataSize: number;
  data: AppState;
}

// 成就/徽章类型
export type AchievementCategory = 
  | 'checkin'      // 打卡相关
  | 'streak'       // 连续打卡相关
  | 'social'       // 社交互动相关
  | 'special'      // 特殊成就
  | 'milestone'    // 里程碑
  | 'project_count'; // 项目相关

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: AchievementCategory;
  requirement: number;
  type: 'checkin_count' | 'streak_days' | 'total_score' | 'project_count' | 'special';
  reward?: {
    score?: number;
    reviveCard?: number;
  };
  secret?: boolean;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
  progress: number;
}

// 等级/XP系统
export interface LevelConfig {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  icon: string;
  color: string;
  perks: string[];
}

export interface UserLevel {
  level: number;
  currentXP: number;
  totalXP: number;
  title: string;
}

// 每日挑战/任务系统
export type ChallengeType = 
  | 'checkin'           // 打卡挑战
  | 'streak'            // 连续挑战
  | 'score'             // 积分挑战
  | 'multi_checkin';    // 多项目打卡

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: ChallengeType;
  requirement: number;
  targetProjectId?: string;  // 可选，指定项目
  reward: {
    score: number;
    xp?: number;
    reviveCard?: number;
  };
  expiresAt: string;  // 过期时间
}

export interface UserChallengeProgress {
  challengeId: string;
  current: number;
  completed: boolean;
  completedAt?: string;
}

// 排行榜展示样式
export type LeaderboardStyle = 'trophy' | 'pixel' | 'block';

export interface StartLevelResult {
  ok: boolean;
  message: string;
  run?: CampaignRunState;
}

export interface FinishLevelStats {
  clearTimeMs: number;
  remainingHearts: number;
  deaths: number;
  hits: number;
  checkpoints: string[];
}

export interface FinishLevelResult {
  ok: boolean;
  message: string;
  stars: number;
  firstClear: boolean;
  rewardScore: number;
  rewardXp: number;
}

export interface FailLevelResult {
  ok: boolean;
  message: string;
}
