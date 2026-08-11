import api from './api';

interface ImageKitAuthParams {
    token: string;
    expire: number;
    signature: string;
    publicKey: string;
    urlEndpoint: string;
}

const getAuthParams = async (idToken: string): Promise<ImageKitAuthParams> => {
    const response = await api.get('/imagekit/auth', {
        headers: { Authorization: `Bearer ${idToken}` },
    });
    return response.data;
};

// Uploads directly to ImageKit's servers using a short-lived signature from our
// backend - the file bytes never pass through our own API. Accepts any image
// format the browser can select, including iPhone HEIC/HEIF - ImageKit stores
// the original and we request an auto-format transform when displaying it.
export const uploadImageToImageKit = async (file: File, idToken: string, onProgress?: (pct: number) => void): Promise<string> => {
    const { token, expire, signature, publicKey } = await getAuthParams(idToken);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name || `post-${Date.now()}`);
    formData.append('folder', '/community-posts');
    formData.append('publicKey', publicKey);
    formData.append('token', token);
    formData.append('expire', String(expire));
    formData.append('signature', signature);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300 && data.url) {
                    resolve(data.url as string);
                } else {
                    reject(new Error(data.message || 'Upload failed'));
                }
            } catch {
                reject(new Error('Upload failed'));
            }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
    });
};

// Appends an ImageKit transformation that auto-selects a browser-safe output
// format (converts HEIC/TIFF/etc to JPEG/WebP as needed) and caps width for the feed.
export const imagePreviewUrl = (url: string, width = 900) => `${url}?tr=f-auto,w-${width},q-80`;
