import { useMemo, useState } from 'react';
import type { Achievement, UserAchievement, UserLevel, LevelConfig } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Lock, Trophy } from 'lucide-react';

interface AchievementSystemProps {
  achievements: Achievement[];
  userAchievements: Record<string, UserAchievement[]>;
  userLevels: Record<string, UserLevel>;
  levelConfigs: LevelConfig[];
  users: { id: string; name: string }[];
}

const categoryNames: Record<Achievement['category'], string> = {
  checkin: '打卡',
  streak: '连续',
  social: '社交',
  special: '特殊',
  milestone: '里程碑',
  project_count: '项目',
};

export function AchievementSystem({
  achievements,
  userAchievements,
  userLevels,
  levelConfigs,
  users,
}: AchievementSystemProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id ?? '');

  const activeUserId = users.some((user) => user.id === selectedUserId)
    ? selectedUserId
    : (users[0]?.id ?? '');

  const currentUserAchievements = useMemo(
    () => userAchievements[activeUserId] ?? [],
    [activeUserId, userAchievements]
  );

  const unlockedIds = useMemo(
    () => new Set(currentUserAchievements.map((a) => a.achievementId)),
    [currentUserAchievements]
  );

  const achievementsByCategory = useMemo(() => {
    const grouped: Record<string, Achievement[]> = {};
    achievements.forEach((achievement) => {
      if (!grouped[achievement.category]) {
        grouped[achievement.category] = [];
      }
      grouped[achievement.category].push(achievement);
    });
    return grouped;
  }, [achievements]);

  const currentUserLevel = userLevels[activeUserId];
  const currentLevelConfig = levelConfigs.find((config) => config.level === currentUserLevel?.level);
  const nextLevelConfig = levelConfigs.find((config) => config.level === (currentUserLevel?.level ?? 1) + 1);

  const xpProgress = useMemo(() => {
    if (!currentUserLevel || !currentLevelConfig) return 0;
    const levelRange = currentLevelConfig.maxXP - currentLevelConfig.minXP;
    if (levelRange <= 0) return 0;
    return Math.min(100, (currentUserLevel.currentXP / levelRange) * 100);
  }, [currentLevelConfig, currentUserLevel]);

  const getAchievementProgress = (achievementId: string) => {
    const item = currentUserAchievements.find((a) => a.achievementId === achievementId);
    return item?.progress ?? 0;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-pixel text-minecraft-gold flex items-center gap-2">
        <Trophy className="w-6 h-6" />
        成就系统
      </h2>

      <Card className="minecraft-card border-4 border-minecraft-gold">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-lg bg-minecraft-wood border-4 border-minecraft-gold flex items-center justify-center text-3xl">
                  {currentLevelConfig?.icon ?? '⭐'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xl font-pixel"
                      style={{ color: currentLevelConfig?.color ?? '#ffcc00' }}
                    >
                      {currentUserLevel?.title ?? '新手冒险家'}
                    </span>
                    <Badge className="bg-minecraft-gold text-black font-pixel">
                      Lv.{currentUserLevel?.level ?? 1}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs font-pixel text-minecraft-stone mb-1">
                      <span>经验值</span>
                      <span>
                        {currentUserLevel?.currentXP ?? 0} / {currentLevelConfig?.maxXP ?? 100}
                      </span>
                    </div>
                    <div className="h-3 bg-minecraft-stone/30 rounded-full overflow-hidden border-2 border-minecraft-stone">
                      <div
                        className="h-full bg-gradient-to-r from-minecraft-gold to-minecraft-emerald transition-all duration-500"
                        style={{ width: `${xpProgress}%` }}
                      />
                    </div>
                  </div>
                  {nextLevelConfig ? (
                    <p className="text-xs font-pixel text-minecraft-stone mt-1">
                      距离 {nextLevelConfig.title} 还需 {Math.max(0, nextLevelConfig.minXP - (currentUserLevel?.totalXP ?? 0))} XP
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="w-full md:w-48">
              <label className="block text-sm font-pixel text-minecraft-stone mb-1">查看用户</label>
              <select
                value={activeUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="minecraft-input w-full"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="minecraft-card border-4 border-minecraft-diamond">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-pixel text-minecraft-gold">{unlockedIds.size}</div>
              <div className="text-sm font-pixel text-minecraft-stone">已解锁</div>
            </div>
            <div>
              <div className="text-3xl font-pixel text-minecraft-stone">
                {Math.max(0, achievements.length - unlockedIds.size)}
              </div>
              <div className="text-sm font-pixel text-minecraft-stone">未解锁</div>
            </div>
            <div>
              <div className="text-3xl font-pixel text-minecraft-emerald">{currentUserLevel?.totalXP ?? 0}</div>
              <div className="text-sm font-pixel text-minecraft-stone">总经验</div>
            </div>
            <div>
              <div className="text-3xl font-pixel text-minecraft-diamond">{currentUserLevel?.level ?? 1}</div>
              <div className="text-sm font-pixel text-minecraft-stone">当前等级</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-3 md:grid-cols-6 minecraft-panel border-2 border-minecraft-stone p-1">
          <TabsTrigger value="all" className="font-pixel text-xs data-[state=active]:bg-minecraft-grass">
            全部
          </TabsTrigger>
          {Object.entries(categoryNames).map(([key, name]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="font-pixel text-xs data-[state=active]:bg-minecraft-diamond data-[state=active]:text-white"
            >
              {name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={unlockedIds.has(achievement.id)}
                progress={getAchievementProgress(achievement.id)}
              />
            ))}
          </div>
        </TabsContent>

        {Object.entries(achievementsByCategory).map(([category, items]) => (
          <TabsContent key={category} value={category} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={unlockedIds.has(achievement.id)}
                  progress={getAchievementProgress(achievement.id)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AchievementCard({
  achievement,
  isUnlocked,
  progress,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
  progress: number;
}) {
  const progressPercent = Math.min((progress / achievement.requirement) * 100, 100);

  return (
    <Card
      className={`minecraft-card transition-all ${
        isUnlocked ? 'border-4 border-minecraft-gold' : 'border-2 border-minecraft-stone/50 opacity-75'
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
              isUnlocked ? 'bg-minecraft-gold/20' : 'bg-minecraft-stone/20'
            }`}
            style={{ borderColor: isUnlocked ? achievement.color : '#7a7a7a' }}
          >
            {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-minecraft-stone" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-pixel truncate ${isUnlocked ? 'text-minecraft-gold' : 'text-minecraft-stone'}`}>
                {achievement.secret && !isUnlocked ? '???' : achievement.name}
              </h4>
              {achievement.secret && !isUnlocked ? (
                <Badge variant="outline" className="text-xs">
                  保密
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-minecraft-stone mt-1 line-clamp-2">
              {achievement.secret && !isUnlocked ? '解锁后可见' : achievement.description}
            </p>
            {!isUnlocked && progress > 0 ? (
              <div className="mt-2">
                <div className="flex justify-between text-xs font-pixel text-minecraft-stone mb-1">
                  <span>进度</span>
                  <span>
                    {progress} / {achievement.requirement}
                  </span>
                </div>
                <div className="h-2 bg-minecraft-stone/30 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%`, backgroundColor: achievement.color }}
                  />
                </div>
              </div>
            ) : null}
            {isUnlocked && achievement.reward ? (
              <div className="flex gap-2 mt-2">
                {achievement.reward.score ? (
                  <span className="text-xs font-pixel text-minecraft-gold">+{achievement.reward.score}分</span>
                ) : null}
                {achievement.reward.reviveCard ? (
                  <span className="text-xs font-pixel text-minecraft-diamond">+{achievement.reward.reviveCard}复活卡</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
