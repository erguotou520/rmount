package s3

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3config "rmount/config"
)

// FileInfo 文件信息
type FileInfo struct {
	Name      string    `json:"Name"`
	Path      string    `json:"Path"`
	Size      int64     `json:"Size"`
	ModTime   time.Time `json:"ModTime"`
	IsDir     bool      `json:"IsDir"`
	MimeType  string    `json:"MimeType"`
}

// MountInfo 挂载信息
type MountInfo struct {
	Name      string `json:"name"`
	Remote    string `json:"remote"`
	LocalPath string `json:"localPath"`
	PID       int    `json:"pid"`
	Status    string `json:"status"`
}

// S3Client S3客户端
type S3Client struct {
	client *s3.Client
}

// NewS3Client 创建S3客户端
func NewS3Client(s3Config s3config.S3Config) (*S3Client, error) {
	// 创建AWS配置
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(s3Config.Region),
		config.WithCredentialsProvider(aws.NewCredentialsCache(
			aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
				return aws.Credentials{
					AccessKeyID:     s3Config.AccessKey,
					SecretAccessKey: s3Config.SecretKey,
				}, nil
			}),
		)),
	)
	if err != nil {
		return nil, fmt.Errorf("创建AWS配置失败: %v", err)
	}

	// 创建S3客户端
	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		if s3Config.Endpoint != "" {
			o.BaseEndpoint = aws.String(s3Config.Endpoint)
		}
	})

	return &S3Client{
		client: client,
	}, nil
}

// TestConnection 测试S3连接
func (s *S3Client) TestConnection(bucket string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 如果没有指定bucket，尝试列出所有bucket
	if bucket == "" {
		_, err := s.client.ListBuckets(ctx, &s3.ListBucketsInput{})
		if err != nil {
			return fmt.Errorf("连接测试失败: %v", err)
		}
	} else {
		// 测试特定bucket的访问权限
		_, err := s.client.ListObjectsV2(ctx, &s3.ListObjectsV2Input{
			Bucket: aws.String(bucket),
			MaxKeys: aws.Int32(1),
		})
		if err != nil {
			return fmt.Errorf("连接测试失败: %v", err)
		}
	}

	return nil
}

// ListFiles 列出文件
func (s *S3Client) ListFiles(bucket, prefix string) ([]FileInfo, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if bucket == "" {
		// 如果没有指定bucket，先列出所有bucket
		buckets, err := s.client.ListBuckets(ctx, &s3.ListBucketsInput{})
		if err != nil {
			return nil, fmt.Errorf("列出bucket失败: %v", err)
		}

		var files []FileInfo
		for _, bucket := range buckets.Buckets {
			files = append(files, FileInfo{
				Name:    *bucket.Name,
				Path:    *bucket.Name,
				IsDir:   true,
				ModTime: *bucket.CreationDate,
			})
		}
		return files, nil
	}

	// 确保prefix格式正确
	cleanPrefix := prefix
	if cleanPrefix != "" && !strings.HasSuffix(cleanPrefix, "/") {
		cleanPrefix = cleanPrefix + "/"
	}

	input := &s3.ListObjectsV2Input{
		Bucket:    aws.String(bucket),
		Prefix:    aws.String(cleanPrefix),
		Delimiter: aws.String("/"),
	}

	var files []FileInfo
	paginator := s3.NewListObjectsV2Paginator(s.client, input)
	for paginator.HasMorePages() {
		page, err := paginator.NextPage(ctx)
		if err != nil {
			return nil, fmt.Errorf("列出文件失败: %v", err)
		}

		// 处理目录
		for _, prefix := range page.CommonPrefixes {
			prefixStr := *prefix.Prefix
			// 移除尾部斜杠以获取干净的目录名
			dirName := strings.TrimSuffix(prefixStr, "/")
			// 获取目录的最后部分作为显示名称
			if cleanPrefix != "" {
				dirName = strings.TrimPrefix(dirName, cleanPrefix)
			}
			files = append(files, FileInfo{
				Name:  dirName,
				Path:  strings.TrimSuffix(prefixStr, "/"),
				IsDir: true,
			})
		}

		// 处理文件
		for _, obj := range page.Contents {
			key := *obj.Key
			// 跳过目录本身（以/结尾的条目）
			if strings.HasSuffix(key, "/") {
				continue
			}

			// 获取文件名（去掉前缀）
			fileName := key
			if cleanPrefix != "" {
				fileName = strings.TrimPrefix(key, cleanPrefix)
			}

			files = append(files, FileInfo{
				Name:    fileName,
				Path:    key,
				Size:    *obj.Size,
				ModTime: *obj.LastModified,
				IsDir:   false,
			})
		}
	}

	return files, nil
}