import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { ListFiles } from '../../wailsjs/go/main/App';

function FileBrowser() {
  const { name } = useParams();
  const history = useHistory();
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFiles(currentPath);
  }, [name, currentPath]);

  const loadFiles = async (path) => {
    try {
      setLoading(true);
      setError('');
      const fileList = await ListFiles(name, path);
      setFiles(fileList || []);
    } catch (err) {
      setError('加载文件失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file) => {
    if (file.IsDir) {
      const newPath = currentPath ? `${currentPath}/${file.Name}` : file.Name;
      setCurrentPath(newPath);
    } else {
      // 处理文件点击，可以预览或下载
      console.log('File clicked:', file);
    }
  };

  const handleBackClick = () => {
    if (currentPath) {
      const parts = currentPath.split('/');
      parts.pop();
      setCurrentPath(parts.join('/'));
    } else {
      history.push('/data-sources');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-white">文件浏览器</h1>
          <span className="text-gray-400">{name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBackClick}
            className="text-gray-300 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-sm text-gray-400">
            {currentPath || '/'}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-800 shadow overflow-hidden rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-400">加载中...</div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>此目录为空</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  大小
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  修改时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  类型
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {files.map((file, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {file.IsDir ? (
                        <svg className="h-5 w-5 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-sm font-medium text-white">{file.Name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {file.IsDir ? '--' : formatFileSize(file.Size)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      {formatDate(file.ModTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      file.IsDir ? 'bg-yellow-600 text-yellow-100' : 'bg-gray-600 text-gray-100'
                    }`}>
                      {file.IsDir ? '文件夹' : (file.MimeType || '文件')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!file.IsDir && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // 处理下载
                          }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          下载
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default FileBrowser;