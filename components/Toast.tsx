import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // fade in
    setVisible(true);

    // after 5s, start fade out
    const hideTimer = setTimeout(() => setVisible(false), 5000);

    // once fade-out transition is over, call onDone
    const cleanupTimer = setTimeout(onDone, 5500);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(cleanupTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        bg-red-600 text-white
        px-4 py-2 rounded-lg shadow-lg
        transform transition-all duration-500
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
    >
      {message}
    </div>
  );
}