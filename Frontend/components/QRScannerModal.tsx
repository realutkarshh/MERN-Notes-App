"use client";

import { useState, useRef } from "react";
import { X, Camera, Upload } from "lucide-react";
import { QrReader } from "react-qr-reader";

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
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScan = async (result: any) => {
    if (result && !processing) {
      setProcessing(true);
      setError(null);

      try {
        // Parse the QR code data
        const shareData = JSON.parse(result.text);

        // Validate the data structure
        if (!shareData.noteId || !shareData.title) {
          throw new Error("Invalid QR code format");
        }

        // Send the note data to backend
        await receiveSharedNote(shareData);

        // Success - close modal and refresh notes
        onNoteReceived();
        onClose();
        setScanning(false);
      } catch (err: any) {
        console.error("QR Scan error:", err);
        setError(err.message || "Failed to process QR code");
        setProcessing(false);
      }
    }
  };

  const receiveSharedNote = async (shareData: any) => {
    const token =
      localStorage.getItem("auth-token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt");

    if (!token) {
      throw new Error("Please log in to receive notes");
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://mern-notes-app-gtab.onrender.com/api";

    // const baseUrl =
    //   "http://localhost:5000/api";

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

    const data = await res.json();

    // Show success toast (you can replace this with your toast system)
    if (typeof window !== "undefined") {
      // Simple browser notification - you can replace with your toast library
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Note Added Successfully!", {
          body: `"${shareData.title}" has been added to your notes`,
          icon: "/favicon.ico",
        });
      } else {
        // Fallback alert
        alert("Note Added Successfully!");
      }
    }

    return data;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to process the image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        // For simplicity, we'll show an error asking users to use camera
        // A full implementation would use a QR code detection library like jsQR
        setError(
          "Please use the camera scanner for now. File upload QR detection coming soon!"
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startScanning = async () => {
    setError(null);
    setScanning(true);

    // Request camera permission
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (err) {
      setError(
        "Camera access denied. Please allow camera access to scan QR codes."
      );
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    setProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Scan QR Code</h2>
          <button
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        {!scanning ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Scan a QR code to add a shared note to your collection
            </p>

            {/* Camera Scanner Button */}
            <button
              onClick={startScanning}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
            >
              <Camera className="h-5 w-5" />
              Start Camera Scanner
            </button>

            {/* File Upload Option */}
            <div className="relative">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="h-5 w-5" />
                Upload QR Code Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          </div>
        ) : (
          <div>
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

                {/* QR Scanner */}
                <div className="rounded-lg overflow-hidden">
                  <div style={{ width: "100%" }}>
                    <QrReader
                      onResult={handleScan}
                      constraints={{ facingMode: "environment" }}
                    />
                  </div>
                </div>

                <button
                  onClick={stopScanning}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Stop Scanning
                </button>

                {error && (
                  <p className="text-red-600 text-sm mt-4 text-center">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
