import { useEffect, useMemo, useState } from 'react';
import type { DailyChallenge, UserChallengeProgress, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, Gift, Sparkles, Target, Zap } from 'lucide-react';

interface DailyChallengesProps {
  challenges: DailyChallenge[];
  userChallengeProgress: Record<string, UserChallengeProgress[]>;
  users: User[];
}

export function DailyChallenges({ challenges, userChallengeProgress, users }: DailyChallengesProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);
  const completedCount = useMemo(() => {
    return users.reduce((count, user) => {
      const progress = userChallengeProgress[user.id] ?? [];
      return count + progress.filter((item) => item.completed).length;
    }, 0);
  }, [userChallengeProgress, users]);

  const totalPossible = challenges.length * users.length;
  const nowTime = now.getTime();

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - nowTime;
    if (diff <= 0) return '已过期';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const getChallengeProgress = (userId: string, challengeId: string) => {
    const progress = userChallengeProgress[userId] ?? [];
    return progress.find((item) => item.challengeId === challengeId);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-pixel text-minecraft-emerald flex items-center gap-2">
        <Gift className="w-6 h-6" />
        每日挑战
      </h2>

      <Card className="minecraft-card border-4 border-minecraft-emerald">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-minecraft-emerald/20 border-4 border-minecraft-emerald flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-minecraft-emerald" />
              </div>
              <div>
                <div className="text-2xl font-pixel text-minecraft-emerald">
                  {completedCount} / {totalPossible}
                </div>
                <div className="text-sm font-pixel text-minecraft-stone">今日已完成挑战</div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-minecraft-stone">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-pixel">剩余时间: {getTimeRemaining(challenges[0]?.expiresAt ?? '')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((challenge) => {
          const isExpired = new Date(challenge.expiresAt).getTime() < nowTime;

          return (
            <Card
              key={challenge.id}
              className={`minecraft-card border-2 transition-all ${isExpired ? 'border-minecraft-stone/50 opacity-60' : 'border-2'}`}
              style={{ borderColor: isExpired ? undefined : `${challenge.color}80` }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${challenge.color}20` }}
                  >
                    {isExpired ? <Clock className="w-6 h-6 text-minecraft-stone" /> : challenge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-pixel text-lg" style={{ color: challenge.color }}>
                        {challenge.title}
                      </h4>
                      {isExpired ? (
                        <Badge variant="destructive" className="font-pixel text-xs">
                          已过期
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-minecraft-stone mt-1">{challenge.description}</p>

                    <div className="flex gap-3 mt-2">
                      {challenge.reward.score > 0 ? (
                        <span className="text-xs font-pixel text-minecraft-gold flex items-center gap-1">
                          <Zap className="w-3 h-3" />+{challenge.reward.score}分
                        </span>
                      ) : null}
                      {challenge.reward.xp && challenge.reward.xp > 0 ? (
                        <span className="text-xs font-pixel text-minecraft-emerald flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />+{challenge.reward.xp}XP
                        </span>
                      ) : null}
                      {challenge.reward.reviveCard && challenge.reward.reviveCard > 0 ? (
                        <span className="text-xs font-pixel text-minecraft-diamond flex items-center gap-1">
                          <Circle className="w-3 h-3" />+{challenge.reward.reviveCard}复活卡
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-2">
                      {users.map((user) => {
                        const progress = getChallengeProgress(user.id, challenge.id);
                        const isCompleted = progress?.completed ?? false;
                        const current = progress?.current ?? 0;
                        const progressPercent = Math.min((current / challenge.requirement) * 100, 100);

                        return (
                          <div key={user.id} className="flex items-center gap-2">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-6 h-6 rounded border border-minecraft-stone"
                            />
                            <span className="text-xs font-pixel text-minecraft-stone w-16 truncate">{user.name}</span>
                            <div className="flex-1 h-2 bg-minecraft-stone/30 rounded-full overflow-hidden">
                              <div
                                className="h-full transition-all duration-300"
                                style={{
                                  width: `${progressPercent}%`,
                                  backgroundColor: isCompleted ? '#00ff00' : challenge.color,
                                }}
                              />
                            </div>
                            <span className="text-xs font-pixel w-16 text-right">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-minecraft-emerald inline" />
                              ) : (
                                <span style={{ color: challenge.color }}>
                                  {current}/{challenge.requirement}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="minecraft-card border-2 border-minecraft-stone/30">
        <CardContent className="p-4">
          <h4 className="font-pixel text-minecraft-stone mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />挑战说明
          </h4>
          <ul className="text-sm font-pixel text-minecraft-stone space-y-1">
            <li>• 每日挑战在次日零点更新。</li>
            <li>• 完成挑战可获得绿宝石、经验和复活卡奖励。</li>
            <li>• 进度会根据打卡实时更新。</li>
            <li>• 多个挑战可并行完成。</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


