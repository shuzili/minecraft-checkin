import { useState, useEffect, useCallback } from 'react';
import type { AppState, User, CheckInProject, ShopItem, RedemptionRecord, PunishmentRule, PunishmentRecord, CheckInRecord, ReviveCardRecord, BackupRecord } from '@/types';

const STORAGE_KEY = 'minecraft-checkin-app';
const BACKUP_STORAGE_KEY = 'minecraft-checkin-backups';
const MAX_BACKUPS = 10;

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
  shopItems: [
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
  ],
  redemptionRecords: [],
  punishmentRules: [
    {
      id: 'punish-1',
      name: '未完成任务',
      description: '未按时完成指定任务',
      deduction: 20,
      icon: 'grass',
      color: '#5d8c37'
    },
    {
      id: 'punish-2',
      name: '迟到早退',
      description: '迟到或早退',
      deduction: 10,
      icon: 'book',
      color: '#8b4513'
    }
  ],
  punishmentRecords: [],
  reviveCardExchangeRate: 100 // 100积分兑换1张复活卡
});

export function useLocalStorage() {
  const [state, setState] = useState<AppState>(getDefaultState());
  const [isLoaded, setIsLoaded] = useState(false);

  // 从本地存储加载数据
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setState({ ...getDefaultState(), ...parsed });
        }
      } catch (error) {
        console.error('Failed to load data from localStorage:', error);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // 保存到本地存储
  const saveState = useCallback((newState: AppState | ((prev: AppState) => AppState)) => {
    setState(prev => {
      const updated = typeof newState === 'function' ? newState(prev) : newState;
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
      users: [...prev.users, newUser]
    }));
    return newUser.id;
  }, [saveState]);

  const deleteUser = useCallback((userId: string) => {
    saveState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId),
      instances: prev.instances.filter(i => i.userId !== userId)
    }));
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

  // 打卡功能
  const checkIn = useCallback((userId: string, projectId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      const project = prev.projects.find(p => p.id === projectId);
      if (!user || !project) return prev;

      // 检查今天是否已经打卡
      const alreadyCheckedIn = user.checkInHistory.some(
        record => record.date === today && record.projectId === projectId
      );
      if (alreadyCheckedIn) return prev;

      // 获取或创建实例
      let instance = prev.instances.find(
        i => i.userId === userId && i.projectId === projectId
      );
      
      if (!instance) {
        instance = {
          id: `instance-${Date.now()}`,
          userId,
          projectId,
          currentStreak: 0,
          maxStreak: 0,
          totalCheckIns: 0,
          lastCheckInDate: null,
          streakHistory: []
        };
        prev.instances.push(instance);
      }

      // 计算连续打卡
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      if (instance.lastCheckInDate === yesterdayStr) {
        newStreak = instance.currentStreak + 1;
      }

      // 检查是否达成连续目标
      let bonusScore = 0;
      let bonusReviveCards = 0;
      if (newStreak >= project.streakTarget && newStreak % project.streakTarget === 0) {
        bonusScore = project.streakBonusScore;
        bonusReviveCards = project.streakBonusReviveCards;
      }

      const totalScore = project.scorePerCheckIn + bonusScore;

      // 更新实例
      instance.currentStreak = newStreak;
      instance.maxStreak = Math.max(instance.maxStreak, newStreak);
      instance.totalCheckIns++;
      instance.lastCheckInDate = today;

      // 更新用户
      const newCheckInRecord: CheckInRecord = {
        date: today,
        projectId,
        projectName: project.name,
        score: totalScore
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

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            totalScore: u.totalScore + totalScore,
            todayScore: u.todayScore + totalScore,
            reviveCards: u.reviveCards + bonusReviveCards,
            streakDays: Math.max(u.streakDays, newStreak),
            lastCheckInDate: today,
            checkInHistory: [...u.checkInHistory, newCheckInRecord],
            reviveCardHistory: [...u.reviveCardHistory, ...newReviveCardRecords]
          };
        }),
        instances: prev.instances.map(i => 
          i.id === instance!.id ? instance! : i
        )
      };
    });
  }, [saveState]);

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
                reason: `延续${instance.projectId}的连续打卡记录`,
                count: 1
              }
            ]
          };
        }),
        instances: prev.instances.map(i => {
          if (i.id !== instance.id) return i;
          return {
            ...i,
            currentStreak: i.currentStreak + 1,
            lastCheckInDate: today
          };
        })
      };
    });
  }, [saveState]);

  // 积分兑换复活卡
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
                reason: `使用${cost}积分兑换`,
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

      const today = new Date().toISOString().split('T')[0];
      const redemptionRecord: RedemptionRecord = {
        id: `redemption-${Date.now()}`,
        userId,
        userName: user.name,
        itemId,
        itemName: item.name,
        cost: totalCost,
        date: today
      };

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
        redemptionRecords: [...prev.redemptionRecords, redemptionRecord]
      };
    });
  }, [saveState]);

  // 惩罚规则
  const addPunishmentRule = useCallback((rule: Omit<PunishmentRule, 'id'>) => {
    const newRule: PunishmentRule = {
      ...rule,
      id: `punish-${Date.now()}`
    };
    saveState(prev => ({
      ...prev,
      punishmentRules: [...prev.punishmentRules, newRule]
    }));
    return newRule.id;
  }, [saveState]);

  const deletePunishmentRule = useCallback((ruleId: string) => {
    saveState(prev => ({
      ...prev,
      punishmentRules: prev.punishmentRules.filter(r => r.id !== ruleId)
    }));
  }, [saveState]);

  const applyPunishment = useCallback((userId: string, ruleId: string, reason: string) => {
    saveState(prev => {
      const user = prev.users.find(u => u.id === userId);
      const rule = prev.punishmentRules.find(r => r.id === ruleId);
      if (!user || !rule) return prev;

      const today = new Date().toISOString().split('T')[0];
      const punishmentRecord: PunishmentRecord = {
        id: `punishment-${Date.now()}`,
        userId,
        userName: user.name,
        ruleId,
        ruleName: rule.name,
        deduction: rule.deduction,
        date: today,
        reason
      };

      return {
        ...prev,
        users: prev.users.map(u => {
          if (u.id !== userId) return u;
          return {
            ...u,
            totalScore: Math.max(0, u.totalScore - rule.deduction)
          };
        }),
        punishmentRecords: [...prev.punishmentRecords, punishmentRecord]
      };
    });
  }, [saveState]);

  // 重置今日积分（每天调用一次）
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
    saveState(() => newState);
  }, [saveState]);

  // 删除打卡记录并回滚积分
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
    addPunishmentRule,
    deletePunishmentRule,
    applyPunishment,
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
    deleteCheckInRecord
  };
}
