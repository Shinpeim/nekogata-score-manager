/**
 * ログレベル定義
 */
export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

/**
 * 現在のログレベルを環境変数から取得
 * VITE_LOG_LEVEL環境変数で制御
 * 本番環境では ERROR、開発環境では INFO、デバッグ時は DEBUG
 */
const getCurrentLogLevel = (): LogLevelType => {
  const envLogLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
  
  switch (envLogLevel) {
    case 'ERROR':
      return LogLevel.ERROR;
    case 'WARN':
      return LogLevel.WARN;
    case 'INFO':
      return LogLevel.INFO;
    case 'DEBUG':
      return LogLevel.DEBUG;
    default:
      // 本番環境ではERROR、開発環境ではINFO
      return import.meta.env.PROD ? LogLevel.ERROR : LogLevel.INFO;
  }
};

const currentLogLevel = getCurrentLogLevel();

/**
 * ログ出力のコア関数
 */
const log = (level: LogLevelType, levelName: string, message: string, ...args: unknown[]) => {
  if (level <= currentLogLevel) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${levelName}]`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.DEBUG:
        console.log(prefix, message, ...args);
        break;
    }
  }
};

/**
 * ログユーティリティ
 */
export const logger = {
  /**
   * エラーログ（常に出力）
   */
  error: (message: string, ...args: unknown[]) => {
    log(LogLevel.ERROR, 'ERROR', message, ...args);
  },

  /**
   * 警告ログ
   */
  warn: (message: string, ...args: unknown[]) => {
    log(LogLevel.WARN, 'WARN', message, ...args);
  },

  /**
   * 情報ログ（デフォルトで出力）
   */
  info: (message: string, ...args: unknown[]) => {
    log(LogLevel.INFO, 'INFO', message, ...args);
  },

  /**
   * デバッグログ（デバッグ時のみ出力）
   */
  debug: (message: string, ...args: unknown[]) => {
    log(LogLevel.DEBUG, 'DEBUG', message, ...args);
  },

  /**
   * 現在のログレベルを取得
   */
  getCurrentLevel: () => currentLogLevel,

  /**
   * ログレベル名を取得
   */
  getLevelName: (level: LogLevelType) => {
    return Object.entries(LogLevel).find(([, value]) => value === level)?.[0] || 'UNKNOWN';
  }
};