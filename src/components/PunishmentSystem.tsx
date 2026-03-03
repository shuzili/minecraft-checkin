import { useState } from 'react';
import type { User, PunishmentRule, PunishmentRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Plus, Trash2, History, Book, Diamond, CircleDollarSign, Sprout, Skull } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useConfetti } from '@/hooks/useConfetti';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PunishmentSystemProps {
  users: User[];
  punishmentRules: PunishmentRule[];
  punishmentRecords: PunishmentRecord[];
  onAddPunishmentRule: (rule: Omit<PunishmentRule, 'id'>) => void;
  onDeletePunishmentRule: (ruleId: string) => void;
  onApplyPunishment: (userId: string, ruleId: string, reason: string) => void;
}

const ICONS = {
  book: Book,
  diamond: Diamond,
  gold: CircleDollarSign,
  grass: Sprout,
  skull: Skull
};

const COLORS = [
  { name: '草绿', value: '#5d8c37' },
  { name: '钻石蓝', value: '#00aaaa' },
  { name: '金色', value: '#ffcc00' },
  { name: '红石红', value: '#b02e26' },
  { name: '青金石蓝', value: '#2c2e8f' },
  { name: '绿宝石绿', value: '#00ff00' },
  { name: '木头棕', value: '#8b4513' },
  { name: '石头灰', value: '#7a7a7a' }
];

