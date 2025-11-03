import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AddS3DataSource, TestS3Connection } from '../../wailsjs/go/main/App';

function DataSourceForm() {
  const history = useHistory();
  const [formData, setFormData] = useState({
    name: '',
    endpoint: '',
    accessKey: '',
    secretKey: '',
    region: 'us-east-1',
    bucket: '',
    description: ''
  });
  const [testing, setTesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.name || !formData.accessKey || !formData.secretKey || !formData.region) {
      setError('请填写必要的连接信息');
      return;
    }

    try {
      setTesting(true);
      setError('');
      await TestS3Connection(
        formData.name,
        formData.endpoint,
        formData.accessKey,
        formData.secretKey,
        formData.region,
        formData.bucket
      );
      setSuccess('连接测试成功！');
    } catch (err) {
      setError('连接测试失败: ' + err.message);
      setSuccess('');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.accessKey || !formData.secretKey || !formData.region) {
      setError('请填写所有必填字段');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await AddS3DataSource(
        formData.name,
        formData.endpoint,
        formData.accessKey,
        formData.secretKey,
        formData.region,
        formData.bucket,
        formData.description
      );

      setSuccess('数据源添加成功！');
      setTimeout(() => {
        history.push('/data-sources');
      }, 2000);
    } catch (err) {
      setError('添加数据源失败: ' + err.message);
      setSuccess('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">添加S3数据源</h1>
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

      <div className="bg-gray-800 shadow-lg rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* 名称 */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                数据源名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="例如：my-s3-storage"
                required
              />
            </div>

            {/* 访问密钥 */}
            <div>
              <label htmlFor="accessKey" className="block text-sm font-medium text-gray-300 mb-2">
                Access Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="accessKey"
                name="accessKey"
                value={formData.accessKey}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="AWS Access Key ID"
                required
              />
            </div>

            {/* 秘密密钥 */}
            <div>
              <label htmlFor="secretKey" className="block text-sm font-medium text-gray-300 mb-2">
                Secret Key <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                id="secretKey"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="AWS Secret Access Key"
                required
              />
            </div>

            {/* 区域 */}
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-300 mb-2">
                区域 <span className="text-red-400">*</span>
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="us-east-1">us-east-1</option>
                <option value="us-east-2">us-east-2</option>
                <option value="us-west-1">us-west-1</option>
                <option value="us-west-2">us-west-2</option>
                <option value="eu-west-1">eu-west-1</option>
                <option value="eu-west-2">eu-west-2</option>
                <option value="eu-central-1">eu-central-1</option>
                <option value="ap-southeast-1">ap-southeast-1</option>
                <option value="ap-southeast-2">ap-southeast-2</option>
                <option value="ap-northeast-1">ap-northeast-1</option>
              </select>
            </div>

            {/* 端点 */}
            <div>
              <label htmlFor="endpoint" className="block text-sm font-medium text-gray-300 mb-2">
                自定义端点
              </label>
              <input
                type="url"
                id="endpoint"
                name="endpoint"
                value={formData.endpoint}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="例如：https://s3.example.com"
              />
              <p className="mt-1 text-sm text-gray-400">
                仅用于兼容S3的存储服务，如MinIO等
              </p>
            </div>

            {/* 存储桶 */}
            <div className="sm:col-span-2">
              <label htmlFor="bucket" className="block text-sm font-medium text-gray-300 mb-2">
                默认存储桶
              </label>
              <input
                type="text"
                id="bucket"
                name="bucket"
                value={formData.bucket}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="my-bucket-name"
              />
              <p className="mt-1 text-sm text-gray-400">
                留空可浏览所有存储桶
              </p>
            </div>

            {/* 描述 */}
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                描述
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="数据源描述信息..."
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => history.push('/data-sources')}
              className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {testing ? '测试中...' : '测试连接'}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? '添加中...' : '添加数据源'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DataSourceForm;