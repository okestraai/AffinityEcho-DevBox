import { toast, type ToastOptions } from 'react-toastify';
import { CheckCircle2, XCircle, AlertTriangle, Info, Bell, X } from 'lucide-react';
import type { ReactNode } from 'react';
import 'react-toastify/dist/ReactToastify.css';

type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

interface ToastTheme {
  accent: string;
  iconBg: string;
  iconColor: string;
  shadow: string;
  icon: ReactNode;
  progressClass: string;
  label: string;
}

const themes: Record<ToastType, ToastTheme> = {
  success: {
    accent: '#22c55e',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-500',
    shadow: 'rgba(34,197,94,0.12)',
    icon: <CheckCircle2 size={18} strokeWidth={2.5} />,
    progressClass: 'toast-progress--success',
    label: 'Success',
  },
  error: {
    accent: '#ef4444',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    shadow: 'rgba(239,68,68,0.12)',
    icon: <XCircle size={18} strokeWidth={2.5} />,
    progressClass: 'toast-progress--error',
    label: 'Error',
  },
  warning: {
    accent: '#f59e0b',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    shadow: 'rgba(245,158,11,0.12)',
    icon: <AlertTriangle size={18} strokeWidth={2.5} />,
    progressClass: 'toast-progress--warning',
    label: 'Warning',
  },
  info: {
    accent: '#8b5cf6',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-500',
    shadow: 'rgba(139,92,246,0.12)',
    icon: <Info size={18} strokeWidth={2.5} />,
    progressClass: 'toast-progress--info',
    label: 'Info',
  },
  default: {
    accent: '#6366f1',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    shadow: 'rgba(99,102,241,0.12)',
    icon: <Bell size={18} strokeWidth={2.5} />,
    progressClass: 'toast-progress--default',
    label: 'Notice',
  },
};

function ToastBody({ message, theme }: { message: ReactNode; theme: ToastTheme }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center w-8 h-8 min-w-[2rem] rounded-lg ${theme.iconBg} ${theme.iconColor}`}
      >
        {theme.icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-50">
          {theme.label}
        </span>
        <span className="text-[13px] font-medium leading-snug text-gray-800 break-words">
          {message}
        </span>
      </div>
    </div>
  );
}

function CloseBtn({ closeToast }: { closeToast?: () => void }) {
  return (
    <button
      type="button"
      aria-label="Close notification"
      onClick={closeToast}
      className="flex items-center justify-center w-6 h-6 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all duration-200 self-start mt-0.5"
    >
      <X size={14} strokeWidth={2.5} />
    </button>
  );
}

function buildConfig(theme: ToastTheme): ToastOptions {
  return {
    position: 'top-center',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    icon: false,
    progressClassName: theme.progressClass,
    style: {
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 14,
      borderLeft: `3px solid ${theme.accent}`,
      boxShadow: `0 8px 32px -4px ${theme.shadow}, 0 4px 12px -2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)`,
      padding: '14px 16px',
      minHeight: 'auto',
    },
    closeButton: CloseBtn,
  };
}

// Overloads
export function showToast(
  message: ReactNode,
  type?: ToastType
): void;

export function showToast(
  options: { message: ReactNode; type?: ToastType }
): void;

export function showToast(
  messageOrOptions: ReactNode | { message: ReactNode; type?: ToastType },
  type: ToastType = 'default'
): void {
  let message: ReactNode = '';
  let toastType: ToastType = 'default';

  if (typeof messageOrOptions === 'object' && messageOrOptions !== null && 'message' in messageOrOptions) {
    message = (messageOrOptions as { message: ReactNode; type?: ToastType }).message;
    toastType = (messageOrOptions as { message: ReactNode; type?: ToastType }).type ?? 'default';
  } else {
    message = messageOrOptions as ReactNode;
    toastType = type;
  }

  const theme = themes[toastType];
  const config = buildConfig(theme);
  const body = <ToastBody message={message} theme={theme} />;

  switch (toastType) {
    case 'success':
      toast.success(body, config);
      break;
    case 'error':
      toast.error(body, config);
      break;
    case 'warning':
      toast.warn(body, config);
      break;
    case 'info':
      toast.info(body, config);
      break;
    default:
      toast(body, config);
      break;
  }
}
