package system

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// AutoStartManager 自启动管理器
type AutoStartManager struct {
	appName      string
	appPath      string
	plistPath    string
}

// NewAutoStartManager 创建自启动管理器
func NewAutoStartManager(appName, appPath string) *AutoStartManager {
	homeDir, _ := os.UserHomeDir()
	plistPath := filepath.Join(homeDir, "Library", "LaunchAgents", fmt.Sprintf("%s.plist", appName))

	return &AutoStartManager{
		appName:   appName,
		appPath:   appPath,
		plistPath: plistPath,
	}
}

// EnableAutoStart 启用开机自启动
func (asm *AutoStartManager) EnableAutoStart() error {
	// 确保LaunchAgents目录存在
	launchAgentsDir := filepath.Dir(asm.plistPath)
	if err := os.MkdirAll(launchAgentsDir, 0755); err != nil {
		return fmt.Errorf("创建LaunchAgents目录失败: %v", err)
	}

	// 创建plist文件内容
	plistContent := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>%s</string>
    <key>ProgramArguments</key>
    <array>
        <string>%s</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>`, asm.appName, asm.appPath)

	// 写入plist文件
	if err := os.WriteFile(asm.plistPath, []byte(plistContent), 0644); err != nil {
		return fmt.Errorf("创建plist文件失败: %v", err)
	}

	// 加载到launchd
	cmd := "launchctl"
	args := []string{"load", asm.plistPath}
	if err := runCommand(cmd, args); err != nil {
		return fmt.Errorf("加载启动项失败: %v", err)
	}

	return nil
}

// DisableAutoStart 禁用开机自启动
func (asm *AutoStartManager) DisableAutoStart() error {
	// 先卸载
	if asm.IsEnabled() {
		cmd := "launchctl"
		args := []string{"unload", asm.plistPath}
		if err := runCommand(cmd, args); err != nil {
			return fmt.Errorf("卸载启动项失败: %v", err)
		}
	}

	// 删除plist文件
	if _, err := os.Stat(asm.plistPath); err == nil {
		if err := os.Remove(asm.plistPath); err != nil {
			return fmt.Errorf("删除plist文件失败: %v", err)
		}
	}

	return nil
}

// IsEnabled 检查是否已启用自启动
func (asm *AutoStartManager) IsEnabled() bool {
	if _, err := os.Stat(asm.plistPath); os.IsNotExist(err) {
		return false
	}

	// 检查launchd是否加载了这个服务
	cmd := "launchctl"
	args := []string{"list", asm.appName}
	return runCommand(cmd, args) == nil
}

// GetAppPath 获取应用路径
func (asm *AutoStartManager) GetAppPath() string {
	if asm.appPath != "" {
		return asm.appPath
	}

	// 尝试从当前进程获取路径
	if exePath, err := os.Executable(); err == nil {
		return exePath
	}

	return ""
}

// runCommand 执行系统命令
func runCommand(cmd string, args []string) error {
	exe, err := exec.LookPath(cmd)
	if err != nil {
		return fmt.Errorf("找不到命令: %s", cmd)
	}

	command := exec.Command(exe, args...)
	if output, err := command.CombinedOutput(); err != nil {
		return fmt.Errorf("执行命令失败: %v, 输出: %s", err, string(output))
	}

	return nil
}