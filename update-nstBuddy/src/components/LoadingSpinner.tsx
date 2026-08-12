import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
    showRenderMessage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = 'Loading...',
    showRenderMessage = false
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
                {/* Outer spinning ring */}
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>

                {/* Inner pulsing dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
                </div>
            </div>

            <p className="mt-4 text-gray-700 font-medium">{message}</p>

            {showRenderMessage && (
                <div className="mt-4 max-w-md text-center">
                    <p className="text-sm text-gray-600 bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
                        ⏳ <span className="font-semibold">Wait karlo yaar, Render load ho raha hai!</span>
                        <br />
                        <span className="text-xs text-gray-500 mt-1 block">
                            Server is waking up from sleep mode (takes ~30-45 seconds)
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default LoadingSpinner;
