import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  User,
  Sparkles,
  Link as LinkIcon,
  RotateCcw,
  Check,
  X,
  FlipHorizontal,
  Image as ImageIcon,
  AlertCircle,
  Scissors
} from 'lucide-react';

export const STUDENT_AVATAR_PRESETS = {
  boys: [
    {
      id: 'boy-1',
      name: 'Garçon Élève 1',
      url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'boy-2',
      name: 'Garçon Élève 2',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'boy-3',
      name: 'Garçon Élève 3',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'boy-4',
      name: 'Garçon Élève 4',
      url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'boy-5',
      name: 'Garçon Primaire',
      url: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'boy-6',
      name: 'Garçon Collège',
      url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250'
    }
  ],
  girls: [
    {
      id: 'girl-1',
      name: 'Fille Élève 1',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'girl-2',
      name: 'Fille Élève 2',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'girl-3',
      name: 'Fille Élève 3',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'girl-4',
      name: 'Fille Élève 4',
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'girl-5',
      name: 'Fille Primaire',
      url: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 'girl-6',
      name: 'Fille Collège',
      url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=250'
    }
  ]
};

export function getDefaultAvatar(gender?: 'M' | 'F' | string): string {
  const g = (gender || 'M').toUpperCase();
  return g === 'F' || g === 'FEMININ' || g === 'FILLE'
    ? STUDENT_AVATAR_PRESETS.girls[0].url
    : STUDENT_AVATAR_PRESETS.boys[0].url;
}

// Compress and crop image to a lightweight square data URL (max 400x400)
export function processImageFile(file: File, callback: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 400;
      let w = img.width;
      let h = img.height;

      // Crop to square centering the face/subject
      const minEdge = Math.min(w, h);
      const sx = (w - minEdge) / 2;
      const sy = (h - minEdge) / 2;

      canvas.width = maxDim;
      canvas.height = maxDim;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, sx, sy, minEdge, minEdge, 0, 0, maxDim, maxDim);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        callback(compressed);
      } else {
        callback(e.target?.result as string);
      }
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

interface StudentPhotoPickerProps {
  photoUrl: string;
  onChange: (newPhotoUrl: string) => void;
  gender?: 'M' | 'F' | string;
  studentName?: string;
  compact?: boolean;
}

