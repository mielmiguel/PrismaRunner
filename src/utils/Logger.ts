export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE'

const LEVEL_ORDER: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
}

type LogArgs = unknown[]

const isLogLevel = (value: unknown): value is LogLevel => {
  return value === 'DEBUG' || value === 'INFO' || value === 'WARN' || value === 'ERROR' || value === 'NONE'
}

const getGlobalLevel = (): LogLevel => {
  const w = window as any
  if (isLogLevel(w.__PR_LOG_LEVEL)) {
    return w.__PR_LOG_LEVEL
  }
  return import.meta.env.DEV ? 'DEBUG' : 'WARN'
}

const formatTime = (time: number): string => {
  const d = new Date(time)
  const pad = (n: number, size = 2) => n.toString().padStart(size, '0')

  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(
    d.getMilliseconds(),
    3,
  )}`
}

export class Logger {
  private namespace: string

  constructor(namespace: string) {
    this.namespace = namespace
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_ORDER[level] >= LEVEL_ORDER[getGlobalLevel()]
  }

  private log(level: LogLevel, message: string, args: LogArgs): void {
    if (!this.shouldLog(level)) return

    const time = formatTime(performance.now())
    const prefix = `[${time}] [${level}] [${this.namespace}]`

    // eslint-disable-next-line no-console
    let fn: (...data: unknown[]) => void
    switch (level) {
      case 'ERROR':
        fn = console.error
        break
      case 'WARN':
        fn = console.warn
        break
      case 'INFO':
        fn = console.info
        break
      case 'DEBUG':
      default:
        fn = console.debug
        break
    }

    fn(prefix, message, ...args)
  }

  debug(message: string, ...args: LogArgs): void {
    this.log('DEBUG', message, args)
  }

  info(message: string, ...args: LogArgs): void {
    this.log('INFO', message, args)
  }

  warn(message: string, ...args: LogArgs): void {
    this.log('WARN', message, args)
  }

  error(message: string, ...args: LogArgs): void {
    this.log('ERROR', message, args)
  }
}

export const createLogger = (namespace: string): Logger => new Logger(namespace)

