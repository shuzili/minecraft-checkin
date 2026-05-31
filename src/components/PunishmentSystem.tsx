import { useState } from 'react';
import type { User, RewardPunishmentRule, RewardPunishmentRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertTriangle, History, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PunishmentSystemProps {
  users: User[];
  punishmentRules: RewardPunishmentRule[];
  punishmentRecords: RewardPunishmentRecord[];
  onAddPunishmentRule: (rule: Omit<RewardPunishmentRule, 'id'>) => void;
  onDeletePunishmentRule: (ruleId: string) => void;
  onApplyPunishment: (userId: string, ruleId: string, reason: string) => void;
}

export function PunishmentSystem({
  users,
  punishmentRules,
  punishmentRecords,
  onAddPunishmentRule,
  onDeletePunishmentRule,
  onApplyPunishment,
}: PunishmentSystemProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [reason, setReason] = useState('');

  const handleAddRule = () => {
    if (!ruleName.trim()) return;
    onAddPunishmentRule({
      name: ruleName.trim(),
      description: '',
      points: 10,
      type: 'punishment',
      icon: 'grass',
      color: '#b02e26',
    });
    setRuleName('');
  };

  const handleApply = () => {
    if (!selectedUserId || !selectedRuleId) return;
    onApplyPunishment(selectedUserId, selectedRuleId, reason);
    setReason('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-pixel text-minecraft-lava flex items-center gap-2">
        <AlertTriangle className="w-6 h-6" />惩罚规则（旧版）
      </h2>

      <Card className="minecraft-card border-2 border-minecraft-lava/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="新增惩罚规则名称"
              className="minecraft-input"
            />
            <Button onClick={handleAddRule} className="minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90">
              <Plus className="w-4 h-4 mr-1" />添加
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="minecraft-input">
                <SelectValue placeholder="选择用户" />
              </SelectTrigger>
              <SelectContent className="minecraft-panel">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRuleId} onValueChange={setSelectedRuleId}>
              <SelectTrigger className="minecraft-input">
                <SelectValue placeholder="选择规则" />
              </SelectTrigger>
              <SelectContent className="minecraft-panel">
                {punishmentRules.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="备注（可选）"
              className="minecraft-input"
            />
            <Button onClick={handleApply} className="minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90">
              执行
            </Button>
          </div>

          <div className="space-y-2">
            {punishmentRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between text-sm font-pixel">
                <span>{rule.name} (-{rule.points})</span>
                <Button variant="ghost" size="icon" onClick={() => onDeletePunishmentRule(rule.id)}>
                  <Trash2 className="w-4 h-4 text-minecraft-lava" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setHistoryOpen(true)}
            className="minecraft-btn border-minecraft-stone"
          >
            <History className="w-4 h-4 mr-2" />查看历史
          </Button>
        </CardContent>
      </Card>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-lava max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-lava flex items-center gap-2">
              <History className="w-6 h-6" />惩罚记录
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-2 mt-4">
            {punishmentRecords.length === 0 ? (
              <div className="text-center py-8 text-minecraft-stone font-pixel">暂无惩罚记录</div>
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
                  </div>
                  <div className="font-pixel text-minecraft-lava">-{record.points}</div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
