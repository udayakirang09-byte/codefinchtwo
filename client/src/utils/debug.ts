// Comprehensive debug logging system
export class DebugLogger {
  private static instance: DebugLogger;
  private logs: Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    category: string;
    message: string;
    data?: any;
  }> = [];

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', category: string, message: string, data?: any) {
    const logEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data
    };
    
    this.logs.push(logEntry);
    
    // Console logging with color coding
    const styles = {
      info: 'color: #2563eb; font-weight: bold;',
      warn: 'color: #d97706; font-weight: bold;',
      error: 'color: #dc2626; font-weight: bold;',
      debug: 'color: #059669; font-weight: bold;'
    };
    
    console.log(
      `%c[${level.toUpperCase()}] ${category}: ${message}`,
      styles[level],
      data || ''
    );
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  info(category: string, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.log('error', category, message, data);
  }

  debug(category: string, message: string, data?: any) {
    this.log('debug', category, message, data);
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global debug instance
export const debugLogger = DebugLogger.getInstance();

// Button click tracker
export const trackButtonClick = (buttonId: string, description: string, additionalData?: any) => {
  debugLogger.info('BUTTON_CLICK', `Button clicked: ${description}`, {
    buttonId,
    description,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    ...additionalData
  });
};

// API call tracker
export const trackApiCall = (method: string, endpoint: string, status: number, duration: number, data?: any) => {
  debugLogger.info('API_CALL', `${method} ${endpoint} - ${status}`, {
    method,
    endpoint,
    status,
    duration,
    timestamp: new Date().toISOString(),
    data
  });
};

// Navigation tracker
export const trackNavigation = (from: string, to: string, method: 'click' | 'scroll' | 'programmatic') => {
  debugLogger.info('NAVIGATION', `Navigation: ${from} → ${to}`, {
    from,
    to,
    method,
    timestamp: new Date().toISOString()
  });
};

// Error tracker
export const trackError = (category: string, error: any, context?: any) => {
  debugLogger.error('ERROR', `Error in ${category}: ${error.message || error}`, {
    category,
    error: error.toString(),
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

// Performance tracker
export const trackPerformance = (operation: string, duration: number, additionalData?: any) => {
  const level = duration > 2000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
  debugLogger[level]('PERFORMANCE', `${operation} took ${duration.toFixed(2)}ms`, {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
};

// Form validation tracker
export const trackFormValidation = (formName: string, isValid: boolean, errors?: any) => {
  debugLogger.info('FORM_VALIDATION', `Form ${formName}: ${isValid ? 'Valid' : 'Invalid'}`, {
    formName,
    isValid,
    errors,
    timestamp: new Date().toISOString()
  });
};