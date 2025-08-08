import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// A mapping from notification type to its corresponding icon and color classes
const notificationStyles = {
  success: {
    icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
    classes: 'bg-green-50 border-green-400 text-green-800',
  },
  error: {
    icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
    classes: 'bg-red-50 border-red-400 text-red-800',
  },
  info: {
    icon: <Info className="h-6 w-6 text-blue-600" />,
    classes: 'bg-blue-50 border-blue-400 text-blue-800',
  },
};

const Notification = () => {
  // Consume the notification state and the function to clear it from the context
  const { notification, setNotification } = useContext(AppContext);

  // If there's no notification, don't render anything
  if (!notification) {
    return null;
  }

  // Get the style configuration for the current notification type, defaulting to 'info'
  const style = notificationStyles[notification.type] || notificationStyles.info;

  return (
    // The container is fixed to the top-right of the screen with a high z-index
    <div
      className={`fixed top-5 right-5 z-[100] max-w-sm w-full rounded-lg border-l-4 p-4 shadow-xl transition-transform transform-gpu animate-slide-in ${style.classes}`}
      role="alert"
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className="flex-shrink-0">
          {style.icon}
        </div>

        {/* Message */}
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{notification.message}</p>
        </div>

        {/* Close Button */}
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={() => setNotification(null)}
            className={`-mx-1.5 -my-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg p-1.5 ${style.classes} hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2`}
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Add a simple slide-in animation using CSS
const styles = document.createElement('style');
styles.innerHTML = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .animate-slide-in {
    animation: slide-in 0.5s ease-out forwards;
  }
`;
document.head.appendChild(styles);

export default Notification;
