import { useState, useMemo } from 'react';
import type { User, CheckInInstance, CheckInProject } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award, Calendar, Star, Flame } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaderboardProps {
  users: User[];
  instances: CheckInInstance[];
  projects: CheckInProject[];
}

interface ProjectStat {
  projectName: string;
  count: number;
}

interface UserProjectStat {
  userId: string;
  userName: string;
  userAvatar: string;
  totalCount: number;
  projects: ProjectStat[];
}

export function Leaderboard({ users, instances, projects }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState('today');

  const sortedByToday = useMemo(() => {
    return [...users].sort((a, b) => b.todayScore - a.todayScore);
  }, [users]);

  const sortedByTotal = useMemo(() => {
    return [...users].sort((a, b) => b.totalScore - a.totalScore);
  }, [users]);

  const streakStats = useMemo(() => {
    const stats: UserProjectStat[] = users.map(user => {
      const userInstances = instances.filter(instance => instance.userId === user.id);
      
      const userProjects: ProjectStat[] = userInstances.map(instance => {
        const project = projects.find(p => p.id === instance.projectId);
        return {
          projectName: project?.name || instance.projectId,
          count: instance.currentStreak
        };
      }).sort((a, b) => b.count - a.count);
      
      return {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        totalCount: 0,
        projects: userProjects
      };
    }).sort((a, b) => {
      // 按第一个项目的连续天数排序
      const aFirstProjectCount = a.projects.length > 0 ? a.projects[0].count : 0;
      const bFirstProjectCount = b.projects.length > 0 ? b.projects[0].count : 0;
      return bFirstProjectCount - aFirstProjectCount;
    });
    
    return stats;
  }, [users, instances, projects]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-pixel text-minecraft-stone">{rank + 1}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 0:
        return 'border-yellow-400 bg-yellow-400/10';
      case 1:
        return 'border-gray-400 bg-gray-400/10';
      case 2:
        return 'border-amber-600 bg-amber-600/10';
      default:
        return 'border-minecraft-stone/30';
    }
  };

  const renderLeaderboard = (sortedUsers: User[], scoreKey: 'todayScore' | 'totalScore') => {
    if (sortedUsers.length === 0) {
      return (
        <div className="text-center py-8 text-minecraft-stone font-pixel">
          暂无数据
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sortedUsers.map((user, index) => (
          <Card 
            key={user.id} 
            className={`minecraft-card border-2 ${getRankStyle(index)} transition-all hover:scale-[1.02]`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* 排名 */}
                <div className="shrink-0">
                  {getRankIcon(index)}
                </div>

                {/* 头像 */}
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-lg border-2 border-minecraft-stone"
                />

                {/* 用户信息 */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-pixel text-lg truncate">{user.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-pixel text-minecraft-gold">
                      总绿宝石: {user.totalScore}
                    </span>
                    <span className="text-xs font-pixel text-minecraft-diamond">
                      复活卡: {user.reviveCards}
                    </span>
                  </div>
                </div>

                {/* 分数 */}
                <div className="text-right shrink-0">
                  <div className={`text-2xl font-pixel ${
                    scoreKey === 'todayScore' ? 'text-minecraft-grass' : 'text-minecraft-gold'
                  }`}>
                    {user[scoreKey]}
                  </div>
                  <div className="text-xs font-pixel text-minecraft-stone">
                    {scoreKey === 'todayScore' ? '今日绿宝石' : '总绿宝石'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderStreakLeaderboard = (stats: UserProjectStat[]) => {
    if (stats.length === 0) {
      return (
        <div className="text-center py-8 text-minecraft-stone font-pixel">
          暂无数据
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <Card 
            key={stat.userId} 
            className={`minecraft-card border-2 ${getRankStyle(index)} transition-all hover:scale-[1.02]`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* 排名 */}
                <div className="shrink-0">
                  {getRankIcon(index)}
                </div>

                {/* 头像 */}
                <img
                  src={stat.userAvatar}
                  alt={stat.userName}
                  className="w-12 h-12 rounded-lg border-2 border-minecraft-stone"
                />

                {/* 用户信息 */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-pixel text-lg truncate">{stat.userName}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {stat.projects.slice(0, 3).map((project, idx) => (
                      <span 
                        key={idx}
                        className="text-xs font-pixel px-2 py-0.5 rounded bg-minecraft-lava/20 text-minecraft-lava flex items-center gap-1"
                      >
                        <Flame className="w-3 h-3" />
                        {project.projectName} {project.count}天
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-pixel text-minecraft-gold flex items-center gap-2">
        <Trophy className="w-6 h-6" />
        排行榜
      </h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 minecraft-panel border-2 border-minecraft-stone p-1">
          <TabsTrigger 
            value="today" 
            className="font-pixel data-[state=active]:bg-minecraft-grass data-[state=active]:text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            今日榜
          </TabsTrigger>
          <TabsTrigger 
            value="total"
            className="font-pixel data-[state=active]:bg-minecraft-gold data-[state=active]:text-white"
          >
            <Star className="w-4 h-4 mr-2" />
            总榜
          </TabsTrigger>
          <TabsTrigger 
            value="project"
            className="font-pixel data-[state=active]:bg-minecraft-lava data-[state=active]:text-white"
          >
            <Flame className="w-4 h-4 mr-2" />
            连续打卡
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card className="minecraft-card border-4 border-minecraft-grass">
            <CardContent className="p-4">
              <h3 className="text-lg font-pixel text-minecraft-grass mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                今日绿宝石榜
              </h3>
              {renderLeaderboard(sortedByToday, 'todayScore')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="total" className="mt-4">
          <Card className="minecraft-card border-4 border-minecraft-gold">
            <CardContent className="p-4">
              <h3 className="text-lg font-pixel text-minecraft-gold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                总绿宝石排行榜
              </h3>
              {renderLeaderboard(sortedByTotal, 'totalScore')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project" className="mt-4">
          <Card className="minecraft-card border-4 border-minecraft-lava">
            <CardContent className="p-4">
              <h3 className="text-lg font-pixel text-minecraft-lava mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5" />
                连续打卡榜
              </h3>
              {renderStreakLeaderboard(streakStats)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
