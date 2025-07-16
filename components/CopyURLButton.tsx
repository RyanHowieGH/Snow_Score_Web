'use client';
import React from 'react';
import { toast } from "react-hot-toast";

interface CopyUrlButtonProps {
  url: string;
}

export default function CopyUrlButton({ url }: CopyUrlButtonProps) {

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied");
    } catch (error) {
      console.error('Failed to copy URL', error);
      toast.error("Failed to copy URL");
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