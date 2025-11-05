import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { AddS3DataSource, TestS3Connection } from '../../wailsjs/go/main/App';

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SelectCustom } from '@/components/ui/select-custom';

// Icons
import { Cloud, ArrowLeft, CheckCircle, AlertCircle, Server, Key } from 'lucide-react';

// AWS regions with common options
const awsRegions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-west-2', label: 'Europe (London)' },
  { value: 'eu-west-3', label: 'Europe (Paris)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'eu-north-1', label: 'Europe (Stockholm)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-southeast-3', label: 'Asia Pacific (Jakarta)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
  { value: 'ap-northeast-3', label: 'Asia Pacific (Osaka)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
  { value: 'cn-north-1', label: 'China (Beijing)' },
  { value: 'cn-northwest-1', label: 'China (Ningxia)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
  { value: 'me-south-1', label: 'Middle East (Bahrain)' },
  { value: 'af-south-1', label: 'Africa (Cape Town)' }
];

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

  const handleRegionChange = (value) => {
    setFormData(prev => ({
      ...prev,
      region: value
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
      setSuccess('');

      const result = await TestS3Connection(
        formData.name,
        formData.endpoint,
        formData.accessKey,
        formData.secretKey,
        formData.region,
        formData.bucket
      );

      setSuccess('连接测试成功！');
    } catch (err) {
      console.error('Test connection error:', err);
      const errorMessage = err?.message || err?.toString() || '未知错误';
      setError('连接测试失败: ' + errorMessage);
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
      setSuccess('');

      const result = await AddS3DataSource(
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
      console.error('Add data source error:', err);
      const errorMessage = err?.message || err?.toString() || '未知错误';
      setError('添加数据源失败: ' + errorMessage);
      setSuccess('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => history.push('/data-sources')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold">添加S3数据源</h1>
          <p className="text-muted-foreground">配置您的S3兼容存储服务</p>
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

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <CardTitle>S3数据源配置</CardTitle>
          </div>
          <CardDescription>
            请填写您的S3存储服务配置信息。标有*的字段为必填项。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* 名称 */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name">
                  数据源名称 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="例如：my-s3-storage"
                  required
                />
              </div>

              {/* 访问密钥 */}
              <div className="space-y-2">
                <Label htmlFor="accessKey" className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>
                    Access Key <span className="text-destructive">*</span>
                  </span>
                </Label>
                <Input
                  id="accessKey"
                  name="accessKey"
                  value={formData.accessKey}
                  onChange={handleInputChange}
                  placeholder="AWS Access Key ID"
                  required
                />
              </div>

              {/* 秘密密钥 */}
              <div className="space-y-2">
                <Label htmlFor="secretKey" className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>
                    Secret Key <span className="text-destructive">*</span>
                  </span>
                </Label>
                <Input
                  id="secretKey"
                  name="secretKey"
                  type="password"
                  value={formData.secretKey}
                  onChange={handleInputChange}
                  placeholder="AWS Secret Access Key"
                  required
                />
              </div>

              {/* 区域 */}
              <div className="space-y-2">
                <Label htmlFor="region">
                  区域 <span className="text-destructive">*</span>
                </Label>
                <SelectCustom
                  value={formData.region}
                  onValueChange={handleRegionChange}
                  options={awsRegions}
                  placeholder="选择AWS区域或输入自定义区域"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  可以从下拉列表选择，或直接输入自定义区域代码（如：cn-north-1）
                </p>
              </div>

              {/* 端点 */}
              <div className="space-y-2">
                <Label htmlFor="endpoint">自定义端点</Label>
                <Input
                  id="endpoint"
                  name="endpoint"
                  value={formData.endpoint}
                  onChange={handleInputChange}
                  placeholder="例如：https://s3.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  仅用于兼容S3的存储服务，如MinIO、腾讯云COS等。如果使用AWS请留空。
                </p>
              </div>

              {/* 存储桶 */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="bucket">默认存储桶</Label>
                <Input
                  id="bucket"
                  name="bucket"
                  value={formData.bucket}
                  onChange={handleInputChange}
                  placeholder="my-bucket-name"
                />
                <p className="text-xs text-muted-foreground">
                  留空可浏览所有存储桶
                </p>
              </div>

              {/* 描述 */}
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="数据源描述信息..."
                  rows={3}
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => history.push('/data-sources')}
              >
                取消
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? '测试中...' : '测试连接'}
              </Button>

              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? '添加中...' : '添加数据源'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default DataSourceForm;