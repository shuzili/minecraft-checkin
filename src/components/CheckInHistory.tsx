import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Trash2, 
  Filter,
  User,
  CheckCircle,
  AlertTriangle,
  Search,
  X
} from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import type { User as UserType, CheckInRecord } from '@/types';

interface CheckInHistoryProps {
  users: UserType[];
  onDeleteRecord: (userId: string, recordIndex: number) => void;
}

export function CheckInHistory({ users, onDeleteRecord }: CheckInHistoryProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchText, setSearchText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<{ userId: string; index: number; record: CheckInRecord } | null>(null);
  const { play } = useSound();

  const filteredRecords = useMemo(() => {
    let records: { userId: string; userName: string; index: number; record: CheckInRecord }[] = [];

    users.forEach(user => {
      if (selectedUserId !== 'all' && user.id !== selectedUserId) return;

      user.checkInHistory.forEach((record, index) => {
        records.push({
          userId: user.id,
          userName: user.name,
          index,
          record
        });
      });
    });

    if (startDate) {
      records = records.filter(r => r.record.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.record.date <= endDate);
    }
    if (searchText) {
      const search = searchText.toLowerCase();
      records = records.filter(r => 
        r.record.projectName.toLowerCase().includes(search) ||
        r.userName.toLowerCase().includes(search)
      );
    }

    return records.sort((a, b) => b.record.date.localeCompare(a.record.date));
  }, [users, selectedUserId, startDate, endDate, searchText]);

  const totalScore = filteredRecords.reduce((sum, r) => sum + r.record.score, 0);

  const handleDeleteClick = (userId: string, index: number, record: CheckInRecord) => {
    setRecordToDelete({ userId, index, record });
    setDeleteDialogOpen(true);
    play('click');
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      onDeleteRecord(recordToDelete.userId, recordToDelete.index);
      play('success');
    }
    setDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchText('');
    setSelectedUserId('all');
    play('click');
  };

  const hasFilters = selectedUserId !== 'all' || startDate || endDate || searchText;

  return (
    <div className="space-y-4">
      <Card className="minecraft-card border-4 border-minecraft-diamond">
        <CardHeader>
          <CardTitle className="font-pixel text-minecraft-diamond flex items-center gap-2">
            <Filter className="w-5 h-5" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
              选择用户
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => { setSelectedUserId(e.target.value); play('click'); }}
              className="w-full p-2 rounded-lg bg-[#1a1a2e] border-2 border-minecraft-stone/30 text-white font-pixel"
            >
              <option value="all">全部用户</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                开始日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); play('click'); }}
                className="w-full p-2 rounded-lg bg-[#1a1a2e] border-2 border-minecraft-stone/30 text-white font-pixel"
              />
            </div>
            <div>
              <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                结束日期
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); play('click'); }}
                className="w-full p-2 rounded-lg bg-[#1a1a2e] border-2 border-minecraft-stone/30 text-white font-pixel"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
              搜索项目
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-minecraft-stone" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); play('click'); }}
                placeholder="输入项目名称搜索..."
                className="w-full pl-10 p-2 rounded-lg bg-[#1a1a2e] border-2 border-minecraft-stone/30 text-white font-pixel"
              />
              {searchText && (
                <button
                  onClick={() => { setSearchText(''); play('click'); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-minecraft-stone hover:text-white" />
                </button>
              )}
            </div>
          </div>

          {hasFilters && (
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full minecraft-btn border-minecraft-stone"
            >
              <X className="w-4 h-4 mr-2" />
              清除筛选
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="minecraft-card border-4 border-minecraft-grass">
        <CardHeader>
          <CardTitle className="font-pixel text-minecraft-grass flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              打卡记录
            </div>
            <span className="text-sm font-normal text-minecraft-stone">
              共 {filteredRecords.length} 条 · 积分 {totalScore}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-minecraft-stone/30 mb-2" />
              <p className="font-pixel text-minecraft-stone">暂无打卡记录</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredRecords.map((item, idx) => (
                <div
                  key={`${item.userId}-${item.index}-${idx}`}
                  className="flex items-center justify-between p-3 bg-minecraft-grass/10 rounded-lg border border-minecraft-grass/30"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-minecraft-grass/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-minecraft-grass" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-pixel text-white truncate">{item.record.projectName}</p>
                      <div className="flex items-center gap-2 text-xs font-pixel text-minecraft-stone">
                        <User className="w-3 h-3" />
                        <span>{item.userName}</span>
                        <Calendar className="w-3 h-3 ml-2" />
                        <span>{item.record.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-pixel text-minecraft-gold text-lg">+{item.record.score}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteClick(item.userId, item.index, item.record)}
                      className="h-8 w-8 text-minecraft-lava hover:bg-minecraft-lava/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {deleteDialogOpen && recordToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2d2d44] border-4 border-minecraft-lava rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-minecraft-lava" />
              <h3 className="text-xl font-pixel text-minecraft-lava">确认删除</h3>
            </div>
            <div className="bg-minecraft-lava/10 border-2 border-minecraft-lava rounded-lg p-4 mb-4">
              <p className="font-pixel text-white">项目：{recordToDelete.record.projectName}</p>
              <p className="font-pixel text-sm text-minecraft-stone mt-1">日期：{recordToDelete.record.date}</p>
              <p className="font-pixel text-sm text-minecraft-gold mt-1">将扣除积分：{recordToDelete.record.score}</p>
            </div>
            <p className="font-pixel text-minecraft-stone text-sm mb-4">
              此操作将删除打卡记录并回滚积分，不可恢复！
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => { setDeleteDialogOpen(false); setRecordToDelete(null); play('click'); }}
                variant="outline"
                className="flex-1 minecraft-btn border-minecraft-stone"
              >
                取消
              </Button>
              <Button
                onClick={confirmDelete}
                className="flex-1 minecraft-btn bg-minecraft-lava hover:bg-minecraft-lava/90"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
