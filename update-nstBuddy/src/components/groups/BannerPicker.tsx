import React, { useRef, useState } from 'react';
import { ImagePlus, X, Loader2, AlertTriangle } from 'lucide-react';
import { uploadImageToImageKit, imagePreviewUrl } from '../../services/imagekit';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface BannerPickerProps {
    idToken: string | null;
    bannerUrl: string | null;
    onChange: (url: string | null) => void;
}

const BannerPicker: React.FC<BannerPickerProps> = ({ idToken, bannerUrl, onChange }) => {
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File | undefined) => {
        if (!file || !idToken) return;
        setError('');
        if (file.size > MAX_FILE_SIZE) {
            setError('File too large (max 20MB)');
            return;
        }

        setLocalPreview(URL.createObjectURL(file));
        setUploading(true);
        uploadImageToImageKit(file, idToken, setProgress)
            .then((url) => {
                onChange(url);
                setLocalPreview(null);
            })
            .catch(() => setError('Upload failed - try again'))
            .finally(() => setUploading(false));
    };

    const displayUrl = bannerUrl ? imagePreviewUrl(bannerUrl, 900) : localPreview;

    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Banner image (optional)</label>

            {displayUrl ? (
                <div className="relative aspect-[3/1] rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={displayUrl} alt="" className={`w-full h-full object-cover ${uploading ? 'opacity-50' : ''}`} />
                    {uploading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/10">
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                            <span className="text-[10px] font-semibold text-white">{progress}%</span>
                        </div>
                    )}
                    {!uploading && (
                        <button
                            type="button"
                            onClick={() => { onChange(null); setLocalPreview(null); }}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={!idToken}
                    className="w-full aspect-[3/1] rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 transition-colors flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-brand-600 disabled:opacity-50"
                >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-xs font-semibold">Add a cover image</span>
                </button>
            )}

            {error && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-1.5">
                    <AlertTriangle className="w-3 h-3" /> {error}
                </p>
            )}

            <input
                ref={inputRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = '';
                }}
            />
        </div>
    );
};

export default BannerPicker;
