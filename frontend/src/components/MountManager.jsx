import React, { useState, useEffect } from 'react';
import { GetMounts, Mount, Unmount } from '../../wailsjs/go/main/App';
import { GetS3DataSources } from '../../wailsjs/go/main/App';

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
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">挂载管理</h1>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* 挂载表单 */}
      <div className="bg-gray-800 shadow-lg rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">创建挂载</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="dataSource" className="block text-sm font-medium text-gray-300 mb-2">
              数据源
            </label>
            <select
              id="dataSource"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">选择数据源</option>
              {dataSources.map((source) => (
                <option key={source.id} value={source.name}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="remotePath" className="block text-sm font-medium text-gray-300 mb-2">
              远程路径
            </label>
            <input
              type="text"
              id="remotePath"
              value={remotePath}
              onChange={(e) => setRemotePath(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="例如：/ 或 /bucket-name"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleMount}
              disabled={!selectedSource}
              className="w-full px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              挂载
            </button>
          </div>
        </div>
      </div>

      {/* 挂载列表 */}
      <div className="bg-gray-800 shadow overflow-hidden rounded-lg">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">当前挂载</h2>
        </div>

        {mounts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
            </svg>
            <p>暂无挂载</p>
            <p className="text-sm mt-2">选择数据源并点击"挂载"按钮开始使用</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  数据源
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  远程路径
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  本地路径
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  状态
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {mounts.map((mount) => (
                <tr key={mount.name} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{mount.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{mount.Remote || '/'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{mount.LocalPath}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      mount.Status === 'mounted'
                        ? 'bg-green-600 text-green-100'
                        : 'bg-yellow-600 text-yellow-100'
                    }`}>
                      {mount.Status === 'mounted' ? '已挂载' : mount.Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => window.open(`file://${mount.LocalPath}`)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        打开
                      </button>
                      <button
                        onClick={() => handleUnmount(mount.name)}
                        className="text-red-400 hover:text-red-300"
                      >
                        卸载
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 使用说明 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3">使用说明</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>• 挂载成功后，您可以在本地文件系统中访问云存储文件</p>
          <p>• 点击"打开"按钮可以在访达中打开挂载点</p>
          <p>• 使用完毕后请及时卸载以释放系统资源</p>
          <p>• 挂载点默认位于 ~/mounts/数据源名称</p>
        </div>
      </div>
    </div>
  );
}

export default MountManager;