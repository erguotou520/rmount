package config

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
)

// S3Config 表示S3数据源配置
type S3Config struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Endpoint    string `json:"endpoint"`
	AccessKey   string `json:"accessKey"`
	SecretKey   string `json:"secretKey"`
	Region      string `json:"region"`
	Bucket      string `json:"bucket"`
	Description string `json:"description"`
}

// AppConfig 应用配置
type AppConfig struct {
	MasterPassword     string `json:"-"` // 不存储到文件中
	GistAPIToken       string `json:"gistAPIToken,omitempty"`
	GistID             string `json:"gistId,omitempty"`
	AutoStart          bool   `json:"autoStart"`
	MountDirectory     string `json:"mountDirectory"`
	S3DataSources      []S3Config `json:"s3DataSources"`
}

// ConfigManager 配置管理器
type ConfigManager struct {
	configFile string
	gcm        cipher.AEAD
}

// NewConfigManager 创建配置管理器
func NewConfigManager(configDir string, masterPassword string) (*ConfigManager, error) {
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return nil, fmt.Errorf("创建配置目录失败: %v", err)
	}

	configFile := filepath.Join(configDir, "config.enc")

	cm := &ConfigManager{
		configFile: configFile,
	}

	// 如果主密码不为空，初始化加密
	if masterPassword != "" {
		if err := cm.initEncryption(masterPassword); err != nil {
			return nil, fmt.Errorf("初始化加密失败: %v", err)
		}
	}

	return cm, nil
}

// initEncryption 初始化加密
func (cm *ConfigManager) initEncryption(password string) error {
	// 使用密码的SHA256哈希作为密钥
	key := cm.deriveKey(password)

	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	cm.gcm = gcm
	return nil
}

// deriveKey 从密码派生密钥
func (cm *ConfigManager) deriveKey(password string) []byte {
	// 简单的密钥派生，实际应用中应该使用更安全的方法
	key := make([]byte, 32)
	for i, b := range []byte(password) {
		key[i%32] ^= b
	}
	return key
}

// LoadConfig 加载配置
func (cm *ConfigManager) LoadConfig() (*AppConfig, error) {
	if _, err := os.Stat(cm.configFile); os.IsNotExist(err) {
		// 配置文件不存在，返回默认配置
		return &AppConfig{
			AutoStart:      false,
			MountDirectory: filepath.Join(os.Getenv("HOME"), "mounts"),
			S3DataSources:  []S3Config{},
		}, nil
	}

	data, err := ioutil.ReadFile(cm.configFile)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %v", err)
	}

	if cm.gcm == nil {
		return nil, fmt.Errorf("加密未初始化，无法解密配置")
	}

	// 解密数据
	nonceSize := cm.gcm.NonceSize()
	if len(data) < nonceSize {
		return nil, fmt.Errorf("配置文件格式错误")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := cm.gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("解密配置失败: %v", err)
	}

	var config AppConfig
	if err := json.Unmarshal(plaintext, &config); err != nil {
		return nil, fmt.Errorf("解析配置失败: %v", err)
	}

	return &config, nil
}

// SaveConfig 保存配置
func (cm *ConfigManager) SaveConfig(config *AppConfig) error {
	if cm.gcm == nil {
		return fmt.Errorf("加密未初始化，无法加密配置")
	}

	// 序列化配置
	data, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("序列化配置失败: %v", err)
	}

	// 加密数据
	nonce := make([]byte, cm.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return fmt.Errorf("生成nonce失败: %v", err)
	}

	ciphertext := cm.gcm.Seal(nonce, nonce, data, nil)

	// 写入文件
	if err := ioutil.WriteFile(cm.configFile, ciphertext, 0600); err != nil {
		return fmt.Errorf("写入配置文件失败: %v", err)
	}

	return nil
}

// AddS3DataSource 添加S3数据源
func (cm *ConfigManager) AddS3DataSource(config *AppConfig, s3Config S3Config) error {
	// 检查名称是否已存在
	for _, ds := range config.S3DataSources {
		if ds.Name == s3Config.Name {
			return fmt.Errorf("数据源名称 '%s' 已存在", s3Config.Name)
		}
	}

	config.S3DataSources = append(config.S3DataSources, s3Config)
	return nil
}

// RemoveS3DataSource 删除S3数据源
func (cm *ConfigManager) RemoveS3DataSource(config *AppConfig, name string) error {
	for i, ds := range config.S3DataSources {
		if ds.Name == name {
			config.S3DataSources = append(config.S3DataSources[:i], config.S3DataSources[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("未找到名为 '%s' 的数据源", name)
}

// UpdateS3DataSource 更新S3数据源
func (cm *ConfigManager) UpdateS3DataSource(config *AppConfig, s3Config S3Config) error {
	for i, ds := range config.S3DataSources {
		if ds.Name == s3Config.Name {
			config.S3DataSources[i] = s3Config
			return nil
		}
	}
	return fmt.Errorf("未找到名为 '%s' 的数据源", s3Config.Name)
}