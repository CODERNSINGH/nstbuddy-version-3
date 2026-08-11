import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Loader2, AlertTriangle } from 'lucide-react';
import { uploadImageToImageKit } from '../../services/imagekit';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB - generous enough for uncompressed iPhone HEIC photos

interface PendingImage {
    localId: string;
    previewUrl: string;
    progress: number;
    uploadedUrl: string | null;
    error: string | null;
}

interface ImagePickerProps {
    idToken: string | null;
    images: string[]; // uploaded CDN URLs, lifted to the parent
    onChange: (images: string[]) => void;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ idToken, images, onChange }) => {
    const [pending, setPending] = useState<PendingImage[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const remainingSlots = MAX_IMAGES - images.length - pending.length;

    const handleFiles = async (fileList: FileList | null) => {
        if (!fileList || !idToken) return;
        const files = Array.from(fileList).slice(0, remainingSlots);
        if (files.length === 0) return;

        const newPending: PendingImage[] = files.map((file) => ({
            localId: `${file.name}-${Date.now()}-${Math.random()}`,
            previewUrl: URL.createObjectURL(file),
            progress: 0,
            uploadedUrl: null,
            error: file.size > MAX_FILE_SIZE ? 'File too large (max 20MB)' : null,
        }));
        setPending((prev) => [...prev, ...newPending]);

        files.forEach((file, i) => {
            const item = newPending[i];
            if (item.error) return;

            uploadImageToImageKit(file, idToken, (pct) => {
                setPending((prev) => prev.map((p) => (p.localId === item.localId ? { ...p, progress: pct } : p)));
            })
                .then((url) => {
                    setPending((prev) => prev.filter((p) => p.localId !== item.localId));
                    onChange([...images, url]);
                })
                .catch(() => {
                    setPending((prev) => prev.map((p) => (p.localId === item.localId ? { ...p, error: 'Upload failed' } : p)));
                });
        });
    };

    const removeUploaded = (url: string) => onChange(images.filter((u) => u !== url));
    const removePending = (localId: string) => setPending((prev) => prev.filter((p) => p.localId !== localId));

    return (
        <div className="mt-2">
            {(images.length > 0 || pending.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                    <AnimatePresence>
                        {images.map((url) => (
                            <motion.div
                                key={url}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group"
                            >
                                <img src={`${url}?tr=f-auto,w-200,h-200,c-maintain_ratio`} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeUploaded(url)}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))}
                        {pending.map((item) => (
                            <motion.div
                                key={item.localId}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="relative aspect-square rounded-xl overflow-hidden border border-gray-200"
                            >
                                <img src={item.previewUrl} alt="" className="w-full h-full object-cover opacity-60" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    {item.error ? (
                                        <button
                                            type="button"
                                            onClick={() => removePending(item.localId)}
                                            className="flex flex-col items-center gap-1 text-white text-[10px] font-semibold px-1 text-center"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            {item.error}
                                        </button>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1">
                                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                                            <span className="text-[10px] font-semibold text-white">{item.progress}%</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={!idToken || remainingSlots <= 0}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                    <ImagePlus className="w-4 h-4" />
                    {images.length + pending.length === 0 ? 'Add photos' : `Add more (${remainingSlots} left)`}
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,.heic,.heif"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        handleFiles(e.target.files);
                        e.target.value = '';
                    }}
                />
            </div>
        </div>
    );
};

export default ImagePicker;
