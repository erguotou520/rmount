package sync

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/google/go-github/v45/github"
	"golang.org/x/oauth2"
	"rmount/config"
)

// GistSync Gist同步管理器
type GistSync struct {
	client *github.Client
	ctx    context.Context
}

// GistData 存储在Gist中的数据
type GistData struct {
	AppConfig string `json:"appConfig"` // 加密后的应用配置
	Timestamp int64  `json:"timestamp"`
	Version   string `json:"version"`
}

// NewGistSync 创建Gist同步管理器
func NewGistSync(accessToken string) *GistSync {
	ctx := context.Background()
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: accessToken},
	)
	tc := oauth2.NewClient(ctx, ts)

	return &GistSync{
		client: github.NewClient(tc),
		ctx:    ctx,
	}
}

// UploadToGist 上传配置到Gist
func (gs *GistSync) UploadToGist(config *config.AppConfig, gistID string) (string, error) {
	// 序列化配置数据
	configData, err := json.Marshal(config)
	if err != nil {
		return "", fmt.Errorf("序列化配置失败: %v", err)
	}

	// 创建Gist数据
	gistData := GistData{
		AppConfig: base64.StdEncoding.EncodeToString(configData),
		Timestamp: 0, // 这里应该使用当前时间
		Version:   "1.0",
	}

	gistDataJSON, err := json.Marshal(gistData)
	if err != nil {
		return "", fmt.Errorf("序列化Gist数据失败: %v", err)
	}

	// 创建或更新Gist
	files := map[github.GistFilename]github.GistFile{
		"rmount-config.json": {
			Filename: github.String("rmount-config.json"),
			Content:  github.String(string(gistDataJSON)),
		},
	}

	var gist *github.Gist
	if gistID != "" {
		// 更新现有Gist
		gist, _, err = gs.client.Gists.Edit(gs.ctx, gistID, &github.Gist{
			Files: files,
		})
		if err != nil {
			return "", fmt.Errorf("更新Gist失败: %v", err)
		}
	} else {
		// 创建新Gist
		gist = &github.Gist{
			Description: github.String("RMount Configuration Backup"),
			Public:      github.Bool(false),
			Files:       files,
		}
		gist, _, err = gs.client.Gists.Create(gs.ctx, gist)
		if err != nil {
			return "", fmt.Errorf("创建Gist失败: %v", err)
		}
	}

	return *gist.ID, nil
}

// DownloadFromGist 从Gist下载配置
func (gs *GistSync) DownloadFromGist(gistID string) (*config.AppConfig, error) {
	gist, _, err := gs.client.Gists.Get(gs.ctx, gistID)
	if err != nil {
		return nil, fmt.Errorf("获取Gist失败: %v", err)
	}

	// 获取配置文件内容
	if file, ok := gist.Files["rmount-config.json"]; ok && file.Content != nil {
		var gistData GistData
		if err := json.Unmarshal([]byte(*file.Content), &gistData); err != nil {
			return nil, fmt.Errorf("解析Gist数据失败: %v", err)
		}

		// 解码配置数据
		configData, err := base64.StdEncoding.DecodeString(gistData.AppConfig)
		if err != nil {
			return nil, fmt.Errorf("解码配置数据失败: %v", err)
		}

		var appConfig config.AppConfig
		if err := json.Unmarshal(configData, &appConfig); err != nil {
			return nil, fmt.Errorf("解析应用配置失败: %v", err)
		}

		return &appConfig, nil
	}

	return nil, fmt.Errorf("Gist中未找到配置文件")
}

// TestGistAccess 测试Gist访问权限
func (gs *GistSync) TestGistAccess() error {
	// 尝试获取用户信息来测试访问权限
	_, _, err := gs.client.Users.Get(gs.ctx, "")
	if err != nil {
		return fmt.Errorf("Gist访问权限测试失败: %v", err)
	}

	return nil
}