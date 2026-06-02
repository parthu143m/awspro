"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getS3Images } from "../actions";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  const loadImages = async () => {
    try {
      setStatus("loading");
      setErrorMessage("");
      const result = await getS3Images();
      if (result.success) {
        setImages(result.images);
        setFilteredImages(result.images);
        setStatus("success");
      } else {
        throw new Error("Could not retrieve S3 objects.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to load images from S3. Please verify your AWS credentials.");
      setStatus("error");
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // Handle live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImages(images);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = images.filter(
        (img) => 
          img.name.toLowerCase().includes(query) || 
          img.key.toLowerCase().includes(query)
      );
      setFilteredImages(filtered);
    }
  }, [searchQuery, images]);

  const handleCopyLink = (url, key) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  // Helper to format byte size nicely
  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Helper to format S3 date
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white p-6 md:p-12 overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 right-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-purple-400 uppercase bg-purple-950/40 px-3 py-1 rounded-full border border-purple-800/30 w-max mb-3">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path>
              </svg>
              Cloud Gallery
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              AWS S3 Vault
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Browse, search, and manage your cloud-hosted images in real time
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadImages}
              disabled={status === "loading"}
              className="flex items-center justify-center p-3 bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-zinc-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh S3 images"
            >
              <svg className={`w-5 h-5 ${status === "loading" ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2M5.58 9a8.003 8.003 0 0113.8-3.4M4 9h5"></path>
              </svg>
            </button>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white rounded-xl px-5 py-3 text-sm font-semibold transition-all shadow-lg shadow-purple-500/10 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>Upload Portal</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        {images.length > 0 && (
          <div className="relative max-w-md w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search images by name or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/60 backdrop-blur border border-zinc-800/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200"
            />
          </div>
        )}

        {/* Display Status states */}
        {status === "loading" ? (
          /* LOADING GRID SKELETON */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 h-80 flex flex-col justify-between">
                <div className="w-full h-44 bg-zinc-800/50 rounded-xl" />
                <div className="space-y-2 mt-4">
                  <div className="h-4 bg-zinc-800/50 rounded-md w-2/3" />
                  <div className="h-3 bg-zinc-800/50 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : status === "error" ? (
          /* ERROR SCREEN */
          <div className="p-8 text-center bg-rose-500/5 border border-rose-500/10 rounded-3xl max-w-xl mx-auto space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Connection Error</h3>
              <p className="mt-1 text-sm text-zinc-400">{errorMessage}</p>
            </div>
            <button
              onClick={loadImages}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold border border-zinc-800 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filteredImages.length === 0 ? (
          /* EMPTY STATE */
          <div className="text-center py-16 bg-zinc-900/20 border border-zinc-850 rounded-3xl max-w-xl mx-auto space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">No Images Found</h3>
              <p className="mt-2 text-sm text-zinc-400">
                {searchQuery ? "No images match your search query." : "Your AWS S3 folder `uploads/` is currently empty."}
              </p>
            </div>
            {!searchQuery && (
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-6 py-3 text-sm font-bold transition-all cursor-pointer"
              >
                Go Upload First Image
              </Link>
            )}
          </div>
        ) : (
          /* IMAGE GALLERY GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((img) => (
              <div 
                key={img.key} 
                className="group relative bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-850 hover:border-zinc-700/60 rounded-2xl p-4 shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image Display */}
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-zinc-950 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`https://images.weserv.nl/?url=${encodeURIComponent(img.url)}&w=800&q=85&output=webp`} 
                    alt={img.name} 
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                    <span className="text-[10px] bg-purple-600/90 text-white font-semibold rounded px-2 py-0.5 w-max backdrop-blur-sm truncate max-w-full">
                      {img.key}
                    </span>
                    <div className="flex justify-between items-center text-xs text-zinc-300">
                      <span>{formatBytes(img.size)}</span>
                      <span>{formatDate(img.lastModified)}</span>
                    </div>
                  </div>
                </div>

                {/* Info & Action Area */}
                <div className="mt-4 flex flex-col gap-3">
                  <div className="space-y-0.5 text-left">
                    <h3 className="text-base font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                      {img.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono truncate">
                      Last Modified: {new Date(img.lastModified).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyLink(img.url, img.key)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 active:scale-[0.98] text-white rounded-xl py-2.5 text-xs font-semibold border border-zinc-850 transition-all cursor-pointer"
                    >
                      {copiedKey === img.key ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                          </svg>
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <a
                      href={img.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex p-2.5 bg-purple-650 hover:bg-purple-650/90 active:scale-[0.95] text-white rounded-xl border border-purple-800/20 transition-all cursor-pointer"
                      title="Open full size image in S3"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