export const StudentPhotoPicker: React.FC<StudentPhotoPickerProps> = ({
  photoUrl,
  onChange,
  gender = 'M',
  studentName = "l'élève",
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'CAMERA' | 'PRESETS' | 'URL'>('UPLOAD');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [capturedFlash, setCapturedFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera stream safely
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Start webcam
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCameraStream();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès caméra n'est pas pris en charge par votre navigateur.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 640 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      let msg = "Impossible d'accéder à la caméra.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Permission caméra refusée. Veuillez autoriser l'accès à la webcam dans votre navigateur.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Aucune caméra détectée sur votre appareil.';
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  // Switch camera tab or leave
  useEffect(() => {
    if (activeTab === 'CAMERA') {
      startCamera(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [activeTab]);

  // Capture snapshot from webcam
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);

    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Crop square
      const sx = ((video.videoWidth || 480) - size) / 2;
      const sy = ((video.videoHeight || 480) - size) / 2;

      // Handle mirror if user facing
      if (facingMode === 'user') {
        ctx.translate(400, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      setCapturedFlash(true);
      setTimeout(() => setCapturedFlash(false), 300);

      onChange(dataUrl);
      stopCameraStream();
      setActiveTab('UPLOAD');
    }
  };

  // Handle file drop & upload
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, (dataUrl) => {
        onChange(dataUrl);
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file, (dataUrl) => {
        onChange(dataUrl);
      });
    }
  };

  const handleApplyUrl = () => {
    if (customUrlInput.trim()) {
      onChange(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  const handleResetToDefault = () => {
    onChange(getDefaultAvatar(gender));
  };

  const isCustomPhoto = photoUrl && !photoUrl.includes('unsplash.com/photo-1534528741775');

  return (
    <div className="space-y-3">
      {/* Top Banner / Photo Preview Row */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
        
        {/* Main Photo Avatar Container */}
        <div className="relative shrink-0 group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-lg border-2 border-indigo-200 dark:border-indigo-800 bg-slate-200 dark:bg-slate-700 relative">
            <img
              src={photoUrl || getDefaultAvatar(gender)}
              alt="Photo de l'élève"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getDefaultAvatar(gender);
              }}
            />
            {capturedFlash && (
              <div className="absolute inset-0 bg-white animate-ping opacity-75" />
            )}
          </div>

          <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-xl shadow-md border-2 border-white dark:border-slate-900" title="Photo officielle">
            <Camera className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Info & Fast Action Buttons */}
        <div className="flex-1 text-center sm:text-left space-y-2 w-full">
          <div>
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <span className="text-xs font-black uppercase text-slate-900 dark:text-white">
                Photo d'Identité Scolaire
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                Format 4x4 Badge
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Cette photo figurera sur la <strong>Carte Scolaire</strong>, le <strong>Dossier d'Inscription</strong> et les <strong>Bulletins</strong>.
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('UPLOAD');
                fileInputRef.current?.click();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] flex items-center space-x-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Choisir un fichier</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('CAMERA');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] flex items-center space-x-1.5 shadow-sm cursor-pointer transition-all"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Prendre photo (Webcam)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PRESETS')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-all"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Galerie</span>
            </button>

            {photoUrl && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-2 py-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-all"
                title="Rétablir l'avatar par défaut"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Rétablir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mode Subtabs for full customization */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'UPLOAD'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Fichier / Glisser-Déposer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CAMERA')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'CAMERA'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Caméra en Direct</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRESETS')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'PRESETS'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Avatars Prêts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('URL')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-black flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'URL'
                ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Lien Web</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-3.5">
          
          {/* TAB 1: FILE UPLOAD & DRAG/DROP */}
          {activeTab === 'UPLOAD' && (
            <div className="space-y-2.5">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleFileInput}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40'
                    : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-2">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                  Cliquez pour parcourir ou glissez l'image de l'élève ici
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Formats acceptés : PNG, JPG, JPEG, WEBP • Redimensionnement automatique en photo d'identité
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE WEBCAM CAPTURE */}
          {activeTab === 'CAMERA' && (
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-black">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Accès Caméra</span>
                  </div>
                  <p>{cameraError}</p>
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Réessayer
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('UPLOAD')}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Bascule vers Import Fichier
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Camera Video Stream Frame */}
                  <div className="relative mx-auto w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-slate-950 border-2 border-emerald-500 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />

                    {/* Passport Outline Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                      {/* Oval silhouette */}
                      <div className="w-36 h-48 border-2 border-emerald-400/70 border-dashed rounded-[50%] flex items-center justify-center">
                        <span className="text-[10px] font-black text-emerald-300 bg-slate-950/60 px-2 py-0.5 rounded-full">
                          Cadrez le visage
                        </span>
                      </div>
                    </div>

                    {/* Switch Camera Button if mobile/multi-cam */}
                    <button
                      type="button"
                      onClick={() => {
                        const newMode = facingMode === 'user' ? 'environment' : 'user';
                        setFacingMode(newMode);
                        startCamera(newMode);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs flex items-center space-x-1 backdrop-blur-sm cursor-pointer"
                      title="Changer de caméra (Avant / Arrière)"
                    >
                      <FlipHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Camera Capture Trigger */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={takeSnapshot}
                      className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transform hover:scale-105 active:scale-95 cursor-pointer transition-all"
                    >
                      <Camera className="h-4 w-4" />
                      <span>📸 Prendre la Photo de l'Élève</span>
                    </button>

                    <button
                      type="button"
                      onClick={stopCameraStream}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 cursor-pointer"
                      title="Arrêter la caméra"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: READY AVATAR PRESETS */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center space-x-1">
                  <span>👦 Profils Garçons (École & Collège)</span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {STUDENT_AVATAR_PRESETS.boys.map((item) => {
                    const isSelected = photoUrl === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.url)}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all group cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500 ring-offset-2'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                            <div className="bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1.5 flex items-center space-x-1">
                  <span>👧 Profils Filles (École & Collège)</span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {STUDENT_AVATAR_PRESETS.girls.map((item) => {
                    const isSelected = photoUrl === item.url;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.url)}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all group cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500 ring-offset-2'
                            : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                            <div className="bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXTERNAL WEB URL */}
          {activeTab === 'URL' && (
            <div className="space-y-2.5">
              <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300">
                Coller l'adresse URL directe de la photo :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://exemple.com/photos/eleve.jpg"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!customUrlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs cursor-pointer"
                >
                  Appliquer
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
