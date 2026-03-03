import { useState, useMemo } from 'react';
import type { User, CheckInRecord } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award, TrendingUp, Calendar, Star, User as UserIcon, Folder } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LeaderboardProps {
  users: User[];
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

export function Leaderboard({ users }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState('today');

  const sortedByToday = useMemo(() => {
    return [...users].sort((a, b) => b.todayScore - a.todayScore);
  }, [users]);

  const sortedByTotal = useMemo(() => {
    return [...users].sort((a, b) => b.totalScore - a.totalScore);
  }, [users]);

  const projectStats = useMemo(() => {
    const stats: UserProjectStat[] = users.map(user => {
      const projectMap = new Map<string, { name: string; count: number }>();
      
      user.checkInHistory.forEach((record: CheckInRecord) => {
        const existing = projectMap.get(record.projectId);
        if (existing) {
          existing.count++;
        } else {
          projectMap.set(record.projectId, { name: record.projectName, count: 1 });
        }
      });
      
      const projects: ProjectStat[] = Array.from(projectMap.entries()).map(([_, value]) => ({
        projectName: value.name,
        count: value.count
      })).sort((a, b) => b.count - a.count);
      
      return {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        totalCount: user.checkInHistory.length,
        projects
      };
    }).sort((a, b) => b.totalCount - a.totalCount);
    
    return stats;
  }, [users]);

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
                      总积分: {user.totalScore}
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
                    {scoreKey === 'todayScore' ? '今日积分' : '总积分'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderProjectLeaderboard = (stats: UserProjectStat[]) => {
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
                        className="text-xs font-pixel px-2 py-0.5 rounded bg-minecraft-diamond/20 text-minecraft-diamond flex items-center gap-1"
                      >
                        <Folder className="w-3 h-3" />
                        {project.projectName} x{project.count}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 总打卡次数 */}
                <div className="text-right shrink-0">
                  <div className="text-2xl font-pixel text-minecraft-diamond">
                    {stat.totalCount}
                  </div>
                  <div className="text-xs font-pixel text-minecraft-stone">
                    总打卡次数
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
            className="font-pixel data-[state=active]:bg-minecraft-diamond data-[state=active]:text-white"
          >
            <Folder className="w-4 h-4 mr-2" />
            打卡榜
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4">
          <Card className="minecraft-card border-4 border-minecraft-grass">
            <CardContent className="p-4">
              <h3 className="text-lg font-pixel text-minecraft-grass mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                今日积分榜
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
                总积分排行榜
              </h3>
              {renderLeaderboard(sortedByTotal, 'totalScore')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project" className="mt-4">
          <Card className="minecraft-card border-4 border-minecraft-diamond">
            <CardContent className="p-4">
              <h3 className="text-lg font-pixel text-minecraft-diamond mb-4 flex items-center gap-2">
                <Folder className="w-5 h-5" />
                打卡统计榜
              </h3>
              {renderProjectLeaderboard(projectStats)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
