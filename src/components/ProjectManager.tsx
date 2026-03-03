import { useState } from 'react';
import type { CheckInProject } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Settings, Book, Diamond, CircleDollarSign, Sprout } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectManagerProps {
  projects: CheckInProject[];
  onAddProject: (project: Omit<CheckInProject, 'id'>) => void;
  onDeleteProject: (projectId: string) => void;
}

const ICONS = {
  book: Book,
  diamond: Diamond,
  gold: CircleDollarSign,
  grass: Sprout
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

export function ProjectManager({ projects, onAddProject, onDeleteProject }: ProjectManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState<Partial<CheckInProject>>({
    name: '',
    description: '',
    rule: 'daily',
    scorePerCheckIn: 10,
    streakTarget: 7,
    streakBonusScore: 50,
    streakBonusReviveCards: 1,
    icon: 'book',
    color: '#5d8c37'
  });
  const { play } = useSound();

  const handleAddProject = () => {
    if (!newProject.name?.trim()) return;
    
    onAddProject(newProject as Omit<CheckInProject, 'id'>);
    play('success');
    setNewProject({
      name: '',
      description: '',
      rule: 'daily',
      scorePerCheckIn: 10,
      streakTarget: 7,
      streakBonusScore: 50,
      streakBonusReviveCards: 1,
      icon: 'book',
      color: '#5d8c37'
    });
    setDialogOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('确定要删除这个打卡项目吗？')) {
      onDeleteProject(projectId);
      play('pop');
    }
  };

  const getRuleText = (rule: string, weeklyCount?: number) => {
    switch (rule) {
      case 'daily':
        return '每日一次';
      case 'weekly':
        return `每周${weeklyCount || 3}次`;
      case 'custom':
        return '自定义';
      default:
        return rule;
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = ICONS[iconName as keyof typeof ICONS] || Book;
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-pixel text-minecraft-diamond flex items-center gap-2">
          <Settings className="w-6 h-6" />
          打卡项目管理
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90"
              onClick={() => play('click')}
            >
              <Plus className="w-4 h-4 mr-2" />
              添加项目
            </Button>
          </DialogTrigger>
          <DialogContent className="minecraft-panel border-4 border-minecraft-wood max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-pixel text-minecraft-gold">
                添加新打卡项目
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                  项目名称
                </label>
                <Input
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="例如：每日阅读"
                  className="minecraft-input font-pixel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                  项目描述
                </label>
                <Input
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="简单描述这个项目"
                  className="minecraft-input font-pixel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                  打卡规则
                </label>
                <Select
                  value={newProject.rule}
                  onValueChange={(value) => setNewProject({ ...newProject, rule: value as any })}
                >
                  <SelectTrigger className="minecraft-input font-pixel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="minecraft-panel">
                    <SelectItem value="daily" className="font-pixel">每日一次</SelectItem>
                    <SelectItem value="weekly" className="font-pixel">每周多次</SelectItem>
                    <SelectItem value="custom" className="font-pixel">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newProject.rule === 'weekly' && (
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    每周次数
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={newProject.weeklyCount || 3}
                    onChange={(e) => setNewProject({ ...newProject, weeklyCount: parseInt(e.target.value) })}
                    className="minecraft-input font-pixel"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                  每次打卡积分
                </label>
                <Input
                  type="number"
                  min={1}
                  value={newProject.scorePerCheckIn}
                  onChange={(e) => setNewProject({ ...newProject, scorePerCheckIn: parseInt(e.target.value) })}
                  className="minecraft-input font-pixel"
                />
              </div>
              
              <div className="border-2 border-minecraft-gold/30 rounded-lg p-4 space-y-4">
                <h4 className="font-pixel text-minecraft-gold flex items-center gap-2">
                  <Diamond className="w-4 h-4" />
                  连续打卡奖励
                </h4>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    目标天数
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={newProject.streakTarget}
                    onChange={(e) => setNewProject({ ...newProject, streakTarget: parseInt(e.target.value) })}
                    className="minecraft-input font-pixel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    奖励积分
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={newProject.streakBonusScore}
                    onChange={(e) => setNewProject({ ...newProject, streakBonusScore: parseInt(e.target.value) })}
                    className="minecraft-input font-pixel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-pixel mb-2 text-minecraft-stone">
                    奖励复活卡
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={newProject.streakBonusReviveCards}
                    onChange={(e) => setNewProject({ ...newProject, streakBonusReviveCards: parseInt(e.target.value) })}
                    className="minecraft-input font-pixel"
                  />
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
                      onClick={() => { setNewProject({ ...newProject, icon: key }); play('click'); }}
                      className={`w-12 h-12 border-4 rounded-lg flex items-center justify-center transition-all ${
                        newProject.icon === key 
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
                      onClick={() => { setNewProject({ ...newProject, color: color.value }); play('click'); }}
                      className={`w-10 h-10 border-4 rounded-lg transition-all ${
                        newProject.color === color.value 
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
                onClick={handleAddProject}
                disabled={!newProject.name?.trim()}
                className="w-full minecraft-btn bg-minecraft-diamond hover:bg-minecraft-diamond/90 disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                确认添加
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 minecraft-panel border-4 border-dashed border-minecraft-stone/50">
          <Settings className="w-16 h-16 mx-auto text-minecraft-stone/50 mb-4" />
          <p className="font-pixel text-minecraft-stone">还没有打卡项目</p>
          <p className="font-pixel text-sm text-minecraft-stone/70 mt-2">
            点击上方按钮添加第一个项目
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="minecraft-card border-4"
              style={{ borderColor: project.color }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-14 h-14 rounded-lg border-2 border-minecraft-stone flex items-center justify-center shrink-0"
                    style={{ backgroundColor: project.color + '30' }}
                  >
                    <div style={{ color: project.color }}>
                      {getIconComponent(project.icon)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-pixel text-lg truncate" style={{ color: project.color }}>
                      {project.name}
                    </h3>
                    <p className="text-xs text-minecraft-stone mt-1 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs font-pixel bg-minecraft-stone/20 px-2 py-1 rounded">
                        {getRuleText(project.rule, project.weeklyCount)}
                      </span>
                      <span className="text-xs font-pixel bg-minecraft-gold/20 text-minecraft-gold px-2 py-1 rounded">
                        +{project.scorePerCheckIn}分
                      </span>
                      <span className="text-xs font-pixel bg-minecraft-diamond/20 text-minecraft-diamond px-2 py-1 rounded">
                        {project.streakTarget}天奖
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteProject(project.id)}
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
