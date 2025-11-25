// src/utils/toast.ts
import { toast, ToastContent } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Shared base styling
const baseOptions = {
  position: 'top-center' as const,
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'light' as const,
  style: {
    background: '#004aba',
    color: '#ffffff',
    borderRadius: '12px',
    fontWeight: '600',
  },
  progressStyle: {
    background: '#ffffff',
  },
};

// Custom success icon
const SuccessIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#28a745" />
    <path d="M7 12.5L10.5 16L17 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Custom error icon
const ErrorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#dc3545" />
    <path d="M8 8L16 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M16 8L8 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Custom warning icon
const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#ffc107" />
    <path d="M12 8V12" stroke="#004aba" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill="#004aba" />
  </svg>
);

// Custom info icon
const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#17a2b8" />
    <path d="M12 8V12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1" fill="white" />
  </svg>
);

// Default icon
const DefaultIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#ffffff" />
    <circle cx="12" cy="12" r="6" fill="#004aba" />
  </svg>
);

// Type-safe toast function
type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

export function showToast(
  message: ToastContent,
  type: ToastType = 'default'
): void;

export function showToast(
  options: { message: ToastContent; type?: ToastType }
): void;

export function showToast(
  messageOrOptions: ToastContent | { message: ToastContent; type?: ToastType },
  type: ToastType = 'default'
): void {
  let message: ToastContent = '';
  let toastType: ToastType = 'default';

  if (typeof messageOrOptions === 'object' && messageOrOptions !== null && 'message' in messageOrOptions) {
    message = messageOrOptions.message;
    toastType = messageOrOptions.type ?? 'default';
  } else {
    message = messageOrOptions as ToastContent;
    toastType = type;
  }

  const config = {
    ...baseOptions,
    icon:
      toastType === 'success' ? <SuccessIcon /> :
      toastType === 'error' ? <ErrorIcon /> :
      toastType === 'warning' ? <WarningIcon /> :
      toastType === 'info' ? <InfoIcon /> :
      <DefaultIcon />,
  };

  switch (toastType) {
    case 'success':
      toast.success(message, config);
      break;
    case 'error':
      toast.error(message, config);
      break;
    case 'warning':
      toast.warn(message, config);
      break;
    case 'info':
      toast.info(message, config);
      break;
    default:
      toast(message, config);
      break;
  }
}