import { useState } from 'react';
import type { User, RewardPunishmentRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Plus, Trash2, History, Award } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useConfetti } from '@/hooks/useConfetti';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RewardPunishmentSystemProps {
  users: User[];
  rewardPunishmentRecords: RewardPunishmentRecord[];
  rewardPunishmentReasons: {
    name: string;
    lastUsed: number;
    type: 'reward' | 'punishment';
  }[];
  onApplyRewardPunishment: (userId: string, reason: string, type: 'reward' | 'punishment', points: number, remark?: string) => void;
  onDeleteRewardPunishmentRecord: (recordId: string) => void;
  onAddRewardPunishmentReason: (reason: { name: string; type: 'reward' | 'punishment' }) => void;
  onDeleteRewardPunishmentReason: (reasonName: string, type: 'reward' | 'punishment') => void;
  onUpdateRewardPunishmentReasonLastUsed: (reasonName: string) => void;
}

export function RewardPunishmentSystem({ 
  users, 
  rewardPunishmentRecords,
  rewardPunishmentReasons,
  onApplyRewardPunishment,
  onDeleteRewardPunishmentRecord,
  onAddRewardPunishmentReason,
  onDeleteRewardPunishmentReason,
  onUpdateRewardPunishmentReasonLastUsed
}: RewardPunishmentSystemProps) {
  const [addReasonDialogOpen, setAddReasonDialogOpen] = useState(false);
  const [addReasonType, setAddReasonType] = useState<'reward' | 'punishment'>('reward');
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [points, setPoints] = useState<number>(10);
  const [currentType, setCurrentType] = useState<'reward' | 'punishment'>('reward');
  const [newReason, setNewReason] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const { play } = useSound();
  const { punishment, celebrate } = useConfetti();
  
  const getSortedReasons = (type: 'reward' | 'punishment') => {
    const filtered = rewardPunishmentReasons.filter(r => r.type === type);
    return [...filtered].sort((a, b) => b.lastUsed - a.lastUsed);
  };

  const sortedReasons = getSortedReasons(currentType);

  const handleDeleteReason = (reasonName: string, type: 'reward' | 'punishment') => {
    onDeleteRewardPunishmentReason(reasonName, type);
    play('pop');
  };

  const openAddReasonDialog = (type: 'reward' | 'punishment') => {
    setAddReasonType(type);
    setAddReasonDialogOpen(true);
    play('click');
  };

  const handleAddReason = () => {
    if (!newReason.trim()) return;
    if (rewardPunishmentReasons.some(r => r.name === newReason.trim() && r.type === addReasonType)) return;
    
    onAddRewardPunishmentReason({ name: newReason.trim(), type: addReasonType });
    play('success');
    setNewReason('');
    setAddReasonDialogOpen(false);
  };

  const handleApplyRewardPunishment = () => {
    if (!selectedUser || !selectedReason) return;
    
    onApplyRewardPunishment(selectedUser, selectedReason, currentType, points, remark);
    onUpdateRewardPunishmentReasonLastUsed(selectedReason);
    if (currentType === 'reward') {
      play('success');
      celebrate();
    } else {
      play('error');
      punishment();
    }
    setApplyDialogOpen(false);
    setSelectedUser('');
    setSelectedReason('');
    setPoints(10);
    setRemark('');
  };

  const openApplyDialog = (type: 'reward' | 'punishment') => {
    setCurrentType(type);
    setApplyDialogOpen(true);
    play('click');
  };

  const renderReasonsList = (type: 'reward' | 'punishment') => {
    const typeReasons = getSortedReasons(type);
    const colorClass = type === 'reward' ? 'bg-minecraft-grass/20 text-minecraft-grass border-minecraft-grass/30' : 'bg-minecraft-lava/20 text-minecraft-lava border-minecraft-lava/30';
    const hoverColorClass = type === 'reward' ? 'group-hover:opacity-100 text-minecraft-grass hover:text-white' : 'group-hover:opacity-100 text-minecraft-lava hover:text-white';
    
    return typeReasons.map((reason, index) => (
      <span key={index} className={`text-xs font-pixel px-3 py-1 rounded border flex items-center gap-1 group ${colorClass}`}>
        {reason.name}
        <button
          onClick={() => handleDeleteReason(reason.name, type)}
          className={`opacity-0 transition-opacity ${hoverColorClass}`}
        >
          ×
        </button>
      </span>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-2xl font-pixel text-minecraft-lava flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          奖惩管理
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setHistoryDialogOpen(true); play('click'); }}
            className="minecraft-btn border-minecraft-stone"
          >
            <History className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">奖惩记录</span>
            <span className="sm:hidden">记录</span>
          </Button>
          <Button 
            className="minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90 text-sm py-1"
            onClick={() => openAddReasonDialog('reward')}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">奖励事由</span>
            <span className="sm:hidden">奖励</span>
          </Button>
          <Button 
            className="minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90 text-sm py-1"
            onClick={() => openAddReasonDialog('punishment')}
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">惩罚事由</span>
            <span className="sm:hidden">惩罚</span>
          </Button>
        </div>
      </div>

      <Dialog open={addReasonDialogOpen} onOpenChange={setAddReasonDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-lava max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-lava">
              添加{addReasonType === 'reward' ? '奖励' : '惩罚'}事由
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                事由名称
              </label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder={addReasonType === 'reward' ? "例如：完成任务、表现优秀" : "例如：迟到早退、未完成任务"}
                className="minecraft-input font-pixel"
              />
            </div>
            
            <Button
              onClick={handleAddReason}
              disabled={!newReason.trim()}
              className="w-full minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              确认添加
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="minecraft-panel border-4 border-minecraft-grass p-4 md:p-6">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <Award className="w-6 md:w-8 text-minecraft-grass" />
            <h3 className="text-lg md:text-xl font-pixel text-minecraft-grass">奖励</h3>
          </div>
          <Button
            onClick={() => openApplyDialog('reward')}
            className="w-full minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90 text-sm py-2 md:py-3"
          >
            <Award className="w-4 h-4 mr-1" />
            执行奖励
          </Button>
          <div className="mt-3 md:mt-4 space-y-2">
            <h4 className="font-pixel text-sm text-minecraft-stone">可用事由：</h4>
            <div className="flex flex-wrap gap-2">
              {renderReasonsList('reward')}
            </div>
          </div>
        </div>

        <div className="minecraft-panel border-4 border-minecraft-lava p-4 md:p-6">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <AlertTriangle className="w-6 md:w-8 text-minecraft-lava" />
            <h3 className="text-lg md:text-xl font-pixel text-minecraft-lava">惩罚</h3>
          </div>
          <Button
            onClick={() => openApplyDialog('punishment')}
            className="w-full minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90 text-sm py-2 md:py-3"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            执行惩罚
          </Button>
          <div className="mt-3 md:mt-4 space-y-2">
            <h4 className="font-pixel text-sm text-minecraft-stone">可用事由：</h4>
            <div className="flex flex-wrap gap-2">
              {renderReasonsList('punishment')}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-lava">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-lava flex items-center gap-2">
              {currentType === 'reward' ? (
                <>
                  <Award className="w-6 h-6" />
                  执行奖励
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6" />
                  执行惩罚
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
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
                    <SelectItem 
                      key={user.id} 
                      value={user.id} 
                      className="font-pixel"
                    >
                      {user.name} (绿宝石: {user.totalScore})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                选择事由
              </label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger className="minecraft-input font-pixel">
                  <SelectValue placeholder="选择事由" />
                </SelectTrigger>
                <SelectContent className="minecraft-panel">
                  {sortedReasons.map((reason, index) => (
                    <SelectItem 
                      key={index} 
                      value={reason.name} 
                      className="font-pixel"
                    >
                      {reason.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                {currentType === 'reward' ? '奖励绿宝石' : '扣除绿宝石'}
              </label>
              <Input
                type="number"
                min={1}
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value))}
                className="minecraft-input font-pixel"
              />
            </div>

            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                备注（可选）
              </label>
              <Input
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="填写备注信息"
                className="minecraft-input font-pixel"
              />
            </div>

            <Button
              onClick={handleApplyRewardPunishment}
              disabled={!selectedUser || !selectedReason}
              className={`w-full minecraft-btn ${currentType === 'reward' ? 'bg-minecraft-grass hover:bg-minecraft-grass/90' : 'bg-minecraft-lava hover:bg-minecraft-lava/90'} disabled:opacity-50`}
            >
              {currentType === 'reward' ? (
                <>
                  <Award className="w-4 h-4 mr-2" />
                  确认执行
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  确认执行
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-lava max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-lava flex items-center gap-2">
              <History className="w-6 h-6" />
              奖惩记录
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-2 mt-4">
            {rewardPunishmentRecords.length === 0 ? (
              <div className="text-center py-8 text-minecraft-stone font-pixel">
                暂无奖惩记录
              </div>
            ) : (
              [...rewardPunishmentRecords].reverse().map((record) => (
                <div 
                  key={record.id}
                  className="p-3 border-2 border-minecraft-stone/30 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-sm flex items-center gap-2">
                      {record.userName}
                      <span className={`text-xs font-pixel px-2 py-0.5 rounded ${record.type === 'reward' ? 'bg-minecraft-grass text-white' : 'bg-minecraft-lava text-white'}`}>
                        {record.type === 'reward' ? '奖励' : '惩罚'}
                      </span>
                    </div>
                    <div className="text-xs text-minecraft-stone">{record.date}</div>
                    <div className="text-xs text-minecraft-stone/70">{record.ruleName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-pixel ${record.type === 'reward' ? 'text-minecraft-grass' : 'text-minecraft-lava'}`}>
                      {record.type === 'reward' ? '+' : '-'}{record.points}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { onDeleteRewardPunishmentRecord(record.id); play('pop'); }}
                      className="shrink-0 text-minecraft-stone hover:text-minecraft-lava hover:bg-minecraft-lava/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