export function PunishmentSystem({ 
  users, 
  punishmentRules, 
  punishmentRecords,
  onAddPunishmentRule, 
  onDeletePunishmentRule, 
  onApplyPunishment 
}: PunishmentSystemProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<PunishmentRule | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [punishmentReason, setPunishmentReason] = useState('');
  const [newRule, setNewRule] = useState<Partial<PunishmentRule>>({
    name: '',
    description: '',
    deduction: 10,
    icon: 'skull',
    color: '#b02e26'
  });
  const { play } = useSound();
  const { punishment } = useConfetti();

  const handleAddRule = () => {
    if (!newRule.name?.trim()) return;
    
    onAddPunishmentRule(newRule as Omit<PunishmentRule, 'id'>);
    play('success');
    setNewRule({
      name: '',
      description: '',
      deduction: 10,
      icon: 'skull',
      color: '#b02e26'
    });
    setDialogOpen(false);
  };

  const handleApplyPunishment = () => {
    if (!selectedUser || !selectedRule) return;
    
    onApplyPunishment(selectedUser, selectedRule.id, punishmentReason);
    play('error');
    punishment();
    setApplyDialogOpen(false);
    setSelectedRule(null);
    setSelectedUser('');
    setPunishmentReason('');
  };

  const openApplyDialog = (rule: PunishmentRule) => {
    setSelectedRule(rule);
    setApplyDialogOpen(true);
    play('click');
  };

  const getIconComponent = (iconName: string) => {
    const Icon = ICONS[iconName as keyof typeof ICONS] || Skull;
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-pixel text-minecraft-lava flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          惩罚规则
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setHistoryDialogOpen(true); play('click'); }}
            className="minecraft-btn border-minecraft-stone"
          >
            <History className="w-4 h-4 mr-2" />
            惩罚记录
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90"
                onClick={() => play('click')}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加规则
              </Button>
            </DialogTrigger>
            <DialogContent className="minecraft-panel border-4 border-minecraft-lava max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-pixel text-minecraft-lava">
                  添加惩罚规则
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    规则名称
                  </label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="例如：未完成任务"
                    className="minecraft-input font-pixel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    规则描述
                  </label>
                  <Input
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    placeholder="简单描述这个规则"
                    className="minecraft-input font-pixel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    扣除积分
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={newRule.deduction}
                    onChange={(e) => setNewRule({ ...newRule, deduction: parseInt(e.target.value) })}
                    className="minecraft-input font-pixel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    图标
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(ICONS).map(([key, Icon]) => (
                      <button
                        key={key}
                        onClick={() => { setNewRule({ ...newRule, icon: key }); play('click'); }}
                        className={`w-12 h-12 border-4 rounded-lg flex items-center justify-center transition-all ${
                          newRule.icon === key 
                            ? 'border-minecraft-lava bg-minecraft-lava/20' 
                            : 'border-minecraft-stone hover:border-minecraft-iron'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    颜色
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => { setNewRule({ ...newRule, color: color.value }); play('click'); }}
                        className={`w-10 h-10 border-4 rounded-lg transition-all ${
                          newRule.color === color.value 
                            ? 'border-minecraft-lava ring-2 ring-minecraft-lava' 
                            : 'border-minecraft-stone hover:border-minecraft-iron'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <Button
                  onClick={handleAddRule}
                  disabled={!newRule.name?.trim()}
                  className="w-full minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  确认添加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {punishmentRules.length === 0 ? (
        <div className="text-center py-8 minecraft-panel border-4 border-dashed border-minecraft-stone/50">
          <AlertTriangle className="w-16 h-16 mx-auto text-minecraft-stone/50 mb-4" />
          <p className="font-pixel text-minecraft-stone">暂无惩罚规则</p>
          <p className="font-pixel text-sm text-minecraft-stone/70 mt-2">
            点击上方按钮添加规则
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {punishmentRules.map((rule) => (
            <Card 
              key={rule.id} 
              className="minecraft-card border-4"
              style={{ borderColor: rule.color }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-14 h-14 rounded-lg border-2 border-minecraft-stone flex items-center justify-center shrink-0"
                    style={{ backgroundColor: rule.color + '30' }}
                  >
                    <div style={{ color: rule.color }}>
                      {getIconComponent(rule.icon)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-pixel text-lg truncate" style={{ color: rule.color }}>
                      {rule.name}
                    </h3>
                    <p className="text-xs text-minecraft-stone mt-1 line-clamp-2">
                      {rule.description}
                    </p>
                    <div className="mt-2">
                      <span className="text-lg font-pixel text-minecraft-lava">
                        -{rule.deduction}
                      </span>
                      <span className="text-xs font-pixel text-minecraft-stone ml-1">积分</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => openApplyDialog(rule)}
                    className="flex-1 minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    执行惩罚
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { onDeletePunishmentRule(rule.id); play('pop'); }}
                    className="shrink-0 text-minecraft-lava hover:text-minecraft-lava/80 hover:bg-minecraft-lava/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 执行惩罚弹窗 */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-lava">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-lava flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              执行惩罚
            </DialogTitle>
          </DialogHeader>
          {selectedRule && (
            <div className="space-y-4 pt-4">
              <div 
                className="p-4 rounded-lg border-2"
                style={{ borderColor: selectedRule.color, backgroundColor: selectedRule.color + '15' }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ color: selectedRule.color }}>
                    {getIconComponent(selectedRule.icon)}
                  </div>
                  <div>
                    <h4 className="font-pixel" style={{ color: selectedRule.color }}>
                      {selectedRule.name}
                    </h4>
                    <p className="text-xs text-minecraft-stone">{selectedRule.description}</p>
                  </div>
                  <div className="ml-auto text-lg font-pixel text-minecraft-lava">
                    -{selectedRule.deduction} 积分
                  </div>
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
                      <SelectItem 
                        key={user.id} 
                        value={user.id} 
                        className="font-pixel"
                      >
                        {user.name} (积分: {user.totalScore})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                  惩罚原因（可选）
                </label>
                <Input
                  value={punishmentReason}
                  onChange={(e) => setPunishmentReason(e.target.value)}
                  placeholder="输入惩罚原因"
                  className="minecraft-input font-pixel"
                />
              </div>

              <Button
                onClick={handleApplyPunishment}
                disabled={!selectedUser}
                className="w-full minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90 disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                确认执行
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 惩罚记录弹窗 */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-lava max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-lava flex items-center gap-2">
              <History className="w-6 h-6" />
              惩罚记录
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-2 mt-4">
            {punishmentRecords.length === 0 ? (
              <div className="text-center py-8 text-minecraft-stone font-pixel">
                暂无惩罚记录
              </div>
            ) : (
              [...punishmentRecords].reverse().map((record) => (
                <div 
                  key={record.id}
                  className="p-3 border-2 border-minecraft-stone/30 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-pixel text-sm">{record.userName}</div>
                    <div className="text-xs text-minecraft-stone">{record.date}</div>
                    <div className="text-xs text-minecraft-stone/70">{record.ruleName}</div>
                    {record.reason && (
                      <div className="text-xs text-minecraft-lava/70">原因: {record.reason}</div>
                    )}
                  </div>
                  <div className="font-pixel text-minecraft-lava">
                    -{record.deduction}
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
