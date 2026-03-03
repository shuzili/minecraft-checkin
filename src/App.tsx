import { useState, useEffect } from 'react';
import { UserManager } from '@/components/UserManager';
import { ProjectManager } from '@/components/ProjectManager';
import { CheckInPanel } from '@/components/CheckInPanel';
import { ReviveCardSystem } from '@/components/ReviveCardSystem';
import { Leaderboard } from '@/components/Leaderboard';
import { Shop } from '@/components/Shop';
import { PunishmentSystem } from '@/components/PunishmentSystem';
import { DataManager } from '@/components/DataManager';
import { CheckInHistory } from '@/components/CheckInHistory';
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
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import './App.css';

type TabType = 'checkin' | 'users' | 'projects' | 'revive' | 'leaderboard' | 'shop' | 'punishment' | 'data' | 'history';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
}

const navItems: NavItem[] = [
  { id: 'checkin', label: '打卡', icon: CheckCircle, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-grass' },
  { id: 'users', label: '用户', icon: Users, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-diamond' },
  { id: 'projects', label: '项目', icon: Settings, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-gold' },
  { id: 'revive', label: '复活卡', icon: Heart, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-diamond' },
  { id: 'leaderboard', label: '排行', icon: Trophy, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-gold' },
  { id: 'shop', label: '商城', icon: ShoppingCart, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-emerald' },
  { id: 'punishment', label: '惩罚', icon: AlertTriangle, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-lava' },
  { id: 'history', label: '历史', icon: Calendar, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-diamond' },
  { id: 'data', label: '数据', icon: Database, color: 'text-minecraft-stone', activeColor: 'bg-minecraft-wood' },
];

function App() {
  const {
    state,
    isLoaded,
    addUser,
    deleteUser,
    addProject,
    deleteProject,
    checkIn,
    useReviveCard,
    exchangeReviveCard,
    addShopItem,
    deleteShopItem,
    redeemItem,
    addPunishmentRule,
    deletePunishmentRule,
    applyPunishment,
    setReviveCardExchangeRate,
    importState,
    getBackupList,
    createBackup,
    restoreBackup,
    deleteBackup,
    deleteCheckInRecord
  } = useLocalStorage();

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const { play } = useSound(soundEnabled);
  const [activeTab, setActiveTab] = useState<TabType>('checkin');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  // 每天重置今日积分
  useEffect(() => {
    if (!isLoaded) return;
    
    const checkAndResetDaily = () => {
      const lastReset = localStorage.getItem('last-daily-reset');
      const today = new Date().toISOString().split('T')[0];
      
      if (lastReset !== today) {
        state.users.forEach(user => {
          user.todayScore = 0;
        });
        localStorage.setItem('last-daily-reset', today);
      }
    };
    
    checkAndResetDaily();
    const interval = setInterval(checkAndResetDaily, 60000);
    
    return () => clearInterval(interval);
  }, [isLoaded, state.users]);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    play('click');
    setMenuOpen(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-minecraft-dirt">
        <div className="text-center">
          <Pickaxe className="w-16 h-16 mx-auto text-minecraft-gold animate-bounce mb-4" />
          <p className="font-pixel text-2xl text-minecraft-gold">加载中...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'checkin':
        return (
          <CheckInPanel
            users={state.users}
            projects={state.projects}
            instances={state.instances}
            onCheckIn={checkIn}
            onUseReviveCard={useReviveCard}
          />
        );
      case 'users':
        return (
          <UserManager
            users={state.users}
            onAddUser={addUser}
            onDeleteUser={deleteUser}
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
            exchangeRate={state.reviveCardExchangeRate}
            onExchangeReviveCard={exchangeReviveCard}
            onSetExchangeRate={setReviveCardExchangeRate}
          />
        );
      case 'leaderboard':
        return <Leaderboard users={state.users} />;
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
      case 'punishment':
        return (
          <PunishmentSystem
            users={state.users}
            punishmentRules={state.punishmentRules}
            punishmentRecords={state.punishmentRecords}
            onAddPunishmentRule={addPunishmentRule}
            onDeletePunishmentRule={deletePunishmentRule}
            onApplyPunishment={applyPunishment}
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

  return (
    <div className="min-h-screen minecraft-bg flex flex-col">
      {/* 头部 */}
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
              
              {/* 移动端菜单按钮 */}
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
                    <SheetTitle className="font-pixel text-minecraft-gold">功能菜单</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabChange(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-pixel text-left transition-all ${
                            activeTab === item.id
                              ? `${item.activeColor} text-white`
                              : 'text-white hover:bg-white/10'
                          }`}
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

      {/* 桌面端标签栏 */}
      <div className="hidden lg:block sticky top-[72px] z-40 bg-[#1a1a2e]/95 backdrop-blur border-b-4 border-minecraft-wood">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-pixel text-sm whitespace-nowrap transition-all ${
                    activeTab === item.id
                      ? `${item.activeColor} text-white`
                      : 'text-minecraft-stone hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 主内容 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 pb-24 lg:pb-6">
        {/* 当前页面标题 */}
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

      {/* 移动端底部导航 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 minecraft-header border-t-4 border-minecraft-wood">
        <div className="grid grid-cols-5 gap-1 p-2">
          {/* 显示前5个主要功能 */}
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                  activeTab === item.id
                    ? `${item.activeColor} text-white`
                    : 'text-minecraft-stone'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-pixel">{item.label}</span>
              </button>
            );
          })}
        </div>
        {/* 更多按钮 */}
        <div className="grid grid-cols-3 gap-1 px-2 pb-2">
          {navItems.slice(5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${
                  activeTab === item.id
                    ? `${item.activeColor} text-white`
                    : 'text-minecraft-stone'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-pixel">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 底部 */}
      <footer className="minecraft-footer mt-auto hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="text-center">
            <p className="font-pixel text-sm text-minecraft-stone">
              我的世界打卡小程序 v2.0
            </p>
            <p className="font-pixel text-xs text-minecraft-stone/70 mt-1">
              数据可导出导入，支持多端同步
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
