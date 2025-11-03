package rclone

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"rmount/config"
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

// RcloneManager rclone管理器
type RcloneManager struct {
	configDir string
}

// NewRcloneManager 创建rclone管理器
func NewRcloneManager(configDir string) *RcloneManager {
	return &RcloneManager{
		configDir: configDir,
	}
}

// GenerateRcloneConfig 生成rclone配置文件
func (rm *RcloneManager) GenerateRcloneConfig(s3Configs []config.S3Config) error {
	configPath := filepath.Join(rm.configDir, "rclone.conf")
	configContent := ""

	for _, s3 := range s3Configs {
		section := fmt.Sprintf("[%s]\n", s3.Name)
		section += fmt.Sprintf("type = s3\n")
		section += fmt.Sprintf("provider = AWS\n")
		section += fmt.Sprintf("env_auth = false\n")
		section += fmt.Sprintf("access_key_id = %s\n", s3.AccessKey)
		section += fmt.Sprintf("secret_access_key = %s\n", s3.SecretKey)
		section += fmt.Sprintf("region = %s\n", s3.Region)

		if s3.Endpoint != "" {
			section += fmt.Sprintf("endpoint = %s\n", s3.Endpoint)
		}

		if s3.Bucket != "" {
			section += fmt.Sprintf("bucket = %s\n", s3.Bucket)
		}

		section += "\n"
		configContent += section
	}

	return os.WriteFile(configPath, []byte(configContent), 0600)
}

// TestConnection 测试S3连接
func (rm *RcloneManager) TestConnection(s3Config config.S3Config) error {
	// 创建临时配置
	tempConfig := filepath.Join(rm.configDir, "temp-test.conf")
	defer os.Remove(tempConfig)

	configContent := fmt.Sprintf("[%s]\ntype = s3\nprovider = AWS\nenv_auth = false\naccess_key_id = %s\nsecret_access_key = %s\nregion = %s\n",
		s3Config.Name, s3Config.AccessKey, s3Config.SecretKey, s3Config.Region)

	if s3Config.Endpoint != "" {
		configContent += fmt.Sprintf("endpoint = %s\n", s3Config.Endpoint)
	}

	if s3Config.Bucket != "" {
		configContent += fmt.Sprintf("bucket = %s\n", s3Config.Bucket)
	}

	if err := os.WriteFile(tempConfig, []byte(configContent), 0600); err != nil {
		return fmt.Errorf("创建临时配置文件失败: %v", err)
	}

	// 使用rclone测试连接
	remote := fmt.Sprintf("%s:", s3Config.Name)
	if s3Config.Bucket != "" {
		remote = fmt.Sprintf("%s:%s", s3Config.Name, s3Config.Bucket)
	}

	cmd := exec.Command("rclone", "lsd", "--config", tempConfig, remote)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("连接测试失败: %v, 输出: %s", err, string(output))
	}

	return nil
}

// ListFiles 列出文件
func (rm *RcloneManager) ListFiles(s3Name, remotePath string) ([]FileInfo, error) {
	configPath := filepath.Join(rm.configDir, "rclone.conf")
	remote := fmt.Sprintf("%s:%s", s3Name, remotePath)

	cmd := exec.Command("rclone", "lsjson", "--config", configPath, remote)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("列出文件失败: %v, 输出: %s", err, string(output))
	}

	var fileInfos []FileInfo
	if err := json.Unmarshal(output, &fileInfos); err != nil {
		return nil, fmt.Errorf("解析文件列表失败: %v", err)
	}

	return fileInfos, nil
}

// Mount 挂载到本地
func (rm *RcloneManager) Mount(s3Name, remotePath, localPath string) (*exec.Cmd, error) {
	// 确保本地目录存在
	if err := os.MkdirAll(localPath, 0755); err != nil {
		return nil, fmt.Errorf("创建挂载目录失败: %v", err)
	}

	configPath := filepath.Join(rm.configDir, "rclone.conf")
	remote := fmt.Sprintf("%s:%s", s3Name, remotePath)

	// macOS挂载参数
	args := []string{
		"mount",
		"--config", configPath,
		"--vfs-cache-mode", "full",
		"--cache-dir", filepath.Join(rm.configDir, "cache"),
		"--allow-non-empty",
		"--allow-other",
		"--daemon",
		remote,
		localPath,
	}

	cmd := exec.Command("rclone", args...)
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("启动挂载失败: %v", err)
	}

	// 等待一段时间确保挂载成功
	time.Sleep(2 * time.Second)

	// 检查进程是否还在运行
	if cmd.ProcessState != nil && cmd.ProcessState.Exited() {
		return nil, fmt.Errorf("挂载进程意外退出")
	}

	return cmd, nil
}

// Unmount 卸载
func (rm *RcloneManager) Unmount(localPath string) error {
	// macOS使用umount命令
	cmd := exec.Command("umount", localPath)
	if output, err := cmd.CombinedOutput(); err != nil {
		// 如果umount失败，尝试使用diskutil
		if strings.Contains(string(output), "not currently mounted") {
			return nil // 已经卸载
		}

		// 尝试使用diskutil卸载
		cmd = exec.Command("diskutil", "unmount", "force", localPath)
		if output, err := cmd.CombinedOutput(); err != nil {
			return fmt.Errorf("卸载失败: %v, 输出: %s", err, string(output))
		}
	}

	return nil
}

// GetMounts 获取当前挂载信息
func (rm *RcloneManager) GetMounts() ([]MountInfo, error) {
	// 查找rclone挂载进程
	cmd := exec.Command("pgrep", "-f", "rclone.*mount")
	output, err := cmd.Output()
	if err != nil {
		return []MountInfo{}, nil // 没有挂载进程
	}

	pids := strings.Fields(string(output))
	var mounts []MountInfo

	for _, pidStr := range pids {
		// 获取进程命令行参数
		cmd = exec.Command("ps", "-p", pidStr, "-o", "command=")
		cmdOutput, err := cmd.Output()
		if err != nil {
			continue
		}

		args := strings.Fields(string(cmdOutput))
		if len(args) < 2 {
			continue
		}

		// 解析挂载信息
		var remote, localPath string
		for i, arg := range args {
			if arg == "mount" && i+2 < len(args) {
				remote = args[i+2]
				localPath = args[i+3]
				break
			}
		}

		if remote != "" && localPath != "" {
			// 解析数据源名称
			parts := strings.SplitN(remote, ":", 2)
			if len(parts) >= 1 {
				name := parts[0]
				mounts = append(mounts, MountInfo{
					Name:      name,
					Remote:    remote,
					LocalPath: localPath,
					Status:    "mounted",
				})
			}
		}
	}

	return mounts, nil
}

// IsRcloneAvailable 检查rclone是否可用
func (rm *RcloneManager) IsRcloneAvailable() bool {
	cmd := exec.Command("rclone", "version")
	err := cmd.Run()
	return err == nil
}