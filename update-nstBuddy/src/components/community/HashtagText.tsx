import React from 'react';

interface HashtagTextProps {
    content: string;
    onHashtagClick?: (tag: string) => void;
}

const TOKEN_RE = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g;

const HashtagText: React.FC<HashtagTextProps> = ({ content, onHashtagClick }) => {
    const parts = content.split(TOKEN_RE);

    return (
        <>
            {parts.map((part, i) => {
                if (/^#[a-zA-Z0-9_]+$/.test(part)) {
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onHashtagClick?.(part.slice(1).toLowerCase());
                            }}
                            className="text-emerald-600 font-semibold hover:underline"
                        >
                            {part}
                        </button>
                    );
                }
                if (/^@[a-zA-Z0-9_]+$/.test(part)) {
                    return (
                        <span key={i} className="text-emerald-700/80 font-semibold">
                            {part}
                        </span>
                    );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </>
    );
};

export default HashtagText;
