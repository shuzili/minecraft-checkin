import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  Database,
  Download,
  FileJson,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import type { AppState, BackupRecord } from '@/types';

interface DataManagerProps {
  state: AppState;
  onImport: (state: AppState) => void;
  getBackupList: () => BackupRecord[];
  onCreateBackup: (name?: string) => string;
  onRestoreBackup: (backupId: string) => boolean;
  onDeleteBackup: (backupId: string) => void;
}

type LegacyPunishmentRule = Record<string, unknown> & { deduction?: number };
type LegacyPunishmentRecord = Record<string, unknown> & { deduction?: number };
type ImportData = Partial<AppState> & {
  punishmentRules?: LegacyPunishmentRule[];
  punishmentRecords?: LegacyPunishmentRecord[];
};

const REQUIRED_FIELDS: (keyof AppState)[] = [
  'users',
  'projects',
  'instances',
  'shopItems',
  'redemptionRecords',
  'rewardPunishmentRules',
  'rewardPunishmentRecords',
];

export function DataManager({
  state,
  onImport,
  getBackupList,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup,
}: DataManagerProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [backupList, setBackupList] = useState<BackupRecord[]>(() => getBackupList());
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { play } = useSound();


  const refreshBackups = () => setBackupList(getBackupList());

  const handleExportToFile = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `minecraft-checkin-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    play('success');
  };

  const handleExportToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(state));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      play('success');
    } catch {
      play('error');
    }
  };

  const normalizeImportData = (rawData: unknown): ImportData | null => {
    if (!rawData || typeof rawData !== 'object') {
      return null;
    }

    const data = { ...(rawData as ImportData) };

    if (data.punishmentRules && !data.rewardPunishmentRules) {
      data.rewardPunishmentRules = data.punishmentRules.map((rule) => ({
        id: String(rule.id ?? `legacy-rule-${Date.now()}`),
        name: String(rule.name ?? '旧版惩罚规则'),
        description: String(rule.description ?? ''),
        points: typeof rule.deduction === 'number' ? rule.deduction : 10,
        type: 'punishment',
        icon: String(rule.icon ?? 'grass'),
        color: String(rule.color ?? '#b02e26'),
      }));
      delete data.punishmentRules;
    }

    if (data.punishmentRecords && !data.rewardPunishmentRecords) {
      data.rewardPunishmentRecords = data.punishmentRecords.map((record) => ({
        id: String(record.id ?? `legacy-record-${Date.now()}`),
        userId: String(record.userId ?? ''),
        userName: String(record.userName ?? '未知用户'),
        ruleId: String(record.ruleId ?? ''),
        ruleName: String(record.ruleName ?? '旧版惩罚记录'),
        points: typeof record.deduction === 'number' ? record.deduction : 0,
        type: 'punishment',
        date: String(record.date ?? new Date().toISOString().split('T')[0]),
        reason: String(record.reason ?? ''),
      }));
      delete data.punishmentRecords;
    }

    return data;
  };

  const validateAndImport = (rawData: unknown) => {
    const data = normalizeImportData(rawData);
    if (!data) {
      setImportError('数据格式错误');
      play('error');
      return;
    }

    const missingFields = REQUIRED_FIELDS.filter((field) => !(field in data));
    if (missingFields.length > 0) {
      setImportError(`数据缺少必要字段: ${missingFields.join(', ')}`);
      play('error');
      return;
    }

    const confirmText = `确定要导入数据吗？这将覆盖当前所有数据。\n\n导入内容:\n- 用户: ${data.users?.length ?? 0} 个\n- 项目: ${data.projects?.length ?? 0} 个\n- 商城商品: ${data.shopItems?.length ?? 0} 个\n- 奖惩规则: ${data.rewardPunishmentRules?.length ?? 0} 个`;

    if (!confirm(confirmText)) return;

    onImport(data as AppState);
    setImportDialogOpen(false);
    setImportData('');
    setImportError('');
    play('success');
  };

  const handleFileImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(String(e.target?.result ?? ''));
        validateAndImport(data);
      } catch {
        setImportError('文件格式错误，无法解析 JSON');
        play('error');
      }
    };
    reader.readAsText(file);
  };

  const handleTextImport = () => {
    if (!importData.trim()) {
      setImportError('请输入数据');
      return;
    }

    try {
      const data = JSON.parse(importData);
      validateAndImport(data);
    } catch {
      setImportError('数据格式错误，无法解析 JSON');
      play('error');
    }
  };

  const handleClearAll = () => {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复。')) return;
    if (!confirm('再次确认：你真的要删除所有数据吗？')) return;

    localStorage.removeItem('minecraft-checkin-app');
    localStorage.removeItem('last-daily-reset');
    window.location.reload();
  };

  const stats = {
    users: state.users.length,
    projects: state.projects.length,
    shopItems: state.shopItems.length,
    rewardPunishmentRules: state.rewardPunishmentRules.length,
    totalCheckIns: state.users.reduce((sum, user) => sum + user.checkInHistory.length, 0),
    totalRedemptions: state.redemptionRecords.length,
    totalRewardPunishments: state.rewardPunishmentRecords.length,
    dataSize: JSON.stringify(state).length,
  };

  return (
    <div className="space-y-4">
      <Card className="minecraft-card border-4 border-minecraft-diamond">
        <CardHeader>
          <CardTitle className="font-pixel text-minecraft-diamond flex items-center gap-2">
            <Database className="w-5 h-5" />数据统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-minecraft-diamond/10 rounded-lg">
              <div className="text-2xl font-pixel text-minecraft-diamond">{stats.users}</div>
              <div className="text-xs font-pixel text-minecraft-stone">用户</div>
            </div>
            <div className="text-center p-3 bg-minecraft-grass/10 rounded-lg">
              <div className="text-2xl font-pixel text-minecraft-grass">{stats.projects}</div>
              <div className="text-xs font-pixel text-minecraft-stone">项目</div>
            </div>
            <div className="text-center p-3 bg-minecraft-gold/10 rounded-lg">
              <div className="text-2xl font-pixel text-minecraft-gold">{stats.totalCheckIns}</div>
              <div className="text-xs font-pixel text-minecraft-stone">打卡记录</div>
            </div>
            <div className="text-center p-3 bg-minecraft-emerald/10 rounded-lg">
              <div className="text-2xl font-pixel text-minecraft-emerald">{stats.shopItems}</div>
              <div className="text-xs font-pixel text-minecraft-stone">商城商品</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-xs font-pixel text-minecraft-stone">数据大小: {(stats.dataSize / 1024).toFixed(2)} KB</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="minecraft-card border-4 border-minecraft-grass">
          <CardHeader>
            <CardTitle className="font-pixel text-minecraft-grass flex items-center gap-2">
              <Download className="w-5 h-5" />导出数据
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-minecraft-stone font-pixel">导出 JSON 文件用于备份或跨设备同步。</p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  handleExportToFile();
                  play('click');
                }}
                className="flex-1 minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90"
              >
                <FileJson className="w-4 h-4 mr-2" />导出文件
              </Button>
              <Button
                onClick={() => {
                  handleExportToClipboard();
                  play('click');
                }}
                variant="outline"
                className="minecraft-btn border-minecraft-stone"
              >
                {copySuccess ? <CheckCircle className="w-4 h-4 text-minecraft-grass" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {copySuccess ? <p className="text-xs text-minecraft-grass font-pixel text-center">已复制到剪贴板</p> : null}
          </CardContent>
        </Card>

        <Card className="minecraft-card border-4 border-minecraft-gold">
          <CardHeader>
            <CardTitle className="font-pixel text-minecraft-gold flex items-center gap-2">
              <Upload className="w-5 h-5" />导入数据
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-minecraft-stone font-pixel">导入 JSON 文件或文本，会覆盖当前数据。</p>
            <Button
              onClick={() => {
                setImportDialogOpen(true);
                play('click');
              }}
              className="w-full minecraft-btn bg-minecraft-gold hover:bg-minecraft-gold/90"
            >
              <Upload className="w-4 h-4 mr-2" />导入数据
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="minecraft-card border-4 border-minecraft-lava">
        <CardHeader>
          <CardTitle className="font-pixel text-minecraft-lava flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />危险操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-minecraft-stone font-pixel mb-3">清空全部本地数据，此操作不可恢复。</p>
          <Button
            onClick={() => {
              setClearDialogOpen(true);
              play('click');
            }}
            variant="outline"
            className="minecraft-btn border-minecraft-lava text-minecraft-lava hover:bg-minecraft-lava/10"
          >
            <Trash2 className="w-4 h-4 mr-2" />清空所有数据
          </Button>
        </CardContent>
      </Card>

      <Card className="minecraft-card border-4 border-minecraft-wood">
        <CardHeader>
          <CardTitle className="font-pixel text-minecraft-wood flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />多端同步说明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-minecraft-stone font-pixel">
          <p>1. 在当前设备导出 JSON 数据文件。</p>
          <p>2. 通过网盘、聊天或邮件把文件传到另一台设备。</p>
          <p>3. 在另一台设备执行导入，恢复完整数据。</p>
          <p className="text-minecraft-lava">注意：导入会覆盖当前设备已有数据。</p>
        </CardContent>
      </Card>

      <Card className="minecraft-card border-4 border-minecraft-emerald">
        <CardHeader>
          <CardTitle className="font-pixel text-minecraft-emerald flex items-center gap-2">
            <Clock className="w-5 h-5" />历史备份
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-minecraft-stone font-pixel">自动每日备份，最多保留 {backupList.length}/10 条记录。</p>
          <Button
            onClick={() => {
              setBackupDialogOpen(true);
              play('click');
            }}
            className="w-full minecraft-btn bg-minecraft-emerald hover:bg-minecraft-emerald/90"
          >
            <Plus className="w-4 h-4 mr-2" />创建备份
          </Button>

          {backupList.length > 0 ? (
            <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
              {backupList.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-3 bg-minecraft-emerald/10 rounded-lg border border-minecraft-emerald/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-sm text-white truncate">{backup.name}</p>
                    <p className="font-pixel text-xs text-minecraft-stone">
                      {new Date(backup.date).toLocaleDateString('zh-CN')} {new Date(backup.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · {(backup.dataSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedBackup(backup);
                        setRestoreDialogOpen(true);
                        play('click');
                      }}
                      className="h-8 w-8 text-minecraft-emerald hover:bg-minecraft-emerald/20"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (!confirm('确定要删除这个备份吗？')) return;
                        onDeleteBackup(backup.id);
                        refreshBackups();
                        play('pop');
                      }}
                      className="h-8 w-8 text-minecraft-lava hover:bg-minecraft-lava/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-gold max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-gold flex items-center gap-2">
              <Upload className="w-6 h-6" />导入数据
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">从文件导入</label>
              <Input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                ref={fileInputRef}
                className="minecraft-input font-pixel"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-minecraft-stone/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-[#2d2d44] text-xs font-pixel text-minecraft-stone">或</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">粘贴 JSON 文本</label>
              <textarea
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                  setImportError('');
                }}
                placeholder="把 JSON 数据粘贴到这里..."
                className="w-full h-32 minecraft-input font-pixel p-3 rounded-lg resize-none"
              />
            </div>

            {importError ? (
              <div className="p-3 bg-minecraft-lava/20 border-2 border-minecraft-lava rounded-lg">
                <p className="text-sm font-pixel text-minecraft-lava flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />{importError}
                </p>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setImportDialogOpen(false);
                  setImportData('');
                  setImportError('');
                  play('click');
                }}
                variant="outline"
                className="flex-1 minecraft-btn border-minecraft-stone"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  handleTextImport();
                  play('click');
                }}
                disabled={!importData.trim()}
                className="flex-1 minecraft-btn bg-minecraft-gold hover:bg-minecraft-gold/90 disabled:opacity-50"
              >
                <Upload className="w-4 h-4 mr-2" />确认导入
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-lava max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-lava flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />确认清空数据
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-minecraft-lava/10 border-2 border-minecraft-lava rounded-lg">
              <p className="font-pixel text-minecraft-lava text-center">此操作将删除所有数据，且不可恢复。</p>
              <p className="font-pixel text-sm text-minecraft-stone text-center mt-2">建议先导出备份。</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setClearDialogOpen(false);
                  play('click');
                }}
                variant="outline"
                className="flex-1 minecraft-btn border-minecraft-stone"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  handleClearAll();
                  play('error');
                }}
                className="flex-1 minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90"
              >
                <Trash2 className="w-4 h-4 mr-2" />确认清空
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-emerald max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-emerald flex items-center gap-2">
              <Plus className="w-6 h-6" />创建备份
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">备份名称（可选）</label>
              <Input
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="例如：重要数据备份"
                className="minecraft-input font-pixel"
              />
            </div>
            <p className="text-xs text-minecraft-stone font-pixel">备份将保存当前完整数据。</p>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setBackupDialogOpen(false);
                  setBackupName('');
                  play('click');
                }}
                variant="outline"
                className="flex-1 minecraft-btn border-minecraft-stone"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  onCreateBackup(backupName || undefined);
                  refreshBackups();
                  setBackupDialogOpen(false);
                  setBackupName('');
                  play('success');
                }}
                className="flex-1 minecraft-btn bg-minecraft-emerald hover:bg-minecraft-emerald/90"
              >
                <Plus className="w-4 h-4 mr-2" />创建备份
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-gold max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-gold flex items-center gap-2">
              <RotateCcw className="w-6 h-6" />恢复备份
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedBackup ? (
              <div className="p-4 bg-minecraft-gold/10 border-2 border-minecraft-gold rounded-lg">
                <p className="font-pixel text-white">备份名称：{selectedBackup.name}</p>
                <p className="font-pixel text-sm text-minecraft-stone mt-1">
                  备份时间：{new Date(selectedBackup.date).toLocaleDateString('zh-CN')} {new Date(selectedBackup.date).toLocaleTimeString('zh-CN')}
                </p>
                <p className="font-pixel text-sm text-minecraft-stone">数据大小：{(selectedBackup.dataSize / 1024).toFixed(1)} KB</p>
              </div>
            ) : null}
            <div className="p-3 bg-minecraft-lava/10 border-2 border-minecraft-lava rounded-lg">
              <p className="font-pixel text-minecraft-lava text-center text-sm">恢复会覆盖当前所有数据。</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setRestoreDialogOpen(false);
                  setSelectedBackup(null);
                  play('click');
                }}
                variant="outline"
                className="flex-1 minecraft-btn border-minecraft-stone"
              >
                取消
              </Button>
              <Button
                onClick={() => {
                  if (!selectedBackup) return;
                  const ok = onRestoreBackup(selectedBackup.id);
                  if (ok) {
                    refreshBackups();
                    setRestoreDialogOpen(false);
                    setSelectedBackup(null);
                    play('success');
                  } else {
                    play('error');
                  }
                }}
                className="flex-1 minecraft-btn bg-minecraft-gold hover:bg-minecraft-gold/90"
              >
                <RotateCcw className="w-4 h-4 mr-2" />确认恢复
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

