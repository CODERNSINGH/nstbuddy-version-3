import React from 'react';
import { imagePreviewUrl } from '../../services/imagekit';

interface ImageGridProps {
    images: string[];
    onImageClick: (index: number) => void;
}

const Thumb: React.FC<{ src: string; onClick: () => void; className?: string }> = ({ src, onClick, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative overflow-hidden bg-gray-100 group ${className}`}
    >
        <img
            src={imagePreviewUrl(src, 700)}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover group-hover:brightness-95 transition-[filter]"
        />
    </button>
);

const ImageGrid: React.FC<ImageGridProps> = ({ images, onImageClick }) => {
    if (images.length === 0) return null;

    const wrapperClass = 'mt-3 rounded-2xl overflow-hidden border border-gray-100';

    if (images.length === 1) {
        return (
            <div className={wrapperClass}>
                <Thumb src={images[0]} onClick={() => onImageClick(0)} className="w-full max-h-[500px]" />
            </div>
        );
    }

    if (images.length === 2) {
        return (
            <div className={`${wrapperClass} grid grid-cols-2 gap-0.5 aspect-[16/9]`}>
                {images.map((src, i) => (
                    <Thumb key={src} src={src} onClick={() => onImageClick(i)} className="h-full" />
                ))}
            </div>
        );
    }

    if (images.length === 3) {
        return (
            <div className={`${wrapperClass} grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[16/9]`}>
                <Thumb src={images[0]} onClick={() => onImageClick(0)} className="row-span-2 h-full" />
                <Thumb src={images[1]} onClick={() => onImageClick(1)} className="h-full" />
                <Thumb src={images[2]} onClick={() => onImageClick(2)} className="h-full" />
            </div>
        );
    }

    if (images.length === 4) {
        return (
            <div className={`${wrapperClass} grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[16/9]`}>
                {images.map((src, i) => (
                    <Thumb key={src} src={src} onClick={() => onImageClick(i)} className="h-full" />
                ))}
            </div>
        );
    }

    // 5 images: top row of 2, bottom row of 3
    return (
        <div className={`${wrapperClass} grid grid-cols-6 grid-rows-2 gap-0.5 aspect-[16/10]`}>
            <Thumb src={images[0]} onClick={() => onImageClick(0)} className="col-span-3 h-full" />
            <Thumb src={images[1]} onClick={() => onImageClick(1)} className="col-span-3 h-full" />
            <Thumb src={images[2]} onClick={() => onImageClick(2)} className="col-span-2 h-full" />
            <Thumb src={images[3]} onClick={() => onImageClick(3)} className="col-span-2 h-full" />
            <Thumb src={images[4]} onClick={() => onImageClick(4)} className="col-span-2 h-full" />
        </div>
    );
};

export default ImageGrid;
