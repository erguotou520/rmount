import React, { useState, useEffect } from 'react';
import { SetGistConfig, SyncToGist, SetAutoStart, IsAutoStartEnabled } from '../../wailsjs/go/main/App';

function Settings() {
  const [activeTab, setActiveTab] = useState('gist');
  const [gistForm, setGistForm] = useState({
    apiToken: '',
    gistId: ''
  });
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const enabled = await IsAutoStartEnabled();
      setAutoStartEnabled(enabled);
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
    } catch (err) {
      setError('保存Gist配置失败: ' + err.message);
    } finally {
      setLoading(false);
    }
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
      setError('同步失败: ' + err.message);
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
      setError('设置自启动失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">设置</h1>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-600 text-white p-4 rounded-lg">
          {success}
        </div>
      )}

      {/* 标签页导航 */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('gist')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'gist'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            配置同步
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            系统设置
          </button>
        </nav>
      </div>

      {/* 配置同步标签页 */}
      {activeTab === 'gist' && (
        <div className="space-y-6">
          <div className="bg-gray-800 shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Gist 配置同步</h2>
            <p className="text-gray-400 mb-6">
              将您的配置加密备份到 GitHub Gist，方便在多台设备间同步配置。
            </p>

            <form onSubmit={handleGistSubmit} className="space-y-6">
              <div>
                <label htmlFor="apiToken" className="block text-sm font-medium text-gray-300 mb-2">
                  GitHub API Token
                </label>
                <input
                  type="password"
                  id="apiToken"
                  value={gistForm.apiToken}
                  onChange={(e) => setGistForm(prev => ({ ...prev, apiToken: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="ghp_xxxxxxxxxxxx"
                />
                <p className="mt-1 text-sm text-gray-400">
                  在 GitHub Settings > Developer settings > Personal access tokens 中创建
                </p>
              </div>

              <div>
                <label htmlFor="gistId" className="block text-sm font-medium text-gray-300 mb-2">
                  Gist ID (可选)
                </label>
                <input
                  type="text"
                  id="gistId"
                  value={gistForm.gistId}
                  onChange={(e) => setGistForm(prev => ({ ...prev, gistId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="留空将自动创建新的 Gist"
                />
                <p className="mt-1 text-sm text-gray-400">
                  用于同步现有 Gist，留空将创建新的私有 Gist
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存配置'}
                </button>

                <button
                  type="button"
                  onClick={handleSyncToGist}
                  disabled={loading || !gistForm.apiToken}
                  className="px-4 py-2 bg-green-600 border border-transparent rounded-md font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? '同步中...' : '立即同步'}
                </button>
              </div>
            </form>
          </div>

          {/* 同步说明 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">同步说明</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• 配置使用 AES-256 加密后存储到 GitHub Gist</p>
              <p>• 主密码不会同步，请在每台设备上单独设置</p>
              <p>• 建议定期手动同步以确保配置备份最新</p>
              <p>• 请妥善保管 GitHub API Token，它具有访问您 Gist 的权限</p>
            </div>
          </div>
        </div>
      )}

      {/* 系统设置标签页 */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="bg-gray-800 shadow-lg rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">系统设置</h2>

            <div className="space-y-6">
              {/* 开机自启动 */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="text-sm font-medium text-white">开机自启动</h3>
                  <p className="text-sm text-gray-400">
                    启动后自动运行 RMount 应用程序
                  </p>
                </div>
                <button
                  onClick={() => handleAutoStartChange(!autoStartEnabled)}
                  disabled={loading}
                  className={`${
                    autoStartEnabled
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50`}
                >
                  <span
                    className={`${
                      autoStartEnabled ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                  />
                </button>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-white mb-3">应用信息</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>版本: 1.0.0</p>
                  <p>构建: Wails v2 + React</p>
                  <p>数据存储: ~/.rmount/</p>
                </div>
              </div>
            </div>
          </div>

          {/* 使用说明 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">使用说明</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• 确保已安装 rclone 命令行工具</p>
              <p>• 挂载功能需要 macOS 10.15+ 版本支持</p>
              <p>• 建议使用稳定的网络连接进行文件操作</p>
              <p>• 大文件操作时请耐心等待完成</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;