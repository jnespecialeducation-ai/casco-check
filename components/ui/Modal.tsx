"use client";

import { type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in duration-200">
        {title && (
          <h2 className="text-lg font-bold text-secondary mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
