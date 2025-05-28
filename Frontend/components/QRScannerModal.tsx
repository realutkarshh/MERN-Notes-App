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

  const handleScanSuccess = async (text: string) => {
    if (processing) return;
    setProcessing(true);

    try {
      const shareData = JSON.parse(text);
      if (!shareData.noteId || !shareData.title) {
        throw new Error("Invalid QR code format");
      }

      await receiveSharedNote(shareData);
      onNoteReceived();
      handleClose();
    } catch (err: any) {
      console.error("QR Scan error:", err);
      setError(err.message || "Failed to process QR code");
      setProcessing(false);
    }
  };

  const handleScanError = (err: string) => {
    console.warn("QR scan error:", err);
    // Don’t set error repeatedly
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
    if (!scannerRef.current) return;

    try {
      const scannerInstance = new Html5Qrcode("qr-scanner");
      setScanner(scannerInstance);

      await scannerInstance.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: 250,
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
    if (scanner) {
      await scanner.stop();
      await scanner.clear();
      setScanner(null);
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
    setError(null);
    setProcessing(false);
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

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
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scanner */}
        {processing ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing QR code...</p>
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
            >
              Stop Scanning
            </button>
            {error && (
              <p className="text-red-600 text-sm mt-4 text-center">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
