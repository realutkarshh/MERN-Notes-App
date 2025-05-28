"use client";

import { useState, useEffect } from "react";
import { X, Download, Copy, Check } from "lucide-react";
import QRCode from "react-qr-code";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
}

export default function QRCodeModal({ isOpen, onClose, noteId }: QRCodeModalProps) {
  const [shareData, setShareData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && noteId) {
      fetchShareData();
    }
  }, [isOpen, noteId]);

  const fetchShareData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("auth-token") || 
                   localStorage.getItem("token") || 
                   localStorage.getItem("authToken") || 
                   localStorage.getItem("jwt");

      if (!token) {
        throw new Error("Please log in to share notes");
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mern-notes-app-gtab.onrender.com/api";
      
      const res = await fetch(`${baseUrl}/notes/share/${noteId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

    //   const res = await fetch(`http://localhost:5000/api/notes/share/${noteId}`, {
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${token}`,
    //     },
    //   });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate share data");
      }

      const data = await res.json();
      setShareData(data.shareData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (shareData) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(shareData));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }
  };

  const handleDownloadQR = () => {
    if (!shareData) return;
    
    // Create a canvas element to convert SVG to image
    const svg = document.querySelector('#qr-code-svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 300;
      ctx?.drawImage(img, 0, 0, 300, 300);
      
      // Download the image
      const link = document.createElement('a');
      link.download = `note-qr-${noteId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Share Note</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchShareData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : shareData ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Scan this QR code to share your note with others
            </p>
            
            {/* QR Code */}
            <div className="flex justify-center mb-6 p-4 bg-gray-50 rounded-lg">
              <QRCode
                id="qr-code-svg"
                value={JSON.stringify(shareData)}
                size={200}
                level="M"
                // includeMargin={true}
              />
            </div>

            {/* Note Info */}
            <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Sharing:</h3>
              <p className="text-sm text-gray-600">{shareData.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                Tag: {shareData.tag}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleCopyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Data"}
              </button>
              <button
                onClick={handleDownloadQR}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              The person scanning this code will get a copy of your note added to their account.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}