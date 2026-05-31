import { useEffect, useMemo, useState } from 'react';
import type { User, CheckInInstance, CheckInProject } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, History, RefreshCw, Zap } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReviveCardSystemProps {
  users: User[];
  instances: CheckInInstance[];
  projects: CheckInProject[];
  onUseReviveCard: (userId: string, projectId: string) => void;
}

export function ReviveCardSystem({ users, instances, projects, onUseReviveCard }: ReviveCardSystemProps) {
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [showHistory, setShowHistory] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { play } = useSound();
  const nowTime = now.getTime();
  const today = now.toISOString().split('T')[0];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const allHistory = useMemo(() => {
    const merged = users.flatMap((user) =>
      user.reviveCardHistory.map((record) => ({
        user: user.name,
        date: record.date,
        type: record.type === 'obtain' ? '获得' : '使用',
        reason: record.reason,
        count: record.count,
      }))
    );

    return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [users]);

  const interruptedInstances = useMemo(() => {
    return instances.filter((instance) => {
      const user = users.find((u) => u.id === instance.userId);
      if (!user || user.reviveCards <= 0) return false;
      if (!instance.lastCheckInDate) return false;
      if (instance.currentStreak === 0 && instance.previousStreak === 0) return false;
      if (instance.lastCheckInDate === today) return false;

      const daysSinceLastCheckIn = Math.floor(
        (nowTime - new Date(instance.lastCheckInDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysSinceLastCheckIn > 0;
    });
  }, [instances, nowTime, today, users]);

  const filteredInstances = useMemo(() => {
    if (selectedUser === 'all') return interruptedInstances;
    return interruptedInstances.filter((instance) => instance.userId === selectedUser);
  }, [interruptedInstances, selectedUser]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-pixel text-minecraft-diamond flex items-center gap-2">
          <Heart className="w-6 h-6" />复活卡系统
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowHistory(true);
            play('click');
          }}
          className="minecraft-btn border-minecraft-stone"
        >
          <History className="w-4 h-4 mr-2" />历史记录
        </Button>
      </div>

      <Card className="minecraft-card border-4 border-minecraft-red">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xl font-pixel text-minecraft-red flex items-center gap-2">
            <Zap className="w-6 h-6" />可复活打卡记录
          </h3>

          <div>
            <label className="block text-sm font-pixel mb-2 text-minecraft-stone">筛选用户（可选）</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="minecraft-input font-pixel">
                <SelectValue placeholder="选择用户" />
              </SelectTrigger>
              <SelectContent className="minecraft-panel">
                <SelectItem value="all" className="font-pixel">
                  所有用户
                </SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id} className="font-pixel">
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredInstances.length === 0 ? (
              <div className="text-center py-8 text-minecraft-stone font-pixel">暂无需要复活的打卡记录</div>
            ) : (
              filteredInstances.map((instance) => {
                const user = users.find((u) => u.id === instance.userId);
                const project = projects.find((p) => p.id === instance.projectId);
                const lastDate = instance.lastCheckInDate ?? '-';
                const daysSinceLastCheckIn = instance.lastCheckInDate
                  ? Math.floor(
                      (nowTime - new Date(instance.lastCheckInDate).getTime()) / (1000 * 60 * 60 * 24)
                    )
                  : 0;

                return (
                  <div
                    key={`${instance.userId}-${instance.projectId}`}
                    className="p-3 border-2 border-minecraft-stone/30 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="font-pixel text-sm">{user?.name}</div>
                      <div className="text-xs text-minecraft-stone">项目: {project?.name ?? instance.projectId}</div>
                      <div className="text-xs text-minecraft-stone">最后打卡: {lastDate}</div>
                      <div className="text-xs text-minecraft-stone">中断天数: {daysSinceLastCheckIn}天</div>
                      <div className="text-xs text-minecraft-stone">当前连续: {instance.currentStreak}天</div>
                      {instance.previousStreak > 0 ? (
                        <div className="text-xs text-minecraft-lava">可恢复: {instance.previousStreak}天</div>
                      ) : null}
                    </div>
                    <Button
                      onClick={() => {
                        onUseReviveCard(instance.userId, instance.projectId);
                        play('success');
                      }}
                      disabled={!user || user.reviveCards <= 0}
                      className="minecraft-btn bg-minecraft-red hover:bg-minecraft-red/90 disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />复活
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {users.map((user) => (
          <Card key={user.id} className="minecraft-card border-2 border-minecraft-stone">
            <CardContent className="p-3 text-center">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 mx-auto rounded-lg border border-minecraft-stone mb-2"
              />
              <div className="font-pixel text-sm truncate">{user.name}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Heart className="w-4 h-4 text-minecraft-diamond" />
                <span className="font-pixel text-minecraft-diamond">{user.reviveCards}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-wood max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-gold flex items-center gap-2">
              <History className="w-6 h-6" />复活卡历史记录
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-2 mt-4">
            {allHistory.length === 0 ? (
              <div className="text-center py-8 text-minecraft-stone font-pixel">暂无历史记录</div>
            ) : (
              allHistory.map((record, index) => (
                <div
                  key={`${record.user}-${record.date}-${index}`}
                  className="p-3 border-2 border-minecraft-stone/30 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-pixel text-sm">{record.user}</div>
                    <div className="text-xs text-minecraft-stone">{record.date}</div>
                    <div className="text-xs text-minecraft-stone/70">{record.reason}</div>
                  </div>
                  <div className={`font-pixel ${record.type === '获得' ? 'text-minecraft-diamond' : 'text-minecraft-lava'}`}>
                    {record.type === '获得' ? '+' : '-'}
                    {record.count}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

