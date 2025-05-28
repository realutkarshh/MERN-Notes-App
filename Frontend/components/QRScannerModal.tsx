"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const [success, setSuccess] = useState(false);
  
  // Multiple refs to prevent any race conditions
  const isProcessingRef = useRef(false);
  const hasProcessedRef = useRef(false);
  const currentRequestRef = useRef<AbortController | null>(null);
  const scannerStartedRef = useRef(false);

  // Debounced success handler to prevent rapid calls
  const handleScanSuccess = useCallback(async (text: string) => {
    // Multiple checks to ensure single execution
    if (isProcessingRef.current || hasProcessedRef.current || processing || success) {
      console.log("Scan blocked: already processing or completed");
      return;
    }

    // Immediately set all flags
    isProcessingRef.current = true;
    hasProcessedRef.current = true;
    setProcessing(true);

    console.log("Processing QR code...");

    try {
      // Stop scanner immediately to prevent further scans
      await stopScannerImmediate();

      const shareData = JSON.parse(text);
      if (!shareData.noteId || !shareData.title) {
        throw new Error("Invalid QR code format");
      }

      // Create abort controller for this request
      const abortController = new AbortController();
      currentRequestRef.current = abortController;

      await receiveSharedNote(shareData, abortController.signal);
      
      // Only proceed if request wasn't aborted
      if (!abortController.signal.aborted) {
        setSuccess(true);
        console.log("Note received successfully");
        
        // Small delay before triggering callback to ensure UI updates
        setTimeout(() => {
          onNoteReceived();
          handleClose();
        }, 500);
      }
    } catch (err: any) {
      console.error("QR Scan error:", err);
      
      // Reset flags on error so user can try again
      isProcessingRef.current = false;
      hasProcessedRef.current = false;
      setProcessing(false);
      
      if (err.name !== 'AbortError') {
        setError(err.message || "Failed to process QR code");
      }
    }
  }, [processing, success, onNoteReceived]);

  const handleScanError = useCallback((err: string) => {
    // Only log significant errors
    if (!err.includes("NotFoundException") && !err.includes("No QR code found")) {
      console.warn("QR scan error:", err);
    }
  }, []);

  const receiveSharedNote = async (shareData: any, signal: AbortSignal) => {
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
      signal, // Add abort signal to request
    });

    if (signal.aborted) {
      throw new Error("Request aborted");
    }

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to add shared note");
    }

    const result = await res.json();
    
    if (!signal.aborted) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Note Added Successfully!", {
          body: `"${shareData.title}" has been added to your notes`,
          icon: "/favicon.ico",
        });
      }
    }
    
    return result;
  };

  const stopScannerImmediate = async () => {
    if (scanner && scannerStartedRef.current) {
      try {
        await scanner.stop();
        await scanner.clear();
        scannerStartedRef.current = false;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      setScanner(null);
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current || isProcessingRef.current || hasProcessedRef.current || scannerStartedRef.current) {
      return;
    }

    try {
      const scannerInstance = new Html5Qrcode("qr-scanner");
      setScanner(scannerInstance);

      await scannerInstance.start(
        { facingMode: "environment" },
        {
          fps: 3, // Further reduced FPS
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        handleScanSuccess,
        handleScanError
      );
      
      scannerStartedRef.current = true;
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setError("Camera access denied or unavailable");
      scannerStartedRef.current = false;
    }
  };

  const handleClose = useCallback(async () => {
    console.log("Closing scanner modal");
    
    // Abort any ongoing request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
      currentRequestRef.current = null;
    }

    // Stop scanner
    await stopScannerImmediate();
    
    // Reset all states and refs
    isProcessingRef.current = false;
    hasProcessedRef.current = false;
    scannerStartedRef.current = false;
    setProcessing(false);
    setSuccess(false);
    setError(null);
    
    onClose();
  }, [onClose]);

  const resetAndRetry = useCallback(() => {
    // Reset all flags and states
    isProcessingRef.current = false;
    hasProcessedRef.current = false;
    scannerStartedRef.current = false;
    setProcessing(false);
    setSuccess(false);
    setError(null);
    
    // Abort any ongoing request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
      currentRequestRef.current = null;
    }
    
    // Restart scanner after a brief delay
    setTimeout(() => {
      startScanner();
    }, 100);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reset everything when opening
      isProcessingRef.current = false;
      hasProcessedRef.current = false;
      scannerStartedRef.current = false;
      setProcessing(false);
      setSuccess(false);
      setError(null);
      
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
        currentRequestRef.current = null;
      }
      
      // Start scanner with delay to ensure modal is rendered
      const timer = setTimeout(() => {
        startScanner();
      }, 200);
      
      return () => clearTimeout(timer);
    } else {
      // Clean up when closing
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
        currentRequestRef.current = null;
      }
      stopScannerImmediate();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
        currentRequestRef.current = null;
      }
      stopScannerImmediate();
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

        {/* Content */}
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600">Note has been added to your collection.</p>
            <p className="text-sm text-gray-500 mt-2">Closing in a moment...</p>
          </div>
        ) : processing ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing QR Code</h3>
            <p className="text-gray-600">Adding note to your collection...</p>
            <p className="text-sm text-gray-500 mt-2">Please do not close this window</p>
          </div>
        ) : (
          <div>
            <p className="text-center text-gray-600 mb-4">
              Point your camera at the QR code
            </p>
            <div 
              id="qr-scanner" 
              ref={scannerRef} 
              className="w-full border rounded-lg overflow-hidden"
              style={{ minHeight: '250px' }}
            />
            <button
              onClick={handleClose}
              className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={processing}
            >
              Cancel Scanning
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center mb-3">{error}</p>
                <button
                  onClick={resetAndRetry}
                  className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  disabled={processing}
                >
                  Try Again
                </button>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-xs text-center">
                💡 Hold your device steady and ensure the QR code is well-lit and within the frame
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}