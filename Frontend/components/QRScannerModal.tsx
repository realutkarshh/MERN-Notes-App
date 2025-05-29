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
  
  // Use refs to prevent race conditions and ensure immediate state changes
  const isProcessingRef = useRef(false);
  const hasProcessedRef = useRef(false);
  const lastProcessedCodeRef = useRef<string>("");

  const handleScanSuccess = async (text: string) => {
    // Triple check to prevent any duplicates
    if (isProcessingRef.current || hasProcessedRef.current || lastProcessedCodeRef.current === text) {
      console.log("Scan blocked - already processing or duplicate");
      return;
    }

    // Immediately set flags to block any further processing
    isProcessingRef.current = true;
    hasProcessedRef.current = true;
    lastProcessedCodeRef.current = text;
    setProcessing(true);

    console.log("Processing QR code:", text);

    try {
      // Stop scanner immediately to prevent further scans
      if (scanner) {
        console.log("Stopping scanner...");
        await scanner.stop();
        await scanner.clear();
        setScanner(null);
      }

      const shareData = JSON.parse(text);
      if (!shareData.noteId || !shareData.title) {
        throw new Error("Invalid QR code format");
      }

      console.log("Calling receiveSharedNote...");
      await receiveSharedNote(shareData);
      
      console.log("Note received successfully, calling callbacks...");
      onNoteReceived();
      
      // Close modal after successful processing
      setTimeout(() => {
        handleClose();
      }, 1000); // Small delay to show success

    } catch (err: any) {
      console.error("QR Scan error:", err);
      setError(err.message || "Failed to process QR code");
      
      // Reset flags on error so user can try again
      isProcessingRef.current = false;
      hasProcessedRef.current = false;
      lastProcessedCodeRef.current = "";
      setProcessing(false);
    }
  };

  const handleScanError = (err: string) => {
    // Only log significant errors
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

    console.log("Making API request to receive note...");
    
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

    const result = await res.json();
    console.log("API response:", result);

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
    if (!scannerRef.current || isProcessingRef.current || scanner) {
      console.log("Cannot start scanner - conditions not met");
      return;
    }

    try {
      console.log("Starting QR scanner...");
      const scannerInstance = new Html5Qrcode("qr-scanner");
      setScanner(scannerInstance);

      await scannerInstance.start(
        { facingMode: "environment" },
        {
          fps: 2, // Further reduced FPS
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        handleScanSuccess,
        handleScanError
      );
      
      console.log("QR scanner started successfully");
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setError("Camera access denied or unavailable");
    }
  };

  const stopScanner = async () => {
    if (scanner) {
      try {
        console.log("Stopping scanner...");
        await scanner.stop();
        await scanner.clear();
        console.log("Scanner stopped successfully");
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      setScanner(null);
    }
  };

  const handleClose = async () => {
    console.log("Closing QR scanner modal...");
    
    // Reset all states and refs
    isProcessingRef.current = false;
    hasProcessedRef.current = false;
    lastProcessedCodeRef.current = "";
    setProcessing(false);
    setError(null);
    
    await stopScanner();
    onClose();
  };

  const resetAndRetry = async () => {
    console.log("Resetting scanner for retry...");
    
    // Reset all flags
    isProcessingRef.current = false;
    hasProcessedRef.current = false;
    lastProcessedCodeRef.current = "";
    setProcessing(false);
    setError(null);
    
    // Restart scanner
    await stopScanner();
    setTimeout(startScanner, 500);
  };

  useEffect(() => {
    if (isOpen) {
      console.log("QR Scanner modal opened");
      
      // Reset all states when opening
      isProcessingRef.current = false;
      hasProcessedRef.current = false;
      lastProcessedCodeRef.current = "";
      setProcessing(false);
      setError(null);
      
      // Start scanner with delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      console.log("QR Scanner modal closed");
      stopScanner();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("QR Scanner component unmounting");
      isProcessingRef.current = false;
      hasProcessedRef.current = false;
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Adding note to your collection...</p>
            <p className="text-sm text-gray-500 mt-2">This will only take a moment</p>
          </div>
        ) : (
          <div>
            <p className="text-center text-gray-600 mb-4">
              Point your camera at the QR code to receive a shared note
            </p>
            <div 
              id="qr-scanner" 
              ref={scannerRef} 
              className="w-full bg-gray-100 rounded-lg min-h-[250px] flex items-center justify-center"
            />
            <button
              onClick={handleClose}
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={processing}
            >
              Cancel Scanning
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center mb-2">{error}</p>
                <button
                  onClick={resetAndRetry}
                  className="w-full px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
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