import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadToCloudinary } from '../services/cloudinary';
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AIUploadPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

const AIUploadPopup: React.FC<AIUploadPopupProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [fileName, setFileName] = useState('');
    const [userEmail, setUserEmail] = useState(user?.email || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ACCEPTED_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.ms-powerpoint'
    ];

    const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.doc', '.ppt'];

    if (!isOpen) return null;

    const validateFile = (file: File): boolean => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(fileExtension)) {
            setError('Please upload only PDF, DOCX, or PPTX files');
            return false;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            setError('File size must be less than 50MB');
            return false;
        }

        setError('');
        return true;
    };

    const handleFileSelect = (file: File) => {
        if (validateFile(file)) {
            setSelectedFile(file);
            if (!fileName) {
                setFileName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !fileName.trim()) {
            setError('Please select a file and enter a file name');
            return;
        }

        if (!userEmail.trim()) {
            setError('Please enter your email address');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const result = await uploadToCloudinary(selectedFile, fileName, userEmail);

            if (result.success && result.url) {
                setUploadedUrl(result.url);
                setUploadSuccess(true);

                // Reset form after 3 seconds
                setTimeout(() => {
                    resetForm();
                }, 3000);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFileName('');
        setUserEmail(user?.email || '');
        setSelectedFile(null);
        setUploadSuccess(false);
        setUploadedUrl('');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        if (!uploading) {
            resetForm();
            onClose();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 rounded-t-xl">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">
                                AI Model Training Contribution
                            </h2>
                            <p className="text-emerald-100 text-sm">
                                Help improve our AI-powered learning assistant
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={uploading}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Info Message */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
                        <h3 className="font-bold text-gray-900 mb-3 text-base">About This Initiative</h3>
                        <p className="text-gray-700 text-sm leading-relaxed mb-3">
                            We are currently fine-tuning <strong>Llama 3.1</strong> to create an intelligent assistant specifically for NST students.
                            Your contributions will help train the model to provide accurate, context-aware responses. if you want to be part of training process you can contact us at <strong>narendra.singh2024@nst.rishihood.edu.in</strong>
                        </p>
                        <div className="space-y-2">
                            <p className="text-gray-700 text-sm font-semibold">The AI will have knowledge about:</p>
                            <ul className="grid grid-cols-2 gap-2 text-gray-700 text-sm">
                                <li className="flex items-start">
                                    <span className="text-emerald-600 mr-2">•</span>
                                    <span>Exam dates & schedules</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-emerald-600 mr-2">•</span>
                                    <span>Class timetables</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-emerald-600 mr-2">•</span>
                                    <span>Course materials & notes</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-emerald-600 mr-2">•</span>
                                    <span>Subject information</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-emerald-600 mr-2">•</span>
                                    <span>Upcoming events</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-emerald-600 mr-2">•</span>
                                    <span>Faculty details</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Success Message */}
                    {uploadSuccess && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-green-900 text-sm">Upload Successful</p>
                                <p className="text-sm text-green-700 mt-1">
                                    Thank you for contributing to the AI model training
                                </p>
                                {uploadedUrl && (
                                    <a
                                        href={uploadedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-emerald-600 hover:underline mt-2 inline-block"
                                    >
                                        View uploaded file
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* File Upload Area */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload Document
                        </label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragging
                                ? 'border-emerald-500 bg-emerald-50'
                                : selectedFile
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.pptx,.doc,.ppt"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            {selectedFile ? (
                                <div className="flex flex-col items-center gap-3">
                                    <FileText className="w-12 h-12 text-green-600" />
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                        }}
                                        className="text-sm text-red-600 hover:underline"
                                    >
                                        Remove file
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <Upload className="w-12 h-12 text-gray-400" />
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">
                                            Drag and drop your file here
                                        </p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            or click to browse
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Supported formats: PDF, DOCX, PPTX (Maximum 50MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* File Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            File Name
                        </label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="e.g., Data Structures Notes"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Your Email
                        </label>
                        <input
                            type="email"
                            value={userEmail}
                            readOnly
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-gray-600 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Your email will be used to track contributions
                        </p>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !selectedFile || !fileName.trim() || uploadSuccess}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Uploading...</span>
                            </>
                        ) : uploadSuccess ? (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                <span>Uploaded Successfully</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                <span>Upload and Contribute</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIUploadPopup;
