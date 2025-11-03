import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GetS3DataSources } from '../../wailsjs/go/main/App';

function DataSourceList() {
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      setLoading(true);
      const sources = await GetS3DataSources();
      setDataSources(sources || []);
    } catch (err) {
      setError('加载数据源失败: ' + err.message);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-white">数据源管理</h1>
        <Link
          to="/data-sources/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          添加数据源
        </Link>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          {error}
        </div>
      )}

      {dataSources.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">暂无数据源</h3>
          <p className="text-gray-400 mb-4">添加您的第一个S3数据源来开始使用</p>
          <Link
            to="/data-sources/add"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加数据源
          </Link>
        </div>
      ) : (
        <div className="bg-gray-800 shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  端点/区域
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  存储桶
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  描述
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {dataSources.map((source) => (
                <tr key={source.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{source.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {source.endpoint || source.region}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{source.bucket || '--'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">{source.description || '--'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/data-sources/${source.name}/browse`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        浏览
                      </Link>
                      <button
                        className="text-indigo-400 hover:text-indigo-300"
                        // onClick={() => handleEdit(source)}
                      >
                        编辑
                      </button>
                      <button
                        className="text-red-400 hover:text-red-300"
                        // onClick={() => handleDelete(source)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DataSourceList;