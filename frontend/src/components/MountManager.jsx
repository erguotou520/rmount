import React, { useState, useEffect } from 'react';
import { GetMounts, Mount, Unmount } from '../../wailsjs/go/main/App';
import { GetS3DataSources } from '../../wailsjs/go/main/App';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Icons
import { FolderOpen, ExternalLink, Trash2, Server, HardDrive, AlertCircle } from 'lucide-react';

function MountManager() {
  const [mounts, setMounts] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [remotePath, setRemotePath] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mountList, sourceList] = await Promise.all([
        GetMounts(),
        GetS3DataSources()
      ]);

      setMounts(mountList || []);
      setDataSources(sourceList || []);
    } catch (err) {
      setError('加载数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMount = async () => {
    if (!selectedSource) {
      setError('请选择数据源');
      return;
    }

    try {
      setError('');
      await Mount(selectedSource, remotePath);
      await loadData(); // 重新加载挂载列表
    } catch (err) {
      setError('挂载失败: ' + err.message);
    }
  };

  const handleUnmount = async (mountName) => {
    try {
      setError('');
      await Unmount(mountName);
      await loadData(); // 重新加载挂载列表
    } catch (err) {
      setError('卸载失败: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">挂载管理</h1>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 挂载表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5" />
            <span>创建挂载</span>
          </CardTitle>
          <CardDescription>
            选择数据源并配置远程路径来创建新的挂载
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataSource">数据源</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="选择数据源" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((source) => (
                    <SelectItem key={source.id} value={source.name}>
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4" />
                        <span>{source.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remotePath">远程路径</Label>
              <Input
                id="remotePath"
                type="text"
                value={remotePath}
                onChange={(e) => setRemotePath(e.target.value)}
                placeholder="例如：/ 或 /bucket-name"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleMount}
                disabled={!selectedSource}
                className="w-full"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                挂载
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 挂载列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>当前挂载</span>
            </span>
            <Badge variant="secondary">{mounts.length} 个挂载</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HardDrive className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>暂无挂载</p>
              <p className="text-sm mt-2">选择数据源并点击"挂载"按钮开始使用</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>数据源</TableHead>
                  <TableHead>远程路径</TableHead>
                  <TableHead>本地路径</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mounts.map((mount) => (
                  <TableRow key={mount.name}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{mount.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {mount.Remote || '/'}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{mount.LocalPath}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={mount.Status === 'mounted' ? 'default' : 'secondary'}>
                        {mount.Status === 'mounted' ? '已挂载' : mount.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`file://${mount.LocalPath}`)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span className="sr-only">打开</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnmount(mount.name)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">卸载</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                <p>挂载成功后，您可以在本地文件系统中访问云存储文件</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                <p>点击"打开"按钮可以在访达中打开挂载点</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                <p>使用完毕后请及时卸载以释放系统资源</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                <p>挂载点默认位于 ~/mounts/数据源名称</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MountManager;