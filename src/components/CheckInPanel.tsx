import { useState, useMemo } from 'react';
import type { User, CheckInProject, CheckInInstance } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Flame, RotateCcw, Trophy } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useConfetti } from '@/hooks/useConfetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CheckInPanelProps {
  users: User[];
  projects: CheckInProject[];
  instances: CheckInInstance[];
  onCheckIn: (userId: string, projectId: string) => void;
  onUseReviveCard: (userId: string, projectId: string) => void;
}

export function CheckInPanel({ 
  users, 
  projects, 
  instances, 
  onCheckIn, 
  onUseReviveCard 
}: CheckInPanelProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showStreakDialog, setShowStreakDialog] = useState(false);
  const [streakInfo, setStreakInfo] = useState<{ days: number; bonus: number; cards: number } | null>(null);
  const { play } = useSound();
  const { checkInSuccess, streakBonus } = useConfetti();

  const today = new Date().toISOString().split('T')[0];

  const currentUser = useMemo(() => 
    users.find(u => u.id === selectedUser),
    [users, selectedUser]
  );

  const currentProject = useMemo(() => 
    projects.find(p => p.id === selectedProject),
    [projects, selectedProject]
  );

  const currentInstance = useMemo(() => 
    instances.find(i => i.userId === selectedUser && i.projectId === selectedProject),
    [instances, selectedUser, selectedProject]
  );

  const hasCheckedInToday = useMemo(() => {
    if (!currentUser || !currentProject) return false;
    return currentUser.checkInHistory.some(
      record => record.date === today && record.projectId === currentProject.id
    );
  }, [currentUser, currentProject, today]);

  const canUseReviveCard = useMemo(() => {
    if (!currentUser || !currentInstance) return false;
    if (currentUser.reviveCards <= 0) return false;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // 如果昨天没打卡且今天也没打卡，可以使用复活卡
    return currentInstance.lastCheckInDate !== yesterdayStr && 
           currentInstance.lastCheckInDate !== today &&
           currentInstance.currentStreak > 0;
  }, [currentUser, currentInstance, today]);

  const handleCheckIn = () => {
    if (!selectedUser || !selectedProject) return;
    if (hasCheckedInToday) return;

    onCheckIn(selectedUser, selectedProject);
    play('checkIn');
    checkInSuccess();

    // 检查是否达成连续目标
    const instance = instances.find(i => i.userId === selectedUser && i.projectId === selectedProject);
    const project = projects.find(p => p.id === selectedProject);
    if (instance && project) {
      const newStreak = instance.currentStreak + 1;
      if (newStreak >= project.streakTarget && newStreak % project.streakTarget === 0) {
        setStreakInfo({
          days: newStreak,
          bonus: project.streakBonusScore,
          cards: project.streakBonusReviveCards
        });
        setShowStreakDialog(true);
        setTimeout(() => streakBonus(newStreak), 500);
      }
    }
  };

  const handleUseReviveCard = () => {
    if (!canUseReviveCard) return;
    onUseReviveCard(selectedUser, selectedProject);
    play('revive');
  };

  const getStreakDisplay = () => {
    if (!currentInstance) return { current: 0, max: 0, target: currentProject?.streakTarget || 7 };
    return {
      current: currentInstance.currentStreak,
      max: currentInstance.maxStreak,
      target: currentProject?.streakTarget || 7
    };
  };

  const streak = getStreakDisplay();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-pixel text-minecraft-grass flex items-center gap-2">
        <Check className="w-6 h-6" />
        每日打卡
      </h2>

      <Card className="minecraft-card border-4 border-minecraft-diamond">
        <CardContent className="p-6 space-y-4">
          {/* 选择用户和项目 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                选择打卡人
              </label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="minecraft-input font-pixel">
                  <SelectValue placeholder="选择打卡人" />
                </SelectTrigger>
                <SelectContent className="minecraft-panel">
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id} className="font-pixel">
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                选择项目
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="minecraft-input font-pixel">
                  <SelectValue placeholder="选择打卡项目" />
                </SelectTrigger>
                <SelectContent className="minecraft-panel">
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id} className="font-pixel">
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 打卡信息展示 */}
          {currentUser && currentProject && (
            <div className="border-2 border-minecraft-stone/30 rounded-lg p-4 space-y-4">
              {/* 用户信息 */}
              <div className="flex items-center gap-4">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-lg border-2 border-minecraft-stone"
                />
                <div>
                  <h3 className="font-pixel text-xl text-minecraft-grass">{currentUser.name}</h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-sm font-pixel text-minecraft-gold">
                      总积分: {currentUser.totalScore}
                    </span>
                    <span className="text-sm font-pixel text-minecraft-diamond">
                      复活卡: {currentUser.reviveCards}
                    </span>
                  </div>
                </div>
              </div>

              {/* 项目信息 */}
              <div 
                className="p-3 rounded-lg border-2"
                style={{ 
                  borderColor: currentProject.color,
                  backgroundColor: currentProject.color + '15'
                }}
              >
                <h4 className="font-pixel" style={{ color: currentProject.color }}>
                  {currentProject.name}
                </h4>
                <p className="text-xs text-minecraft-stone mt-1">
                  {currentProject.description}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs font-pixel bg-minecraft-gold/20 text-minecraft-gold px-2 py-1 rounded">
                    +{currentProject.scorePerCheckIn}分/次
                  </span>
                  <span className="text-xs font-pixel bg-minecraft-diamond/20 text-minecraft-diamond px-2 py-1 rounded">
                    {currentProject.streakTarget}天奖{currentProject.streakBonusScore}分
                  </span>
                </div>
              </div>

              {/* 连续打卡进度 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-sm text-minecraft-stone flex items-center gap-1">
                    <Flame className="w-4 h-4 text-minecraft-lava" />
                    连续打卡
                  </span>
                  <span className="font-pixel text-sm">
                    <span className="text-minecraft-lava">{streak.current}</span>
                    <span className="text-minecraft-stone"> / {streak.target}天</span>
                  </span>
                </div>
                <div className="h-4 bg-minecraft-stone/30 rounded-full overflow-hidden border-2 border-minecraft-stone">
                  <div 
                    className="h-full bg-gradient-to-r from-minecraft-lava to-minecraft-gold transition-all duration-500"
                    style={{ width: `${Math.min((streak.current / streak.target) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-pixel text-minecraft-stone">
                  <span>最高记录: {streak.max}天</span>
                  <span>目标: {streak.target}天</span>
                </div>
              </div>

              {/* 打卡按钮 */}
              <div className="flex gap-3">
                <Button
                  onClick={handleCheckIn}
                  disabled={hasCheckedInToday}
                  className={`flex-1 minecraft-btn text-lg py-6 ${
                    hasCheckedInToday 
                      ? 'bg-minecraft-stone cursor-not-allowed' 
                      : 'bg-minecraft-grass hover:bg-minecraft-grass/90'
                  }`}
                >
                  <Check className="w-5 h-5 mr-2" />
                  {hasCheckedInToday ? '今日已打卡' : '立即打卡'}
                </Button>

                {canUseReviveCard && (
                  <Button
                    onClick={handleUseReviveCard}
                    className="minecraft-btn bg-minecraft-diamond hover:bg-minecraft-diamond/90"
                    title="使用复活卡延续连续记录"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    复活
                  </Button>
                )}
              </div>

              {hasCheckedInToday && (
                <div className="text-center text-sm font-pixel text-minecraft-grass">
                  今日已完成打卡，明天再来吧！
                </div>
              )}
            </div>
          )}

          {!selectedUser && (
            <div className="text-center py-8 text-minecraft-stone font-pixel">
              请先选择打卡人和打卡项目
            </div>
          )}
        </CardContent>
      </Card>

      {/* 连续打卡奖励弹窗 */}
      <Dialog open={showStreakDialog} onOpenChange={setShowStreakDialog}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-gold">
          <DialogHeader>
            <DialogTitle className="text-2xl font-pixel text-minecraft-gold flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              连续打卡奖励！
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <div className="text-6xl font-pixel text-minecraft-gold">
              {streakInfo?.days}天
            </div>
            <p className="font-pixel text-minecraft-stone">
              恭喜你达成连续打卡目标！
            </p>
            <div className="space-y-2">
              <div className="text-lg font-pixel text-minecraft-gold">
                +{streakInfo?.bonus} 积分
              </div>
              <div className="text-lg font-pixel text-minecraft-diamond">
                +{streakInfo?.cards} 复活卡
              </div>
            </div>
            <Button
              onClick={() => setShowStreakDialog(false)}
              className="minecraft-btn bg-minecraft-gold hover:bg-minecraft-gold/90 mt-4"
            >
              太棒了！
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
