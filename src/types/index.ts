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
}

// 惩罚规则类型
export interface PunishmentRule {
  id: string;
  name: string;
  description: string;
  deduction: number;
  icon: string;
  color: string;
}

// 惩罚记录
export interface PunishmentRecord {
  id: string;
  userId: string;
  userName: string;
  ruleId: string;
  ruleName: string;
  deduction: number;
  date: string;
  reason: string;
}

// 应用状态
export interface AppState {
  users: User[];
  projects: CheckInProject[];
  instances: CheckInInstance[];
  shopItems: ShopItem[];
  redemptionRecords: RedemptionRecord[];
  punishmentRules: PunishmentRule[];
  punishmentRecords: PunishmentRecord[];
  reviveCardExchangeRate: number;
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
