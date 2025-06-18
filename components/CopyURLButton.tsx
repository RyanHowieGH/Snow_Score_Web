'use client';
import React from 'react';

interface CopyUrlButtonProps {
  url: string;
}

export default function CopyUrlButton({ url }: CopyUrlButtonProps) {

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      console.error('Failed to copy URL', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopyToClipboard}
      className="btn btn-outline btn-sm mt-2">
      copy URL
    </button>
  );
}