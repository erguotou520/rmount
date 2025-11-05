package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"rmount/config"
	"rmount/rclone"
	"rmount/s3"
	gistsync "rmount/sync"
	"rmount/system"
)

// App struct
type App struct {
	ctx context.Context

	// 配置目录
	configDir string

	// 配置管理
	configManager *config.ConfigManager
	appConfig     *config.AppConfig
	configMutex   sync.RWMutex

	// rclone管理
	rcloneManager *rclone.RcloneManager

	// 同步管理
	gistSync *gistsync.GistSync

	// 自启动管理
	autoStartManager *system.AutoStartManager

	// 挂载管理
	mountProcesses map[string]*rclone.MountInfo
	mountMutex     sync.RWMutex
}

// NewApp creates a new App application struct
func NewApp() *App {
	homeDir, _ := os.UserHomeDir()
	configDir := filepath.Join(homeDir, ".rmount")

	return &App{
		configDir:        configDir,
		mountProcesses:   make(map[string]*rclone.MountInfo),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.configDir = filepath.Join(os.Getenv("HOME"), ".rmount")

	// 初始化配置管理器（使用空密码，需要用户设置）
	a.configManager, _ = config.NewConfigManager(a.configDir, "")

	// 初始化rclone管理器
	a.rcloneManager = rclone.NewRcloneManager(a.configDir)

	// 初始化自启动管理器
	appPath, _ := os.Executable()
	a.autoStartManager = system.NewAutoStartManager("rmount", appPath)

	// 尝试加载配置
	if err := a.loadOrCreateConfig(); err != nil {
		fmt.Printf("加载配置失败: %v\n", err)
	}

	// 启动挂载状态检查
	go a.monitorMountStatus()
}

// loadOrCreateConfig 加载或创建配置
func (a *App) loadOrCreateConfig() error {
	cfg, err := a.configManager.LoadConfig()
	if err != nil {
		// 如果是加密未初始化错误，说明配置文件已加密但未设置密码
		if err.Error() == "加密未初始化，无法解密配置" {
			// 创建一个空配置，等待用户设置密码
			a.appConfig = &config.AppConfig{
				AutoStart:      false,
				MountDirectory: filepath.Join(os.Getenv("HOME"), "mounts"),
				S3DataSources:  []config.S3Config{},
			}
			return nil
		}
		return err
	}

	a.appConfig = cfg

	// 生成rclone配置文件
	if len(cfg.S3DataSources) > 0 {
		if err := a.rcloneManager.GenerateRcloneConfig(cfg.S3DataSources); err != nil {
			return fmt.Errorf("生成rclone配置失败: %v", err)
		}
	}

	return nil
}

// SetMasterPassword 设置主密码
func (a *App) SetMasterPassword(password string) error {
	a.configMutex.Lock()
	defer a.configMutex.Unlock()

	// 重新创建配置管理器
	cm, err := config.NewConfigManager(a.configDir, password)
	if err != nil {
		return fmt.Errorf("设置主密码失败: %v", err)
	}

	// 尝试加载已存在的加密配置
	cfg, err := cm.LoadConfig()
	if err != nil {
		// 如果加载失败，使用当前配置
		if a.appConfig != nil {
			if err := cm.SaveConfig(a.appConfig); err != nil {
				return fmt.Errorf("迁移配置失败: %v", err)
			}
		}
	} else {
		// 成功加载已存在的配置
		a.appConfig = cfg

		// 生成rclone配置文件
		if len(cfg.S3DataSources) > 0 {
			if err := a.rcloneManager.GenerateRcloneConfig(cfg.S3DataSources); err != nil {
				return fmt.Errorf("生成rclone配置失败: %v", err)
			}
		}
	}

	a.configManager = cm
	return nil
}

// IsPasswordSet 检查是否已设置主密码
func (a *App) IsPasswordSet() bool {
	a.configMutex.RLock()
	defer a.configMutex.RUnlock()

	return a.configManager != nil && a.configManager.IsEncryptionInitialized()
}

// AddS3DataSource 添加S3数据源
func (a *App) AddS3DataSource(name, endpoint, accessKey, secretKey, region, bucket, description string) error {
	a.configMutex.Lock()
	defer a.configMutex.Unlock()

	if a.appConfig == nil {
		return fmt.Errorf("配置未初始化，请先设置主密码")
	}

	s3Config := config.S3Config{
		ID:          generateID(),
		Name:        name,
		Endpoint:    endpoint,
		AccessKey:   accessKey,
		SecretKey:   secretKey,
		Region:      region,
		Bucket:      bucket,
		Description: description,
	}

	if err := a.configManager.AddS3DataSource(a.appConfig, s3Config); err != nil {
		return err
	}

	if err := a.configManager.SaveConfig(a.appConfig); err != nil {
		return fmt.Errorf("保存配置失败: %v", err)
	}

	// 更新rclone配置
	return a.rcloneManager.GenerateRcloneConfig(a.appConfig.S3DataSources)
}

// GetS3DataSources 获取S3数据源列表
func (a *App) GetS3DataSources() ([]config.S3Config, error) {
	a.configMutex.RLock()
	defer a.configMutex.RUnlock()

	if a.appConfig == nil {
		return []config.S3Config{}, nil
	}

	return a.appConfig.S3DataSources, nil
}

// TestS3Connection 测试S3连接
func (a *App) TestS3Connection(name, endpoint, accessKey, secretKey, region, bucket string) error {
	s3Config := config.S3Config{
		Name:      name,
		Endpoint:  endpoint,
		AccessKey: accessKey,
		SecretKey: secretKey,
		Region:    region,
		Bucket:    bucket,
	}

	// 使用新的S3客户端
	s3Client, err := s3.NewS3Client(s3Config)
	if err != nil {
		return fmt.Errorf("创建S3客户端失败: %v", err)
	}

	return s3Client.TestConnection(bucket)
}

// ListFiles 列出文件
func (a *App) ListFiles(s3Name, remotePath string) ([]rclone.FileInfo, error) {
	a.configMutex.RLock()
	defer a.configMutex.RUnlock()

	// 查找S3配置
	var targetConfig *config.S3Config
	for _, config := range a.appConfig.S3DataSources {
		if config.Name == s3Name {
			targetConfig = &config
			break
		}
	}

	if targetConfig == nil {
		return nil, fmt.Errorf("未找到S3配置: %s", s3Name)
	}

	// 使用新的S3客户端
	s3Client, err := s3.NewS3Client(*targetConfig)
	if err != nil {
		return nil, fmt.Errorf("创建S3客户端失败: %v", err)
	}

	s3Files, err := s3Client.ListFiles(targetConfig.Bucket, remotePath)
	if err != nil {
		return nil, err
	}

	// 转换为rclone.FileInfo格式
	var rcloneFiles []rclone.FileInfo
	for _, file := range s3Files {
		rcloneFiles = append(rcloneFiles, rclone.FileInfo{
			Name:    file.Name,
			Path:    file.Path,
			Size:    file.Size,
			ModTime: file.ModTime,
			IsDir:   file.IsDir,
		})
	}

	return rcloneFiles, nil
}

// Mount 挂载S3到本地
func (a *App) Mount(s3Name, remotePath string) error {
	a.mountMutex.Lock()
	defer a.mountMutex.Unlock()

	// 生成挂载路径
	homeDir, _ := os.UserHomeDir()
	mountDir := filepath.Join(homeDir, "mounts", s3Name)
	if remotePath != "" && remotePath != "/" {
		mountDir = filepath.Join(mountDir, filepath.Base(remotePath))
	}

	// 检查是否已经挂载
	if _, exists := a.mountProcesses[s3Name]; exists {
		return fmt.Errorf("数据源 '%s' 已经挂载", s3Name)
	}

	// 执行挂载
	process, err := a.rcloneManager.Mount(s3Name, remotePath, mountDir)
	if err != nil {
		return err
	}

	// 记录挂载信息
	mountInfo := rclone.MountInfo{
		Name:      s3Name,
		Remote:    remotePath,
		LocalPath: mountDir,
		Status:    "mounted",
	}

	if process != nil && process.Process != nil {
		// 注意：这里简化了PID获取，实际中可能需要更复杂的进程管理
		mountInfo.PID = process.Process.Pid
	}

	a.mountProcesses[s3Name] = &mountInfo
	return nil
}

// Unmount 卸载S3
func (a *App) Unmount(s3Name string) error {
	a.mountMutex.Lock()
	defer a.mountMutex.Unlock()

	mountInfo, exists := a.mountProcesses[s3Name]
	if !exists {
		return fmt.Errorf("数据源 '%s' 未挂载", s3Name)
	}

	// 卸载
	if err := a.rcloneManager.Unmount(mountInfo.LocalPath); err != nil {
		return err
	}

	delete(a.mountProcesses, s3Name)
	return nil
}

// GetMounts 获取挂载列表
func (a *App) GetMounts() ([]rclone.MountInfo, error) {
	a.mountMutex.RLock()
	defer a.mountMutex.RUnlock()

	var mounts []rclone.MountInfo
	for _, mount := range a.mountProcesses {
		mounts = append(mounts, *mount)
	}

	return mounts, nil
}

// SetGistConfig 设置Gist配置
func (a *App) SetGistConfig(apiToken, gistID string) error {
	a.configMutex.Lock()
	defer a.configMutex.Unlock()

	if a.appConfig == nil {
		return fmt.Errorf("配置未初始化")
	}

	// 检查加密是否已初始化
	if !a.configManager.IsEncryptionInitialized() {
		return fmt.Errorf("请先设置主密码后再保存配置")
	}

	a.appConfig.GistAPIToken = apiToken
	a.appConfig.GistID = gistID

	// 初始化Gist同步
	if apiToken != "" {
		a.gistSync = gistsync.NewGistSync(apiToken)
		// 测试访问权限，但不阻止配置保存
		if err := a.gistSync.TestGistAccess(); err != nil {
			// 记录警告但不返回错误，允许用户保存配置
			fmt.Printf("警告: Gist访问权限测试失败，但配置已保存: %v\n", err)
		}
	} else {
		a.gistSync = nil
	}

	return a.configManager.SaveConfig(a.appConfig)
}

// SyncToGist 同步配置到Gist
func (a *App) SyncToGist() error {
	a.configMutex.RLock()
	defer a.configMutex.RUnlock()

	if a.appConfig == nil || a.gistSync == nil {
		return fmt.Errorf("Gist配置未设置")
	}

	gistID, err := a.gistSync.UploadToGist(a.appConfig, a.appConfig.GistID)
	if err != nil {
		return err
	}

	// 更新Gist ID
	a.appConfig.GistID = gistID
	return a.configManager.SaveConfig(a.appConfig)
}

// SetAutoStart 设置开机自启动
func (a *App) SetAutoStart(enabled bool) error {
	a.configMutex.Lock()
	defer a.configMutex.Unlock()

	if a.appConfig == nil {
		return fmt.Errorf("配置未初始化")
	}

	if enabled {
		if err := a.autoStartManager.EnableAutoStart(); err != nil {
			return err
		}
	} else {
		if err := a.autoStartManager.DisableAutoStart(); err != nil {
			return err
		}
	}

	a.appConfig.AutoStart = enabled
	return a.configManager.SaveConfig(a.appConfig)
}

// GetGistConfig 获取Gist配置
func (a *App) GetGistConfig() (apiToken, gistID string, hasToken bool, err error) {
	a.configMutex.RLock()
	defer a.configMutex.RUnlock()

	if a.appConfig == nil {
		return "", "", false, fmt.Errorf("配置未初始化")
	}

	// 只返回token是否存在和脱敏信息，不返回实际token
	hasToken = a.appConfig.GistAPIToken != ""
	apiToken = ""
	if hasToken {
		// 返回脱敏的token信息（显示前4位和后4位）
		token := a.appConfig.GistAPIToken
		if len(token) > 8 {
			apiToken = token[:4] + "..." + token[len(token)-4:]
		} else {
			apiToken = "已设置"
		}
	}
	gistID = a.appConfig.GistID

	return apiToken, gistID, hasToken, nil
}

// IsAutoStartEnabled 检查是否启用自启动
func (a *App) IsAutoStartEnabled() bool {
	return a.autoStartManager.IsEnabled()
}

// monitorMountStatus 监控挂载状态
func (a *App) monitorMountStatus() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		a.mountMutex.Lock()
		mounts, err := a.rcloneManager.GetMounts()
		if err == nil {
			// 更新挂载状态
			activeMounts := make(map[string]bool)
			for _, mount := range mounts {
				activeMounts[mount.Name] = true
				if storedMount, exists := a.mountProcesses[mount.Name]; exists {
					storedMount.Status = mount.Status
				}
			}

			// 清理无效的挂载记录
			for name := range a.mountProcesses {
				if !activeMounts[name] {
					delete(a.mountProcesses, name)
				}
			}
		}
		a.mountMutex.Unlock()
	}
}

// generateID 生成唯一ID
func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
