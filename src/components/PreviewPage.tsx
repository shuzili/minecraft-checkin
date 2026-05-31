import { Sparkles, TrendingUp, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const leaderboard = [
  { name: 'Alex', score: 1240, streak: 17, color: '#52b788' },
  { name: 'Steve', score: 1180, streak: 15, color: '#4cc9f0' },
  { name: 'Ender', score: 980, streak: 9, color: '#f4a261' },
];

const quests = [
  { title: '早读 30 分钟', done: true },
  { title: '数学练习 20 题', done: false },
  { title: '英语单词 50 个', done: true },
];

export function PreviewPage() {
  return (
    <div className="preview-shell min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="preview-header mb-8">
          <Badge className="preview-badge mb-4">Preview Mode</Badge>
          <h1 className="preview-title">学习打卡可视化测试页</h1>
          <p className="preview-subtitle">用于快速查看主题、排版、按钮和卡片状态效果</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="minecraft-btn bg-minecraft-grass hover:bg-minecraft-grass/90">
              <Sparkles className="mr-2 h-4 w-4" />开始打卡
            </Button>
            <Button variant="outline" className="minecraft-btn border-minecraft-diamond text-minecraft-diamond">
              <Zap className="mr-2 h-4 w-4" />查看挑战
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="minecraft-card border-2 border-minecraft-gold/70">
            <CardHeader>
              <CardTitle className="font-pixel text-minecraft-gold flex items-center gap-2">
                <Trophy className="h-5 w-5" />今日绿宝石
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-pixel text-white">+86</div>
              <p className="mt-2 text-sm text-minecraft-stone">比昨日多 12 分</p>
            </CardContent>
          </Card>

          <Card className="minecraft-card border-2 border-minecraft-diamond/70">
            <CardHeader>
              <CardTitle className="font-pixel text-minecraft-diamond flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />连续天数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-pixel text-white">17</div>
              <p className="mt-2 text-sm text-minecraft-stone">距离下一奖励还差 3 天</p>
            </CardContent>
          </Card>

          <Card className="minecraft-card border-2 border-minecraft-emerald/70">
            <CardHeader>
              <CardTitle className="font-pixel text-minecraft-emerald flex items-center gap-2">
                <Sparkles className="h-5 w-5" />日挑战完成度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-2xl font-pixel text-white">66%</div>
              <Progress value={66} className="h-3" />
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="minecraft-card border-2 border-minecraft-stone/60">
            <CardHeader>
              <CardTitle className="font-pixel text-white">排行榜预览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.map((item, idx) => (
                <div key={item.name} className="preview-row">
                  <span className="font-pixel text-sm text-minecraft-stone">#{idx + 1}</span>
                  <span className="font-pixel text-white">{item.name}</span>
                  <span className="font-pixel" style={{ color: item.color }}>
                    {item.score}
                  </span>
                  <span className="font-pixel text-xs text-minecraft-stone">连续 {item.streak} 天</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="minecraft-card border-2 border-minecraft-stone/60">
            <CardHeader>
              <CardTitle className="font-pixel text-white">任务清单预览</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quests.map((quest) => (
                <div key={quest.title} className="preview-row">
                  <span className={`h-3 w-3 rounded-full ${quest.done ? 'bg-minecraft-emerald' : 'bg-minecraft-lava'}`} />
                  <span className="font-pixel text-white">{quest.title}</span>
                  <Badge variant="secondary" className="ml-auto font-pixel">
                    {quest.done ? '已完成' : '待完成'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

