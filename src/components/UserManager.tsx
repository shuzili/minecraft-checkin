import { useState, useRef } from 'react';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, User as UserIcon, Upload } from 'lucide-react';
import { DEFAULT_STEVE_AVATAR, DEFAULT_ALEX_AVATAR } from '@/hooks/useLocalStorage';
import { useSound } from '@/hooks/useSound';

interface UserManagerProps {
  users: User[];
  onAddUser: (name: string, avatar: string) => void;
  onDeleteUser: (userId: string) => void;
}

export function UserManager({ users, onAddUser, onDeleteUser }: UserManagerProps) {
  const [newUserName, setNewUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<'steve' | 'alex' | 'custom'>('steve');
  const [customAvatar, setCustomAvatar] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { play } = useSound();

  const handleAddUser = () => {
    if (!newUserName.trim()) return;
    
    let avatar = DEFAULT_STEVE_AVATAR;
    if (selectedAvatar === 'alex') {
      avatar = DEFAULT_ALEX_AVATAR;
    } else if (selectedAvatar === 'custom' && customAvatar) {
      avatar = customAvatar;
    }
    
    onAddUser(newUserName.trim(), avatar);
    play('success');
    setNewUserName('');
    setSelectedAvatar('steve');
    setCustomAvatar('');
    setDialogOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomAvatar(event.target?.result as string);
        setSelectedAvatar('custom');
        play('click');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('确定要删除这个打卡人吗？所有相关数据将被清除。')) {
      onDeleteUser(userId);
      play('pop');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-pixel text-minecraft-gold flex items-center gap-2">
          <UserIcon className="w-6 h-6" />
          打卡人管理
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90"
              onClick={() => play('click')}
            >
              <Plus className="w-4 h-4 mr-2" />
              添加打卡人
            </Button>
          </DialogTrigger>
          <DialogContent className="minecraft-panel border-4 border-minecraft-wood">
            <DialogHeader>
              <DialogTitle className="text-xl font-pixel text-minecraft-gold">
                添加新打卡人
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                  名称
                </label>
                <Input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="输入打卡人名称"
                  className="minecraft-input font-pixel"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                  选择头像
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setSelectedAvatar('steve'); play('click'); }}
                    className={`relative w-20 h-20 border-4 rounded-lg overflow-hidden transition-all ${
                      selectedAvatar === 'steve' 
                        ? 'border-minecraft-diamond ring-2 ring-minecraft-diamond' 
                        : 'border-minecraft-stone hover:border-minecraft-iron'
                    }`}
                  >
                    <img 
                      src={DEFAULT_STEVE_AVATAR} 
                      alt="史蒂夫" 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 font-pixel">
                      史蒂夫
                    </span>
                  </button>
                  
                  <button
                    onClick={() => { setSelectedAvatar('alex'); play('click'); }}
                    className={`relative w-20 h-20 border-4 rounded-lg overflow-hidden transition-all ${
                      selectedAvatar === 'alex' 
                        ? 'border-minecraft-diamond ring-2 ring-minecraft-diamond' 
                        : 'border-minecraft-stone hover:border-minecraft-iron'
                    }`}
                  >
                    <img 
                      src={DEFAULT_ALEX_AVATAR} 
                      alt="艾利克斯" 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 font-pixel">
                      艾利克斯
                    </span>
                  </button>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-20 h-20 border-4 rounded-lg overflow-hidden transition-all flex items-center justify-center ${
                      selectedAvatar === 'custom' 
                        ? 'border-minecraft-diamond ring-2 ring-minecraft-diamond' 
                        : 'border-minecraft-stone hover:border-minecraft-iron'
                    }`}
                  >
                    {customAvatar ? (
                      <img 
                        src={customAvatar} 
                        alt="自定义" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="w-8 h-8 text-minecraft-stone" />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-1 font-pixel">
                      自定义
                    </span>
                  </button>
                </div>
              </div>
              
              <Button
                onClick={handleAddUser}
                disabled={!newUserName.trim()}
                className="w-full minecraft-btn bg-minecraft-diamond hover:bg-minecraft-diamond/90 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                确认添加
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 minecraft-panel border-4 border-dashed border-minecraft-stone/50">
          <UserIcon className="w-16 h-16 mx-auto text-minecraft-stone/50 mb-4" />
          <p className="font-pixel text-minecraft-stone">还没有打卡人</p>
          <p className="font-pixel text-sm text-minecraft-stone/70 mt-2">
            点击上方按钮添加第一个打卡人
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="minecraft-card border-4 border-minecraft-wood">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-16 h-16 rounded-lg border-2 border-minecraft-stone object-cover"
                    />
                    {user.streakDays > 0 && (
                      <div className="absolute -top-2 -right-2 bg-minecraft-gold text-white text-xs font-pixel px-2 py-1 rounded border-2 border-minecraft-wood">
                        {user.streakDays}天
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-pixel text-lg text-minecraft-grass truncate">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-pixel text-minecraft-gold">
                        {user.totalScore} 积分
                      </span>
                      <span className="text-xs font-pixel text-minecraft-diamond">
                        {user.reviveCards} 复活卡
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteUser(user.id)}
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
    </div>
  );
}
