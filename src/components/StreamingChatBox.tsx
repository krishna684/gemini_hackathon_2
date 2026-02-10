'use client';

import { useEffect, useRef } from 'react';

interface StreamingChatBoxProps {
    content: string;
    title?: string;
}

export default function StreamingChatBox({ content, title = 'EXPLANATION' }: StreamingChatBoxProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [content]);

    return (
        <div style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
        }}>
            <div style={{
                fontSize: '0.75rem',
                color: '#FBBF24',
                fontWeight: 700,
                letterSpacing: '0.1em',
                marginBottom: '1rem',
                textTransform: 'uppercase',
            }}>
                {title}
            </div>

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    color: '#E5E7EB',
                    whiteSpace: 'pre-wrap',
                }}
            >
                {content || 'Awaiting input...'}
            </div>
        </div>
    );
}
