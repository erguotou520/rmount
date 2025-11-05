import React, { useState, useEffect } from 'react';
import { SetGistConfig, GetGistConfig, SyncToGist, SetAutoStart, IsAutoStartEnabled, IsPasswordSet } from '../../wailsjs/go/main/App';
import { Link } from 'react-router-dom';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

// Icons
import { Cloud, Settings as SettingsIcon, Github, Info, CheckCircle, AlertCircle, Lock } from 'lucide-react';

function Settings() {
  const [activeTab, setActiveTab] = useState('gist');
  const [gistForm, setGistForm] = useState({
    apiToken: '',
    gistId: ''
  });
  const [hasGistToken, setHasGistToken] = useState(false);
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [enabled, isPasswordSet, gistConfig] = await Promise.all([
        IsAutoStartEnabled(),
        IsPasswordSet(),
        GetGistConfig()
      ]);

      setAutoStartEnabled(enabled);
      setPasswordSet(isPasswordSet);

      if (gistConfig) {
        const [apiToken, gistId, hasToken] = gistConfig;
        setGistForm(prev => ({
          ...prev,
          apiToken: apiToken || '',
          gistId: gistId || ''
        }));
        setHasGistToken(hasToken);
        setIsEditingToken(!hasToken);
      }
    } catch (err) {
      console.error('加载设置失败:', err);
    }
  };

  const handleGistSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await SetGistConfig(gistForm.apiToken, gistForm.gistId);
      setSuccess('Gist配置保存成功！');
      setIsEditingToken(false);

      // 重新加载配置以获取脱敏显示
      await loadSettings();
    } catch (err) {
      console.error('SetGistConfig error:', err);
      const errorMessage = err?.message || err?.toString() || '未知错误';
      setError('保存Gist配置失败: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToken = () => {
    setIsEditingToken(true);
    setGistForm(prev => ({ ...prev, apiToken: '' })); // 清空token输入框
  };

  const handleSyncToGist = async () => {
    if (!gistForm.apiToken) {
      setError('请先配置Gist API Token');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await SyncToGist();
      setSuccess('配置同步成功！');
    } catch (err) {
      console.error('SyncToGist error:', err);
      const errorMessage = err?.message || err?.toString() || '未知错误';
      setError('同步失败: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoStartChange = async (enabled) => {
    setLoading(true);
    setError('');

    try {
      await SetAutoStart(enabled);
      setAutoStartEnabled(enabled);
      setSuccess('自启动设置已更新！');
    } catch (err) {
      console.error('SetAutoStart error:', err);
      const errorMessage = err?.message || err?.toString() || '未知错误';
      setError('设置自启动失败: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">设置</h1>
          <p className="text-muted-foreground">管理应用程序配置和系统设置</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gist" className="flex items-center space-x-2">
            <Github className="h-4 w-4" />
            <span>配置同步</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <SettingsIcon className="h-4 w-4" />
            <span>系统设置</span>
          </TabsTrigger>
        </TabsList>

        {/* 配置同步标签页 */}
        <TabsContent value="gist" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Cloud className="h-5 w-5" />
                <CardTitle>GitHub Gist 配置同步</CardTitle>
              </div>
              <CardDescription>
                将您的配置加密备份到 GitHub Gist，方便在多台设备间同步配置。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGistSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="apiToken">GitHub API Token</Label>
                  {hasGistToken && !isEditingToken ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        id="apiToken"
                        type="text"
                        value={gistForm.apiToken}
                        readOnly
                        className="bg-muted"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEditToken}
                      >
                        修改
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id="apiToken"
                      type="password"
                      value={gistForm.apiToken}
                      onChange={(e) => setGistForm(prev => ({ ...prev, apiToken: e.target.value }))}
                      placeholder="ghp_xxxxxxxxxxxx"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    在 GitHub Settings &gt; Developer settings &gt; Personal access tokens 中创建
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gistId">Gist ID (可选)</Label>
                  <Input
                    id="gistId"
                    value={gistForm.gistId}
                    onChange={(e) => setGistForm(prev => ({ ...prev, gistId: e.target.value }))}
                    placeholder="留空将自动创建新的 Gist"
                  />
                  <p className="text-xs text-muted-foreground">
                    用于同步现有 Gist，留空将创建新的私有 Gist
                  </p>
                </div>

                <div className="flex space-x-4">
                  {(!hasGistToken || isEditingToken) && (
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? '保存中...' : '保存配置'}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSyncToGist}
                    disabled={loading || !hasGistToken}
                  >
                    {loading ? '同步中...' : '立即同步'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 同步说明 */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <CardTitle>同步说明</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• 配置使用 AES-256 加密后存储到 GitHub Gist</p>
                <p>• 主密码不会同步，请在每台设备上单独设置</p>
                <p>• 建议定期手动同步以确保配置备份最新</p>
                <p>• 请妥善保管 GitHub API Token，它具有访问您 Gist 的权限</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统设置标签页 */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>系统设置</CardTitle>
              <CardDescription>
                配置应用程序的系统行为和启动选项
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 开机自启动 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autostart">开机自启动</Label>
                    <p className="text-sm text-muted-foreground">
                      启动后自动运行 RMount 应用程序
                    </p>
                  </div>
                  <Switch
                    id="autostart"
                    checked={autoStartEnabled}
                    onCheckedChange={handleAutoStartChange}
                    disabled={loading}
                  />
                </div>

                {/* 主密码设置 */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4" />
                      <Label>主密码</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {passwordSet ? '主密码已设置' : '请设置主密码以保护配置数据'}
                    </p>
                  </div>
                  {passwordSet ? (
                    <Button variant="outline" size="sm">
                      修改密码
                    </Button>
                  ) : (
                    <Button size="sm" asChild>
                      <Link to="/set-password">
                        设置密码
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-3">应用信息</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>版本: 1.0.0</p>
                    <p>构建: Wails v2 + React</p>
                    <p>数据存储: ~/.rmount/</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <CardTitle>使用说明</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• 本应用内置 S3 客户端，无需安装 rclone</p>
                <p>• 挂载功能需要 macOS 10.15+ 版本支持</p>
                <p>• 建议使用稳定的网络连接进行文件操作</p>
                <p>• 大文件操作时请耐心等待完成</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Settings;