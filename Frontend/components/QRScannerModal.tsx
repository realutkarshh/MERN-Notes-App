"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, Upload } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteReceived: () => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onNoteReceived,
}: QRScannerModalProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processedCodes, setProcessedCodes] = useState<Set<string>>(new Set());
  const processingRef = useRef(false); // Additional ref to prevent race conditions

  const handleScanSuccess = async (text: string) => {
    // Prevent multiple processing of the same QR code
    if (processingRef.current || processedCodes.has(text)) {
      return;
    }

    processingRef.current = true;
    setProcessing(true);
    
    // Add to processed codes immediately to prevent duplicates
    setProcessedCodes(prev => new Set([...prev, text]));

    try {
      const shareData = JSON.parse(text);
      if (!shareData.noteId || !shareData.title) {
        throw new Error("Invalid QR code format");
      }

      // Stop the scanner immediately after successful scan
      if (scanner) {
        await scanner.stop();
        await scanner.clear();
        setScanner(null);
      }

      await receiveSharedNote(shareData);
      onNoteReceived();
      handleClose();
    } catch (err: any) {
      console.error("QR Scan error:", err);
      setError(err.message || "Failed to process QR code");
      // Remove from processed codes if there was an error
      setProcessedCodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(text);
        return newSet;
      });
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const handleScanError = (err: string) => {
    // Only log significant errors, ignore routine scanning messages
    if (!err.includes("NotFoundException") && !err.includes("No QR code found")) {
      console.warn("QR scan error:", err);
    }
  };

  const receiveSharedNote = async (shareData: any) => {
    const token =
      localStorage.getItem("auth-token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt");

    if (!token) throw new Error("Please log in to receive notes");

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://mern-notes-app-gtab.onrender.com/api";

    const res = await fetch(`${baseUrl}/notes/receive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shareData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to add shared note");
    }

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Note Added Successfully!", {
        body: `"${shareData.title}" has been added to your notes`,
        icon: "/favicon.ico",
      });
    } else {
      alert("Note Added Successfully!");
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current || processing || processingRef.current) return;

    try {
      const scannerInstance = new Html5Qrcode("qr-scanner");
      setScanner(scannerInstance);

      await scannerInstance.start(
        { facingMode: "environment" },
        {
          fps: 5, // Reduced FPS to prevent excessive scanning
          qrbox: 250,
          aspectRatio: 1.0,
        },
        handleScanSuccess,
        handleScanError
      );
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setError("Camera access denied or unavailable");
    }
  };

  const stopScanner = async () => {
    if (scanner && !processingRef.current) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      setScanner(null);
    }
  };

  const handleClose = async () => {
    processingRef.current = false;
    setProcessing(false);
    await stopScanner();
    onClose();
    setError(null);
    // Clear processed codes when closing
    setProcessedCodes(new Set());
  };

  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setProcessedCodes(new Set());
      processingRef.current = false;
      setProcessing(false);
      setError(null);
      
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        startScanner();
      }, 100);
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      processingRef.current = false;
      stopScanner();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Scan QR Code</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={processing}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scanner */}
        {processing ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing QR code...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait...</p>
          </div>
        ) : (
          <div>
            <p className="text-center text-gray-600 mb-4">
              Point your camera at the QR code
            </p>
            <div id="qr-scanner" ref={scannerRef} className="w-full" />
            <button
              onClick={handleClose}
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={processing}
            >
              Stop Scanning
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setProcessedCodes(new Set());
                    startScanner();
                  }}
                  className="w-full mt-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}