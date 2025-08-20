import React from 'react';
import { Loader2, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import type { LoadingState, APIError } from '../types/api';

// Loading spinner component
export function LoadingSpinner({ 
  size = 'md', 
  className = '',
  text = 'Loading...'
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

// Skeleton loading component
export function Skeleton({ 
  className = '',
  lines = 1,
  height = 'h-4'
}: {
  className?: string;
  lines?: number;
  height?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-200 rounded animate-pulse`}
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

// Card skeleton for list items
export function CardSkeleton({ 
  className = '',
  showImage = false,
  lines = 3
}: {
  className?: string;
  showImage?: boolean;
  lines?: number;
}) {
  return (
    <div className={`bg-white shadow rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-4">
        {showImage && (
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton lines={lines} />
        </div>
      </div>
    </div>
  );
}

// List skeleton for multiple items
export function ListSkeleton({ 
  count = 5,
  className = '',
  showImage = false
}: {
  count?: number;
  className?: string;
  showImage?: boolean;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} showImage={showImage} />
      ))}
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ 
  rows = 5,
  columns = 4,
  className = ''
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse flex-1" />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className="h-3 bg-gray-200 rounded animate-pulse flex-1"
                  style={{ width: `${Math.random() * 40 + 60}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error state component
export function ErrorState({ 
  error,
  onRetry,
  className = '',
  title = 'Something went wrong',
  showRetry = true
}: {
  error?: APIError | Error | string;
  onRetry?: () => void;
  className?: string;
  title?: string;
  showRetry?: boolean;
}) {
  const errorMessage = error instanceof Error ? error.message : 
                      typeof error === 'string' ? error : 
                      error?.message || 'An unexpected error occurred';

  return (
    <div className={`text-center py-8 ${className}`}>
      <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
}

// Success state component
export function SuccessState({ 
  message,
  className = '',
  showIcon = true
}: {
  message: string;
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <div className={`text-center py-4 ${className}`}>
      {showIcon && <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />}
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

// Empty state component
export function EmptyState({ 
  icon: Icon,
  title,
  description,
  action,
  className = ''
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-center py-8 ${className}`}>
      <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

// Loading overlay component
export function LoadingOverlay({ 
  isLoading,
  children,
  className = ''
}: {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    </div>
  );
}

// Progress bar component
export function ProgressBar({ 
  progress,
  className = '',
  showPercentage = false
}: {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center space-x-2 mb-1">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
        {showPercentage && (
          <span className="text-sm text-gray-600 w-12 text-right">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Button loading state
export function LoadingButton({ 
  isLoading,
  children,
  loadingText = 'Loading...',
  disabled,
  className = '',
  ...props
}: {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={isLoading || disabled}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Status indicator component
export function StatusIndicator({ 
  status,
  className = ''
}: {
  status: 'loading' | 'success' | 'error' | 'idle';
  className?: string;
}) {
  const statusConfig = {
    loading: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    success: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' },
    error: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100' },
    idle: { icon: AlertCircle, color: 'text-gray-500', bgColor: 'bg-gray-100' }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
}

// Enhanced loading state hook
export function useLoadingState(initialState: LoadingState = { isLoading: false, error: null }) {
  const [state, setState] = React.useState<LoadingState>(initialState);

  const setLoading = React.useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: isLoading ? null : prev.error }));
  }, []);

  const setError = React.useCallback((error: APIError | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const retry = React.useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    retry
  };
}
