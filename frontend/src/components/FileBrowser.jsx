import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { ListFiles } from '../../wailsjs/go/main/App';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Icons
import { FolderOpen, File, ArrowLeft, Download, AlertCircle, HardDrive } from 'lucide-react';

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
      // 构建新路径，确保路径格式正确
      let newPath;
      if (currentPath) {
        // 移除末尾的斜杠，然后添加新的文件夹名
        const cleanPath = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
        newPath = `${cleanPath}/${file.Name}`;
      } else {
        newPath = file.Name;
      }
      console.log('Navigating to path:', newPath);
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
      const parentPath = parts.join('/');
      console.log('Going back to path:', parentPath || '/');
      setCurrentPath(parentPath);
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
          <h1 className="text-3xl font-bold">文件浏览器</h1>
          <Badge variant="secondary">{name}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div className="text-sm text-muted-foreground font-mono">
            {currentPath || '/'}
          </div>
        </div>
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

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <HardDrive className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>此目录为空</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>修改时间</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file, index) => (
                  <TableRow
                    key={index}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleFileClick(file)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {file.IsDir ? (
                          <FolderOpen className="h-4 w-4 text-blue-500" />
                        ) : (
                          <File className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{file.Name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {file.IsDir ? '--' : formatFileSize(file.Size)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(file.ModTime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={file.IsDir ? 'secondary' : 'outline'}>
                        {file.IsDir ? '文件夹' : (file.MimeType || '文件')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!file.IsDir && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 处理下载
                            console.log('Download file:', file);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default FileBrowser;