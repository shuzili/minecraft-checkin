import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, LogOut, User as UserIcon, KeyRound, AtSign, UserPlus, LogIn, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useSound } from '@/hooks/useSound';

type Status = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface CloudSyncDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  auth: { token: string; userId: string; username: string; displayName: string } | null;
  status: Status;
  lastError: string | null;
  lastSyncedAt: number | null;
  apiBase: string;
  onLogin: (username: string, password: string) => Promise<unknown>;
  onRegister: (username: string, password: string, displayName?: string) => Promise<unknown>;
  onLogout: () => void;
  onPushNow: () => Promise<void>;
  onSetApiBase: (base: string) => void;
}

function formatTime(ts: number | null): string {
  if (!ts) return '尚未同步';
  const d = new Date(ts);
  const now = Date.now();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return `${diff} 秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  return d.toLocaleString('zh-CN');
}

export function CloudSyncDialog({
  open,
  onOpenChange,
  auth,
  status,
  lastError,
  lastSyncedAt,
  apiBase,
  onLogin,
  onRegister,
  onLogout,
  onPushNow,
  onSetApiBase,
}: CloudSyncDialogProps) {
  const { play } = useSound();
  const [tab, setTab] = useState<'login' | 'register'>(auth ? 'login' : 'register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [apiBaseInput, setApiBaseInput] = useState(apiBase);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setApiBaseInput(apiBase);
      setFormError(null);
    }
  }, [open, apiBase]);

  useEffect(() => {
    if (!open || !auth) return;
    const t = setInterval(() => {
      // re-render to refresh "X seconds ago"
      setApiBaseInput((s) => s);
    }, 1000);
    return () => clearInterval(t);
  }, [open, auth, lastSyncedAt]);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setFormError('请输入用户名和密码');
      return;
    }
    setBusy(true); setFormError(null);
    try {
      await onLogin(username.trim(), password);
      play('success');
      setPassword('');
    } catch (e: any) {
      setFormError(e?.message || '登录失败');
      play('error');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password) {
      setFormError('请输入用户名和密码');
      return;
    }
    if (password.length < 4) {
      setFormError('密码至少 4 位');
      return;
    }
    setBusy(true); setFormError(null);
    try {
      await onRegister(username.trim(), password, displayName.trim() || undefined);
      play('success');
      setPassword('');
    } catch (e: any) {
      setFormError(e?.message || '注册失败');
      play('error');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    setUsername(''); setPassword(''); setDisplayName('');
    setTab('login');
    play('click');
  };

  const handlePush = async () => {
    setBusy(true);
    try {
      await onPushNow();
      play('success');
    } finally {
      setBusy(false);
    }
  };

  const saveApiBase = () => {
    onSetApiBase(apiBaseInput.trim());
    play('click');
  };

  const statusBadge = (() => {
    if (status === 'syncing') return { text: '同步中...', color: 'bg-blue-500/20 text-blue-300', icon: Loader2 };
    if (status === 'synced') return { text: '已同步', color: 'bg-emerald-500/20 text-emerald-300', icon: CheckCircle2 };
    if (status === 'error') return { text: '同步出错', color: 'bg-red-500/20 text-red-300', icon: AlertCircle };
    if (status === 'offline') return { text: '离线', color: 'bg-stone-500/20 text-stone-300', icon: CloudOff };
    return { text: '空闲', color: 'bg-stone-500/20 text-stone-300', icon: Cloud };
  })();
  const StatusIcon = statusBadge.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="minecraft-panel border-4 border-minecraft-wood max-w-md">
        <DialogHeader>
          <DialogTitle className="font-pixel text-minecraft-gold flex items-center gap-2">
            <Cloud className="w-5 h-5" /> 云端同步
          </DialogTitle>
          <DialogDescription className="font-pixel text-minecraft-stone text-xs">
            注册一个账号，所有设备都能自动同步你的打卡数据。
          </DialogDescription>
        </DialogHeader>

        {auth ? (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-minecraft-emerald bg-minecraft-emerald/10 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-minecraft-emerald flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-pixel text-white text-sm">{auth.displayName || auth.username}</div>
                    <div className="font-pixel text-minecraft-stone text-xs">@{auth.username}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-pixel ${statusBadge.color}`}>
                  <StatusIcon className={`w-3 h-3 ${status === 'syncing' ? 'animate-spin' : ''}`} />
                  {statusBadge.text}
                </div>
              </div>
            </div>

            <div className="text-xs font-pixel text-minecraft-stone space-y-1">
              <div>上次同步: {formatTime(lastSyncedAt)}</div>
              <div className="break-all">API: <span className="text-minecraft-diamond">{apiBase}</span></div>
            </div>

            {lastError && (
              <div className="rounded border-2 border-red-500/50 bg-red-500/10 p-2 text-xs font-pixel text-red-300 space-y-1">
                <div>{lastError}</div>
                {String(lastError).toLowerCase().includes("unauthorized") && (
                  <div className="text-minecraft-stone">点下方"重置"按钮可清空错误的 API 地址。</div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handlePush}
                disabled={busy || status === 'syncing'}
                className="minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90 flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${busy || status === 'syncing' ? 'animate-spin' : ''}`} />
                立即同步
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="minecraft-btn border-minecraft-lava text-minecraft-lava"
              >
                <LogOut className="w-4 h-4 mr-1" />
                退出
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
            <TabsList className="grid grid-cols-2 w-full bg-minecraft-dirt/50">
              <TabsTrigger value="login" className="font-pixel data-[state=active]:bg-minecraft-emerald data-[state=active]:text-white">
                <LogIn className="w-4 h-4 mr-1" /> 登录
              </TabsTrigger>
              <TabsTrigger value="register" className="font-pixel data-[state=active]:bg-minecraft-grass data-[state=active]:text-white">
                <UserPlus className="w-4 h-4 mr-1" /> 注册
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label className="font-pixel text-minecraft-stone text-xs flex items-center gap-1">
                  <AtSign className="w-3 h-3" /> 用户名
                </Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="用户名"
                  className="minecraft-input"
                  autoComplete="username"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                />
              </div>
              <div className="space-y-1">
                <Label className="font-pixel text-minecraft-stone text-xs flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> 密码
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  className="minecraft-input"
                  autoComplete="current-password"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                />
              </div>
              {formError && (
                <div className="rounded border-2 border-red-500/50 bg-red-500/10 p-2 text-xs font-pixel text-red-300">
                  {formError}
                </div>
              )}
              <Button
                onClick={handleLogin}
                disabled={busy}
                className="minecraft-btn bg-minecraft-emerald hover:bg-minecraft-emerald/90 w-full"
              >
                {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <LogIn className="w-4 h-4 mr-1" />}
                登录
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label className="font-pixel text-minecraft-stone text-xs flex items-center gap-1">
                  <AtSign className="w-3 h-3" /> 用户名
                </Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="字母/数字/下划线"
                  className="minecraft-input"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-pixel text-minecraft-stone text-xs flex items-center gap-1">
                  <UserIcon className="w-3 h-3" /> 显示名称 (可选)
                </Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="昵称"
                  className="minecraft-input"
                />
              </div>
              <div className="space-y-1">
                <Label className="font-pixel text-minecraft-stone text-xs flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> 密码
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 4 位"
                  className="minecraft-input"
                  autoComplete="new-password"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRegister(); }}
                />
              </div>
              {formError && (
                <div className="rounded border-2 border-red-500/50 bg-red-500/10 p-2 text-xs font-pixel text-red-300">
                  {formError}
                </div>
              )}
              <Button
                onClick={handleRegister}
                disabled={busy}
                className="minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90 w-full"
              >
                {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />}
                创建账号
              </Button>
            </TabsContent>
          </Tabs>
        )}

        <div className="border-t-2 border-minecraft-stone/30 pt-3 space-y-2">
          <Label className="font-pixel text-minecraft-stone text-xs">API 地址 (高级)</Label>
          <div className="flex gap-2">
            <Input
              value={apiBaseInput}
              onChange={(e) => setApiBaseInput(e.target.value)}
              placeholder="例如 https://api.shuzili.ren"
              className="minecraft-input text-xs flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={saveApiBase}
              className="minecraft-btn border-minecraft-diamond text-minecraft-diamond"
            >
              保存
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { onSetApiBase(""); window.location.reload(); }}
              className="minecraft-btn border-minecraft-stone text-minecraft-stone"
              title="清空自定义 API 地址，恢复智能默认"
            >
              重置
            </Button>
          </div>
          <p className="font-pixel text-minecraft-stone/60 text-[10px]">
            默认 /api 走同源代理。如使用独立域名，需填写完整基础 URL（含 https）。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}