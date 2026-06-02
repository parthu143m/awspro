"use client";

import React, { useState } from "react";
import Link from "next/link";
import { uploadImageToS3 } from "./actions";

export default function Home() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageName, setImageName] = useState("");
  
  // Status states: "idle" | "uploading" | "success" | "error"
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      if (!imageName) {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setImageName(baseName);
      }
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      if (!imageName) {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setImageName(baseName);
      }
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setErrorMessage("Please select an image first!");
      setStatus("error");
      return;
    }

    try {
      setStatus("uploading");
      setErrorMessage("");

      // 1. Package the file and custom name into FormData
      const formData = new FormData();
      formData.append("image", image);
      formData.append("name", imageName);

      // 2. Trigger the server-side S3 upload
      const result = await uploadImageToS3(formData);
      
      if (!result.success) {
        throw new Error("S3 upload failed on the server.");
      }

      // 3. Display success screen and file URL
      setUploadedUrl(result.fileUrl);
      setStatus("success");
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during S3 upload. Check server logs for details.");
      setStatus("error");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(uploadedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview("");
    setImageName("");
    setUploadedUrl("");
    setStatus("idle");
    setErrorMessage("");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6 overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main glass card */}
      <div className="relative w-full max-w-lg bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl transition-all duration-300 hover:shadow-purple-500/5">
        
        {status === "success" ? (
          /* SUCCESS SCREEN */
          <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Upload Successful!</h2>
              <p className="mt-1.5 text-sm text-zinc-400">Your image has been safely stored in AWS S3.</p>
            </div>

            {/* Display uploaded file card */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imagePreview} 
                  alt="Uploaded preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left space-y-1">
                <div className="text-[10px] tracking-wider text-zinc-500 font-bold uppercase">Assigned Image Name</div>
                <div className="text-sm font-semibold text-white truncate">{imageName}</div>
              </div>
            </div>

            {/* URL Actions */}
            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-700/80 text-white rounded-xl py-3.5 text-sm font-semibold border border-zinc-700 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                    </svg>
                    <span>Copy S3 Public URL</span>
                  </>
                )}
              </button>

              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-[0.99] text-white rounded-xl py-3.5 text-sm font-semibold transition-all shadow-lg shadow-purple-500/10 cursor-pointer text-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                <span>Open S3 Object</span>
              </a>
            </div>

            <div className="pt-2">
              <button
                onClick={handleReset}
                className="text-xs font-semibold text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Upload Another Image
              </button>
            </div>
          </div>
        ) : (
          /* UPLOAD FORM OR UPLOADING/ERROR STATES */
          <>
            <div className="text-center mb-8 relative">
              <span className="text-xs font-bold tracking-widest text-purple-400 uppercase bg-purple-950/40 px-3 py-1 rounded-full border border-purple-800/30">
                S3 Secure Portal
              </span>
              <Link 
                href="/gallery"
                className="absolute -top-3 right-0 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-all flex items-center gap-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2 cursor-pointer shadow-md"
              >
                <span>S3 Gallery</span>
                <svg className="w-3.5 h-3.5 transition-transform duration-200 hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </Link>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                AWS Cloud Upload
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Upload your images directly to AWS S3 bucket
              </p>
            </div>

            {status === "error" && errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs leading-relaxed space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-rose-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <span>Upload Failed</span>
                </div>
                <div>{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Input Container */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-300">
                  Select or Drop Image
                </label>
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 transition-all duration-300 group ${
                    status === "uploading" ? "pointer-events-none opacity-50" : "cursor-pointer"
                  } ${
                    imagePreview 
                      ? "border-emerald-500/40 bg-emerald-950/5 hover:border-emerald-400/60" 
                      : "border-zinc-700 bg-zinc-900/40 hover:border-purple-500/50 hover:bg-zinc-800/20"
                  }`}
                >
                  {status !== "uploading" && (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  )}
                  
                  {imagePreview ? (
                    <div className="w-full space-y-4 text-center z-20">
                      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-800 shadow-inner group-hover:scale-[1.01] transition-transform duration-300">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        {status !== "uploading" && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs font-semibold text-white bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                              Change Image
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 truncate max-w-xs mx-auto">
                        {image.name}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 z-20">
                      <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-950/40 group-hover:text-purple-400 transition-all duration-300 text-zinc-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <p className="mt-4 text-sm font-medium text-zinc-300">
                        Click to upload or drag & drop
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        PNG, JPG, WEBP up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Name Input Container */}
              <div className="space-y-2">
                <label htmlFor="image-name" className="text-sm font-semibold text-zinc-300">
                  Image Name
                </label>
                <div className="relative">
                  <input
                    id="image-name"
                    type="text"
                    disabled={status === "uploading"}
                    placeholder="Enter a descriptive name"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/55 focus:border-purple-500 transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === "uploading"}
                className="w-full relative group overflow-hidden rounded-xl p-[1px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <span className={`absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-emerald-500 transition-all duration-300 ${status === "uploading" ? "opacity-100" : "group-hover:opacity-100"}`} />
                <div className="relative px-6 py-3.5 bg-zinc-950 rounded-[11px] transition-colors group-hover:bg-zinc-950/90 text-sm font-bold tracking-wide flex items-center justify-center gap-2">
                  {status === "uploading" ? (
                    <>
                      {/* Loading Spinner */}
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Uploading to S3...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload to AWS S3</span>
                      <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

