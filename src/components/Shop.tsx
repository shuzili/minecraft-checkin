import { useState } from 'react';
import type { User, ShopItem, RedemptionRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Plus, Trash2, History, Diamond, CircleDollarSign, Book, Sprout, Package } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { useConfetti } from '@/hooks/useConfetti';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShopProps {
  users: User[];
  shopItems: ShopItem[];
  redemptionRecords: RedemptionRecord[];
  onAddShopItem: (item: Omit<ShopItem, 'id'>) => void;
  onDeleteShopItem: (itemId: string) => void;
  onRedeemItem: (userId: string, itemId: string) => void;
}

const ICONS = {
  book: Book,
  diamond: Diamond,
  gold: CircleDollarSign,
  grass: Sprout,
  package: Package
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

export function Shop({ 
  users, 
  shopItems, 
  redemptionRecords,
  onAddShopItem, 
  onDeleteShopItem, 
  onRedeemItem 
}: ShopProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [redeemQuantity, setRedeemQuantity] = useState<number>(1);
  const [newItem, setNewItem] = useState<Partial<ShopItem>>({
    name: '',
    description: '',
    cost: 100,
    icon: 'package',
    color: '#5d8c37',
    stock: 10,
    unlimited: false
  });
  const { play } = useSound();
  const { shopRedeem } = useConfetti();

  const handleAddItem = () => {
    if (!newItem.name?.trim()) return;
    
    onAddShopItem(newItem as Omit<ShopItem, 'id'>);
    play('success');
    setNewItem({
      name: '',
      description: '',
      cost: 100,
      icon: 'package',
      color: '#5d8c37',
      stock: 10,
      unlimited: false
    });
    setDialogOpen(false);
  };

  const handleRedeem = () => {
    if (!selectedUser || !selectedItem || redeemQuantity <= 0) return;
    
    const user = users.find(u => u.id === selectedUser);
    const totalCost = selectedItem.cost * redeemQuantity;
    if (!user || user.totalScore < totalCost) return;
    if (!selectedItem.unlimited && selectedItem.stock < redeemQuantity) return;

    onRedeemItem(selectedUser, selectedItem.id, redeemQuantity);
    play('coin');
    shopRedeem();
    setRedeemDialogOpen(false);
    setSelectedItem(null);
    setSelectedUser('');
    setRedeemQuantity(1);
  };

  const openRedeemDialog = (item: ShopItem) => {
    setSelectedItem(item);
    setRedeemQuantity(1);
    setRedeemDialogOpen(true);
    play('click');
  };

  const getIconComponent = (iconName: string) => {
    const Icon = ICONS[iconName as keyof typeof ICONS] || Package;
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-pixel text-minecraft-gold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          积分商城
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setHistoryDialogOpen(true); play('click'); }}
            className="minecraft-btn border-minecraft-stone"
          >
            <History className="w-4 h-4 mr-2" />
            兑换记录
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90"
                onClick={() => play('click')}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加商品
              </Button>
            </DialogTrigger>
            <DialogContent className="minecraft-panel border-4 border-minecraft-wood max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-pixel text-minecraft-gold">
                  添加新商品
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    商品名称
                  </label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="例如：游戏时间"
                    className="minecraft-input font-pixel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    商品描述
                  </label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="简单描述这个商品"
                    className="minecraft-input font-pixel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    所需积分
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={newItem.cost}
                    onChange={(e) => setNewItem({ ...newItem, cost: parseInt(e.target.value) })}
                    className="minecraft-input font-pixel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    库存
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={newItem.stock}
                      onChange={(e) => setNewItem({ ...newItem, stock: parseInt(e.target.value) })}
                      disabled={newItem.unlimited}
                      className="minecraft-input font-pixel"
                    />
                    <label className="flex items-center gap-2 font-pixel text-sm">
                      <input
                        type="checkbox"
                        checked={newItem.unlimited}
                        onChange={(e) => setNewItem({ ...newItem, unlimited: e.target.checked })}
                        className="w-4 h-4"
                      />
                      无限
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    图标
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(ICONS).map(([key, Icon]) => (
                      <button
                        key={key}
                        onClick={() => { setNewItem({ ...newItem, icon: key }); play('click'); }}
                        className={`w-12 h-12 border-4 rounded-lg flex items-center justify-center transition-all ${
                          newItem.icon === key 
                            ? 'border-minecraft-diamond bg-minecraft-diamond/20' 
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
                        onClick={() => { setNewItem({ ...newItem, color: color.value }); play('click'); }}
                        className={`w-10 h-10 border-4 rounded-lg transition-all ${
                          newItem.color === color.value 
                            ? 'border-minecraft-diamond ring-2 ring-minecraft-diamond' 
                            : 'border-minecraft-stone hover:border-minecraft-iron'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                
                <Button
                  onClick={handleAddItem}
                  disabled={!newItem.name?.trim()}
                  className="w-full minecraft-btn bg-minecraft-diamond hover:bg-minecraft-diamond/90 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  确认添加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {shopItems.length === 0 ? (
        <div className="text-center py-8 minecraft-panel border-4 border-dashed border-minecraft-stone/50">
          <ShoppingCart className="w-16 h-16 mx-auto text-minecraft-stone/50 mb-4" />
          <p className="font-pixel text-minecraft-stone">商城暂无商品</p>
          <p className="font-pixel text-sm text-minecraft-stone/70 mt-2">
            点击上方按钮添加商品
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopItems.map((item) => (
            <Card 
              key={item.id} 
              className="minecraft-card border-4"
              style={{ borderColor: item.color }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-14 h-14 rounded-lg border-2 border-minecraft-stone flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.color + '30' }}
                  >
                    <div style={{ color: item.color }}>
                      {getIconComponent(item.icon)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-pixel text-lg truncate" style={{ color: item.color }}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-minecraft-stone mt-1 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-pixel text-minecraft-gold">
                        {item.cost}
                      </span>
                      <span className="text-xs font-pixel text-minecraft-stone">积分</span>
                      {!item.unlimited && (
                        <span className="text-xs font-pixel text-minecraft-stone ml-auto">
                          库存: {item.stock}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => openRedeemDialog(item)}
                    disabled={!item.unlimited && item.stock <= 0}
                    className="flex-1 minecraft-btn bg-minecraft-gold hover:bg-minecraft-gold/90 disabled:opacity-50"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    兑换
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { onDeleteShopItem(item.id); play('pop'); }}
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

      {/* 兑换弹窗 */}
      <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-gold">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-gold">
              兑换商品
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 pt-4">
              <div 
                className="p-4 rounded-lg border-2"
                style={{ borderColor: selectedItem.color, backgroundColor: selectedItem.color + '15' }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ color: selectedItem.color }}>
                    {getIconComponent(selectedItem.icon)}
                  </div>
                  <div>
                    <h4 className="font-pixel" style={{ color: selectedItem.color }}>
                      {selectedItem.name}
                    </h4>
                    <p className="text-xs text-minecraft-stone">{selectedItem.description}</p>
                  </div>
                  <div className="ml-auto text-lg font-pixel text-minecraft-gold">
                    {selectedItem.cost} 积分
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
                  <SelectContent className="minecraft-panel" position="popper" sideOffset={4}>
                    {users.length === 0 ? (
                      <div className="p-2 text-center text-minecraft-stone font-pixel text-sm">
                        暂无用户，请先添加用户
                      </div>
                    ) : (
                      users.map(user => (
                        <SelectItem 
                          key={user.id} 
                          value={user.id} 
                          className="font-pixel"
                          disabled={user.totalScore < selectedItem.cost * redeemQuantity}
                        >
                          {user.name} (积分: {user.totalScore})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                  兑换数量
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRedeemQuantity(Math.max(1, redeemQuantity - 1))}
                    className="minecraft-btn border-minecraft-stone"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={redeemQuantity}
                    onChange={(e) => setRedeemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="minecraft-input font-pixel text-center w-20"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRedeemQuantity(redeemQuantity + 1)}
                    className="minecraft-btn border-minecraft-stone"
                  >
                    +
                  </Button>
                  <span className="text-sm font-pixel text-minecraft-stone ml-2">
                    共 {selectedItem.cost * redeemQuantity} 积分
                  </span>
                </div>
              </div>

              <Button
                onClick={handleRedeem}
                disabled={!selectedUser}
                className="w-full minecraft-btn bg-minecraft-gold hover:bg-minecraft-gold/90 disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                确认兑换
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 兑换记录弹窗 */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="minecraft-panel border-4 border-minecraft-wood max-w-lg max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-pixel text-minecraft-gold flex items-center gap-2">
              <History className="w-6 h-6" />
              兑换记录
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] space-y-2 mt-4">
            {redemptionRecords.length === 0 ? (
              <div className="text-center py-8 text-minecraft-stone font-pixel">
                暂无兑换记录
              </div>
            ) : (
              [...redemptionRecords].reverse().map((record) => (
                <div 
                  key={record.id}
                  className="p-3 border-2 border-minecraft-stone/30 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-pixel text-sm">{record.userName}</div>
                    <div className="text-xs text-minecraft-stone">{record.date}</div>
                    <div className="text-xs text-minecraft-stone/70">{record.itemName}</div>
                  </div>
                  <div className="font-pixel text-minecraft-gold">
                    -{record.cost}
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
