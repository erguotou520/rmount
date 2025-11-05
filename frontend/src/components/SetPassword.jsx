import React, { useState } from 'react';
import { SetMasterPassword } from '../../wailsjs/go/main/App';
import { useHistory } from 'react-router-dom';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Icons
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

function SetPassword() {
  const history = useHistory();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    try {
      setLoading(true);
      await SetMasterPassword(password);
      setSuccess('主密码设置成功！');
      setTimeout(() => {
        history.push('/settings');
      }, 2000);
    } catch (err) {
      console.error('Set password error:', err);
      const errorMessage = err?.message || err?.toString() || '未知错误';
      setError('设置主密码失败: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => history.push('/settings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold">设置主密码</h1>
          <p className="text-muted-foreground">主密码用于加密您的所有配置信息</p>
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

      <Card className="w-full max-w-md mx-auto">
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">主密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入主密码"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入主密码"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '设置中...' : '设置密码'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default SetPassword;