import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, useLocation } from 'react-router-dom';
import './App.css';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// 页面组件
import Dashboard from './components/Dashboard';
import DataSourceList from './components/DataSourceList';
import DataSourceForm from './components/DataSourceForm';
import FileBrowser from './components/FileBrowser';
import MountManager from './components/MountManager';
import Settings from './components/Settings';
import SetPassword from './components/SetPassword';

// Wails API
import { SetMasterPassword, GetS3DataSources, IsAutoStartEnabled } from '../wailsjs/go/main/App';

// Icons
import { Cloud, FolderOpen, Settings as SettingsIcon, Home, Lock, Server } from 'lucide-react';

function Navigation() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      <Link
        to="/"
        className={`transition-colors flex items-center space-x-1 ${
          isActive('/')
            ? 'text-foreground'
            : 'text-foreground/60 hover:text-foreground/80'
        }`}
      >
        <Home className="h-4 w-4" />
        <span>仪表盘</span>
      </Link>
      <Link
        to="/data-sources"
        className={`transition-colors flex items-center space-x-1 ${
          isActive('/data-sources') || location.pathname.startsWith('/data-sources/')
            ? 'text-foreground'
            : 'text-foreground/60 hover:text-foreground/80'
        }`}
      >
        <Server className="h-4 w-4" />
        <span>数据源</span>
      </Link>
      <Link
        to="/mounts"
        className={`transition-colors flex items-center space-x-1 ${
          isActive('/mounts')
            ? 'text-foreground'
            : 'text-foreground/60 hover:text-foreground/80'
        }`}
      >
        <FolderOpen className="h-4 w-4" />
        <span>挂载管理</span>
      </Link>
      <Link
        to="/settings"
        className={`transition-colors flex items-center space-x-1 ${
          isActive('/settings')
            ? 'text-foreground'
            : 'text-foreground/60 hover:text-foreground/80'
        }`}
      >
        <SettingsIcon className="h-4 w-4" />
        <span>设置</span>
      </Link>
    </nav>
  );
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // 尝试获取数据源列表来检查是否需要密码
      await GetS3DataSources();
      setIsInitialized(true);
    } catch (err) {
      if (err.message && err.message.includes('配置未初始化')) {
        setNeedsPassword(true);
      }
      setIsInitialized(true);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await SetMasterPassword(masterPassword);
      setNeedsPassword(false);
    } catch (err) {
      setError('设置主密码失败: ' + err.message);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground">正在初始化...</div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">设置主密码</CardTitle>
            <CardDescription>
              主密码用于加密您的所有配置信息，请妥善保管
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="masterPassword">主密码</Label>
                <Input
                  id="masterPassword"
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  placeholder="请输入主密码"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                设置密码
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen">
        {/* 导航栏 */}
        <header className="border-b border-white/10 bg-background/80 backdrop-blur-md px-4" style={{ WebkitAppRegion: 'drag', WebkitUserSelect: 'none' }}>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2" style={{ WebkitAppRegion: 'drag', WebkitUserSelect: 'none' }}>
              <Cloud className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">RMount</h1>
            </div>
            <div className="flex items-center space-x-4" style={{ WebkitAppRegion: 'no-drag' }}>
              <Navigation />
            </div>
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="container py-8">
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <Route exact path="/data-sources" component={DataSourceList} />
            <Route path="/data-sources/add" component={DataSourceForm} />
            <Route path="/data-sources/:name/browse" component={FileBrowser} />
            <Route path="/mounts" component={MountManager} />
            <Route path="/settings" component={Settings} />
            <Route path="/set-password" component={SetPassword} />
          </Switch>
        </main>
      </div>
    </Router>
  );
}

export default App;
