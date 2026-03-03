import { useState } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, History, RefreshCw, Settings, ArrowRightLeft } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReviveCardSystemProps {
  users: User[];
  exchangeRate: number;
  onExchangeReviveCard: (userId: string, count: number) => void;
  onSetExchangeRate: (rate: number) => void;
}

export function ReviveCardSystem({ 
  users, 
  exchangeRate, 
  onExchangeReviveCard,
  onSetExchangeRate
}: ReviveCardSystemProps) {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [exchangeCount, setExchangeCount] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newRate, setNewRate] = useState(exchangeRate);
  const { play } = useSound();

  const currentUser = users.find(u => u.id === selectedUser);

  const handleExchange = () => {
    if (!selectedUser || exchangeCount <= 0) return;
    if (!currentUser || currentUser.totalScore < exchangeRate * exchangeCount) return;

    onExchangeReviveCard(selectedUser, exchangeCount);
    play('coin');
    setExchangeCount(1);
  };

  const handleSaveRate = () => {
    if (newRate >= 10) {
      onSetExchangeRate(newRate);
      setShowSettings(false);
      play('success');
    }
  };

  const getAllHistory = () => {
    const allHistory: { user: string; date: string; type: string; reason: string; count: number }[] = [];
    users.forEach(user => {
      user.reviveCardHistory.forEach(record => {
        allHistory.push({
          user: user.name,
          date: record.date,
          type: record.type === 'obtain' ? '获得' : '使用',
          reason: record.reason,
          count: record.count
        });
      });
    });
    return allHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-pixel text-minecraft-diamond flex items-center gap-2">
          <Heart className="w-6 h-6" />
          复活卡系统
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowHistory(true); play('click'); }}
            className="minecraft-btn border-minecraft-stone"
          >
            <History className="w-4 h-4 mr-2" />
            历史记录
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowSettings(true); play('click'); }}
            className="minecraft-btn border-minecraft-stone"
          >
            <Settings className="w-4 h-4 mr-2" />
            设置
          </Button>
        </div>
      </div>

      {/* 兑换卡片 */}
      <Card className="minecraft-card border-4 border-minecraft-diamond">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-4xl font-pixel text-minecraft-gold">{exchangeRate}</div>
              <div className="text-xs font-pixel text-minecraft-stone">积分</div>
            </div>
            <ArrowRightLeft className="w-8 h-8 text-minecraft-stone" />
            <div className="text-center">
              <div className="text-4xl font-pixel text-minecraft-diamond">1</div>
              <div className="text-xs font-pixel text-minecraft-stone">复活卡</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
              选择用户
            </label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="minecraft-input font-pixel">
                <SelectValue placeholder="选择用户" />
              </SelectTrigger>
              <SelectContent className="minecraft-panel">
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id} className="font-pixel">
                    {user.name} (积分: {user.totalScore})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentUser && (
            <div className="flex items-center justify-between p-3 bg-minecraft-stone/10 rounded-lg">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-lg border border-minecraft-stone"
                />
                <div>
                  <div className="font-pixel text-sm">{currentUser.name}</div>
                  <div className="text-xs font-pixel text-minecraft-stone">
                    拥有 {currentUser.reviveCards} 张复活卡
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-pixel text-minecraft-gold">{currentUser.totalScore}</div>
                <div className="text-xs font-pixel text-minecraft-stone">可用积分</div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
              兑换数量
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                max={currentUser ? Math.floor(currentUser.totalScore / exchangeRate) : 1}
                value={exchangeCount}
                onChange={(e) => setExchangeCount(parseInt(e.target.value) || 1)}
                className="minecraft-input font-pixel"
              />
              <Button
                onClick={handleExchange}
                disabled={!selectedUser || !currentUser || currentUser.totalScore < exchangeRate * exchangeCount}
                className="minecraft-btn bg-minecraft-diamond hover:bg-minecraft-diamond/90 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                兑换
              </Button>
            </div>
          </div>

          {currentUser && (
            <div className="text-sm font-pixel text-minecraft-stone">
              需要 {exchangeRate * exchangeCount} 积分，兑换后剩余 {currentUser.totalScore - exchangeRate * exchangeCount} 积分
            </div>
          )}
        </CardContent>
      </Card>

      {/* 用户复活卡概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {users.map(user => (
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

      {/* 历史记录弹窗 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-wood max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-gold flex items-center gap-2">
              <History className="w-6 h-6" />
              复活卡历史记录
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-2 mt-4">
            {getAllHistory().length === 0 ? (
              <div className="text-center py-8 text-minecraft-stone font-pixel">
                暂无历史记录
              </div>
            ) : (
              getAllHistory().map((record, index) => (
                <div 
                  key={index}
                  className="p-3 border-2 border-minecraft-stone/30 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-pixel text-sm">{record.user}</div>
                    <div className="text-xs text-minecraft-stone">{record.date}</div>
                    <div className="text-xs text-minecraft-stone/70">{record.reason}</div>
                  </div>
                  <div className={`font-pixel ${record.type === '获得' ? 'text-minecraft-diamond' : 'text-minecraft-lava'}`}>
                    {record.type === '获得' ? '+' : '-'}{record.count}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 设置弹窗 */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-wood">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-gold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              兑换比例设置
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                积分兑换比例（多少积分兑换1张复活卡）
              </label>
              <Input
                type="number"
                min={10}
                value={newRate}
                onChange={(e) => setNewRate(parseInt(e.target.value) || 100)}
                className="minecraft-input font-pixel"
              />
            </div>
            <Button
              onClick={handleSaveRate}
              className="w-full minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90"
            >
              保存设置
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
