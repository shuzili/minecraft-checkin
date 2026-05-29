import { useState, useEffect } from 'react';
import { UserManager } from '@/components/UserManager';
import { ProjectManager } from '@/components/ProjectManager';
import { CheckInPanel } from '@/components/CheckInPanel';
import { ReviveCardSystem } from '@/components/ReviveCardSystem';
import { Leaderboard } from '@/components/Leaderboard';
import { Shop } from '@/components/Shop';
import { RewardPunishmentSystem } from '@/components/RewardPunishmentSystem';
import { DataManager } from '@/components/DataManager';
import { CheckInHistory } from '@/components/CheckInHistory';
import { AchievementSystem } from '@/components/AchievementSystem';
import { DailyChallenges } from '@/components/DailyChallenges';
import { GameMode } from '@/components/GameMode';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSound } from '@/hooks/useSound';
import {
  Users,
  Settings,
  CheckCircle,
  Heart,
  Trophy,
  ShoppingCart,
  AlertTriangle,
  Volume2,
  VolumeX,
  Pickaxe,
  Database,
  Menu,
  Calendar,
  Award,
  Gift,
  Eye,
  UserPlus,
  PlayCircle,
  Coins,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import './App.css';

type TabType = 'checkin' | 'users' | 'projects' | 'revive' | 'leaderboard' | 'shop' | 'reward-punishment' | 'data' | 'history' | 'achievements' | 'challenges';
type ExtendedTabType = TabType | 'game';

interface NavItem {
  id: ExtendedTabType;
  label: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
}

const navItems: NavItem[] = [
  { id: 'game', label: '闯关', icon: Pickaxe, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-lava' },
  { id: 'checkin', label: '打卡', icon: CheckCircle, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-grass' },
  { id: 'users', label: '用户', icon: Users, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-diamond' },
  { id: 'projects', label: '项目', icon: Settings, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-gold' },
  { id: 'revive', label: '复活卡', icon: Heart, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-diamond' },
  { id: 'leaderboard', label: '排行', icon: Trophy, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-gold' },
  { id: 'shop', label: '商城', icon: ShoppingCart, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-emerald' },
  { id: 'achievements', label: '成就', icon: Award, color: 'text-minecraft-stone', activeColor: 'bg-purple-600' },
  { id: 'challenges', label: '挑战', icon: Gift, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-emerald' },
  { id: 'reward-punishment', label: '奖惩', icon: AlertTriangle, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-lava' },
  { id: 'history', label: '历史', icon: Calendar, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-diamond' },
  { id: 'data', label: '数据', icon: Database, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-wood' },
];

function App() {
  const params = new URLSearchParams(window.location.search);
  const showPreview = params.get('view') === 'preview';

  const {
    state,
    isLoaded,
    addUser,
    deleteUser,
    addProject,
    deleteProject,
    checkIn,
    useReviveCard,
    addShopItem,
    deleteShopItem,
    redeemItem,
    applyRewardPunishment,
    deleteRewardPunishmentRecord,
    resetDailyScores,
    importState,
    getBackupList,
    createBackup,
    restoreBackup,
    deleteBackup,
    deleteCheckInRecord,
    checkInWithDate,
    addRewardPunishmentReason,
    deleteRewardPunishmentReason,
    updateRewardPunishmentReasonLastUsed,
    calculateStreakRewards,
    startLevel,
    finishLevel,
    failLevel,
    saveCheckpoint
  } = useLocalStorage();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const { play } = useSound(soundEnabled);
  const [activeTab, setActiveTab] = useState<ExtendedTabType>('game');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBattleLocked, setIsBattleLocked] = useState(false);

  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  // 姣忓ぉ閲嶇疆浠婃棩绉垎
  useEffect(() => {
    if (!isLoaded) return;
    
    const checkAndResetDaily = () => {
      const lastReset = localStorage.getItem('last-daily-reset');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastReset !== today) {
        resetDailyScores();
        localStorage.setItem('last-daily-reset', today);
      }
    };
    
    checkAndResetDaily();
    const interval = setInterval(checkAndResetDaily, 60000);
    
    return () => clearInterval(interval);
  }, [isLoaded, resetDailyScores]);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const handleTabChange = (tab: ExtendedTabType) => {
    if (isBattleLocked && tab !== 'game') {
      window.alert('关卡进行中，请先退出当前闯关。');
      return;
    }
    setActiveTab(tab);
    play('click');
    setMenuOpen(false);
  };

  const createPreviewUsers = () => {
    if (state.users.length > 0) return;
    addUser('Alex', '');
    addUser('Steve', '');
    addUser('Ender', '');
    play('success');
  };

  const runPreviewCheckIn = () => {
    const userId = state.users[0]?.id;
    const projectId = state.projects[0]?.id;
    if (!userId || !projectId) {
      window.alert('璇峰厛鍒涘缓婕旂ず鐢ㄦ埛');
      return;
    }
    checkIn(userId, projectId);
    play('checkIn');
  };

  const runPreviewReward = () => {
    const userId = state.users[0]?.id;
    if (!userId) {
      window.alert('璇峰厛鍒涘缓婕旂ず鐢ㄦ埛');
      return;
    }
    applyRewardPunishment(userId, '娴嬭瘯濂栧姳', 'reward', 20, '棰勮妯″紡鍙戞斁');
    play('success');
  };

  const runPreviewRedeem = () => {
    const userId = state.users[0]?.id;
    const itemId = state.shopItems[0]?.id;
    if (!userId || !itemId) {
      window.alert('缺少用户或商品数据');
      return;
    }
    redeemItem(userId, itemId, 1);
    play('coin');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-minecraft-dirt">
        <div className="text-center">
          <Pickaxe className="w-16 h-16 mx-auto text-minecraft-gold animate-bounce mb-4" />
          <p className="font-pixel text-2xl text-minecraft-gold">鍔犺浇涓?..</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'game':
        return (
          <GameMode
            users={state.users}
            gameState={state.gameState}
            soundEnabled={soundEnabled}
            onStartLevel={startLevel}
            onFinishLevel={finishLevel}
            onFailLevel={failLevel}
            onSaveCheckpoint={saveCheckpoint}
            onBattleLockChange={setIsBattleLocked}
          />
        );
      case 'checkin':
        return (
          <CheckInPanel
            users={state.users}
            projects={state.projects}
            instances={state.instances}
            onCheckIn={checkIn}
            onCheckInWithDate={checkInWithDate}
            onUseReviveCard={useReviveCard}
          />
        );
      case 'users':
        return (
          <UserManager
            users={state.users}
            onAddUser={addUser}
            onDeleteUser={deleteUser}
            onCalculateStreakRewards={calculateStreakRewards}
          />
        );
      case 'projects':
        return (
          <ProjectManager
            projects={state.projects}
            onAddProject={addProject}
            onDeleteProject={deleteProject}
          />
        );
      case 'revive':
        return (
          <ReviveCardSystem
            users={state.users}
            instances={state.instances}
            projects={state.projects}
            onUseReviveCard={useReviveCard}
          />
        );
      case 'leaderboard':
        return <Leaderboard users={state.users} instances={state.instances} projects={state.projects} />;
      case 'shop':
        return (
          <Shop
            users={state.users}
            shopItems={state.shopItems}
            redemptionRecords={state.redemptionRecords}
            onAddShopItem={addShopItem}
            onDeleteShopItem={deleteShopItem}
            onRedeemItem={redeemItem}
          />
        );
      case 'achievements':
        return (
          <AchievementSystem
            achievements={state.achievements}
            userAchievements={state.userAchievements}
            userLevels={state.userLevels}
            levelConfigs={state.levelConfigs}
            users={state.users.map(u => ({ id: u.id, name: u.name }))}
          />
        );
      case 'challenges':
        return (
          <DailyChallenges
            challenges={state.dailyChallenges}
            userChallengeProgress={state.userChallengeProgress}
            users={state.users}
          />
        );
      case 'reward-punishment':
        return (
          <RewardPunishmentSystem
            users={state.users}
            rewardPunishmentRecords={state.rewardPunishmentRecords}
            rewardPunishmentReasons={state.rewardPunishmentReasons}
            onApplyRewardPunishment={applyRewardPunishment}
            onDeleteRewardPunishmentRecord={deleteRewardPunishmentRecord}
            onAddRewardPunishmentReason={addRewardPunishmentReason}
            onDeleteRewardPunishmentReason={deleteRewardPunishmentReason}
            onUpdateRewardPunishmentReasonLastUsed={updateRewardPunishmentReasonLastUsed}
          />
        );
      case 'history':
        return (
          <CheckInHistory
            users={state.users}
            onDeleteRecord={deleteCheckInRecord}
          />
        );
      case 'data':
        return (
          <DataManager
            state={state}
            onImport={importState}
            getBackupList={getBackupList}
            onCreateBackup={createBackup}
            onRestoreBackup={restoreBackup}
            onDeleteBackup={deleteBackup}
          />
        );
      default:
        return null;
    }
  };

  const currentNavItem = navItems.find(item => item.id === activeTab);
  const previewTabs: ExtendedTabType[] = ['game', 'checkin', 'users', 'projects', 'revive', 'shop', 'leaderboard', 'achievements', 'challenges', 'reward-punishment', 'history', 'data'];

  return (
    <div className="min-h-screen minecraft-bg flex flex-col">
      {/* 澶撮儴 */}
      <header className="minecraft-header sticky top-0 z-50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-minecraft-grass rounded-lg border-2 border-minecraft-wood flex items-center justify-center">
                <Pickaxe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-pixel text-white drop-shadow-lg">
                  我的世界打卡
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSound}
                className="text-white hover:bg-white/10 w-9 h-9"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              
              {/* 绉诲姩绔彍鍗曟寜閽?*/}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 w-9 h-9 lg:hidden"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="minecraft-panel border-l-4 border-minecraft-wood w-[280px]">
                  <SheetHeader>
                    <SheetTitle className="font-pixel text-minecraft-gold">鍔熻兘鑿滃崟</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id)}
                          disabled={isBattleLocked && item.id !== 'game'}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-pixel text-left transition-all ${
                            activeTab === item.id
                              ? `${item.activeColor} text-white`
                              : 'text-white hover:bg-white/10'
                          } ${(isBattleLocked && item.id !== 'game') ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <Icon className="w-5 h-5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* 妗岄潰绔爣绛炬爮 */}
      <div className="hidden lg:block sticky top-[72px] z-40 bg-[#1a1a2e]/95 backdrop-blur border-b-4 border-minecraft-wood">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  disabled={isBattleLocked && item.id !== 'game'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-pixel text-sm whitespace-nowrap transition-all ${
                    activeTab === item.id
                      ? `${item.activeColor} text-white`
                      : 'text-minecraft-stone hover:text-white hover:bg-white/10'
                  } ${(isBattleLocked && item.id !== 'game') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 涓诲唴瀹?*/}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 pb-24 lg:pb-6">
        {showPreview && (
          <div className="preview-mode-panel mb-4 p-4 rounded-xl border-2 border-minecraft-diamond/60">
            <div className="flex items-start gap-3 flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-pixel text-minecraft-diamond text-xl flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  鍔熻兘娴嬭瘯妯″紡
                </h3>
                <p className="font-pixel text-minecraft-stone text-sm mt-1">
                  涓嬮潰鎸夐挳鍙揩閫熷垏鍒板悇鍔熻兘椤碉紝鎵€鏈夋搷浣滈兘鏄湡瀹炲彲鐢ㄧ殑銆?                </p>
              </div>
              <Button
                variant="outline"
                className="minecraft-btn border-minecraft-stone text-minecraft-stone"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                閫€鍑烘祴璇曟ā寮?              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {previewTabs.map((tab) => {
                const item = navItems.find((nav) => nav.id === tab);
                if (!item) return null;
                return (
                  <Button
                    key={`preview-${tab}`}
                    size="sm"
                    variant={activeTab === tab ? 'default' : 'outline'}
                    className={`minecraft-btn ${activeTab === tab ? item.activeColor : 'border-minecraft-stone text-minecraft-stone'}`}
                    disabled={isBattleLocked && tab !== 'game'}
                    onClick={() => handleTabChange(tab)}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="minecraft-btn bg-minecraft-diamond hover:bg-minecraft-diamond/90"
                onClick={createPreviewUsers}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                鐢熸垚婕旂ず鐢ㄦ埛
              </Button>
              <Button
                size="sm"
                className="minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90"
                onClick={runPreviewCheckIn}
              >
                <PlayCircle className="w-4 h-4 mr-1" />
                涓€閿墦鍗?              </Button>
              <Button
                size="sm"
                className="minecraft-btn bg-minecraft-gold hover:bg-minecraft-gold/90"
                onClick={runPreviewReward}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                鍙戞斁濂栧姳 +20
              </Button>
              <Button
                size="sm"
                className="minecraft-btn bg-minecraft-emerald hover:bg-minecraft-emerald/90"
                onClick={runPreviewRedeem}
              >
                <Coins className="w-4 h-4 mr-1" />
                鍟嗗煄鍏戞崲
              </Button>
            </div>
          </div>
        )}

        {/* 褰撳墠椤甸潰鏍囬 */}
        <div className="mb-4 flex items-center gap-2">
          {currentNavItem && (
            <>
              <currentNavItem.icon className="w-5 h-5" style={{ color: 'var(--minecraft-grass)' }} />
              <h2 className="text-xl font-pixel text-white">{currentNavItem.label}</h2>
            </>
          )}
        </div>
        
        {renderContent()}
      </main>

      {/* 绉诲姩绔簳閮ㄥ鑸?*/}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 minecraft-header border-t-4 border-minecraft-wood">
        <div className="grid grid-cols-5 gap-1 p-2 pb-2">
          {/* 鍙樉绀哄父鐢ㄥ姛鑳?*/}
          {navItems
            .filter(item => ['game', 'checkin', 'revive', 'achievements', 'leaderboard'].includes(item.id))
            .map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  disabled={isBattleLocked && item.id !== 'game'}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                    activeTab === item.id
                      ? `${item.activeColor} text-white`
                      : 'text-minecraft-stone'
                  } ${(isBattleLocked && item.id !== 'game') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-pixel">{item.label}</span>
                </button>
              );
            })}
        </div>
      </nav>

      {/* 搴曢儴 */}
      <footer className="minecraft-footer mt-auto hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-center">
            <p className="font-pixel text-sm text-minecraft-stone">
              我的世界打卡小程序 v3.0
            </p>
            <p className="font-pixel text-xs text-minecraft-stone/70 mt-1">
              数据可导出导入，支持多端同步 | 成就系统已解锁
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

