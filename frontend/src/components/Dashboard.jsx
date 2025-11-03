import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GetS3DataSources, GetMounts } from '../../wailsjs/go/main/App';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Icons
import { Database, HardDrive, FileText, CheckCircle, Folder, Plus, ArrowRight } from 'lucide-react';

function Dashboard() {
  const [dataSources, setDataSources] = useState([]);
  const [mounts, setMounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sources, mountList] = await Promise.all([
        GetS3DataSources(),
        GetMounts()
      ]);

      setDataSources(sources || []);
      setMounts(mountList || []);
    } catch (err) {
      setError('加载数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground">欢迎使用 RMount 云存储管理器</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">数据源数量</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataSources.length}</div>
            <p className="text-xs text-muted-foreground">已配置的存储源</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已挂载</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mounts.length}</div>
            <p className="text-xs text-muted-foreground">活动挂载点</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总存储</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">统计中</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统状态</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">正常</div>
            <p className="text-xs text-muted-foreground">所有服务运行正常</p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 数据源管理 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>数据源管理</CardTitle>
              <Button asChild>
                <Link to="/data-sources/add">
                  <Plus className="h-4 w-4 mr-2" />
                  添加数据源
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dataSources.length === 0 ? (
              <div className="text-center py-8">
                <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">暂无数据源</p>
                <p className="text-sm text-muted-foreground">点击上方按钮添加您的第一个S3数据源</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dataSources.slice(0, 3).map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{source.name}</h3>
                      <p className="text-sm text-muted-foreground">{source.endpoint || source.region}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/data-sources/${source.name}/browse`}>
                        <Folder className="h-4 w-4 mr-1" />
                        浏览
                      </Link>
                    </Button>
                  </div>
                ))}
                {dataSources.length > 3 && (
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/data-sources">
                      查看全部 ({dataSources.length} 个数据源)
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 挂载状态 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>挂载状态</CardTitle>
              <Button variant="outline" asChild>
                <Link to="/mounts">
                  管理挂载
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {mounts.length === 0 ? (
              <div className="text-center py-8">
                <HardDrive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">暂无挂载</p>
                <p className="text-sm text-muted-foreground">将您的云存储挂载到本地文件系统</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mounts.map((mount) => (
                  <div key={mount.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{mount.name}</h3>
                      <p className="text-sm text-muted-foreground">{mount.localPath}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        已挂载
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;