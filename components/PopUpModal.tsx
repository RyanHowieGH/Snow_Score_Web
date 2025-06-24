'use client'; // Add if any hooks like useState/useEffect are used, or if it's interactive

import React, { ReactNode, MouseEvent } from 'react'; // Import MouseEvent
import { X } from "react-feather";

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactNode;
    modalId?: string; // Make modalId optional
}

export default function Modal({ open, onClose, children, modalId }: ModalProps) {
  if (!open) { // Early return if not open, simplifies a bit
    return null;
  }

  const handleBackdropClick = () => {
    onClose();
  };

  const handleModalContentClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent click inside modal from closing it
  };

  return (
    // backdrop
    <div
      // id={modalId ? `${modalId}-backdrop` : undefined} // Optional: if you need to ID the backdrop
      onClick={handleBackdropClick}
      className={`
        fixed inset-0 flex justify-center items-center transition-colors z-50
        ${open ? "visible bg-black/20 backdrop-blur-sm" : "invisible"}
      `}
      role="dialog" // Accessibility: indicates this is a dialog
      aria-modal="true" // Accessibility: indicates it's a modal dialog
      aria-labelledby={modalId ? `${modalId}-title` : undefined} // If you have a title
    >
      {/* modal content */}
      <div
        id={modalId} // Use the modalId here if provided
        onClick={handleModalContentClick}
        className={`
          bg-base-100 dark:bg-neutral-800 rounded-xl shadow-2xl p-6 transition-all
          max-w-md w-full mx-4  /* Responsive width */
          ${open ? "scale-100 opacity-100" : "scale-125 opacity-0"}
        `}
        role="document" // Accessibility for the content part of the dialog
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        {/* Example: Add an accessible title if you pass a title prop */}
        {/* {title && <h3 id={modalId ? `${modalId}-title` : undefined} className="font-bold text-lg mb-4">{title}</h3>} */}
        {children}
      </div>
    </div>
  );
}