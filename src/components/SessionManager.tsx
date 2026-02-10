'use client';

import { useState } from 'react';
import { CoachingMode } from '@/types';

interface SessionManagerProps {
    onSessionStart: (mode: CoachingMode) => void;
}

export default function SessionManager({ onSessionStart }: SessionManagerProps) {
    const [selectedMode, setSelectedMode] = useState<CoachingMode>('tutoring');

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">
                        Socratic Mirror Agent
                    </h1>
                    <p className="text-gray-400">Choose your coaching mode</p>
                </div>

                <div className="space-y-4">
                    {(['tutoring', 'public_speaking', 'interview'] as CoachingMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setSelectedMode(mode)}
                            className={`w-full card p-6 text-left transition-all ${selectedMode === mode
                                    ? 'border-yellow-400 bg-yellow-400/5'
                                    : 'border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <h3 className="text-xl font-semibold mb-2 capitalize">
                                {mode.replace('_', ' ')}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {mode === 'tutoring' && 'Learn through Socratic questioning'}
                                {mode === 'public_speaking' && 'Practice presentations with feedback'}
                                {mode === 'interview' && 'Prepare for challenging interviews'}
                            </p>
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => onSessionStart(selectedMode)}
                    className="w-full btn btn-primary mt-6 text-lg py-4"
                >
                    Start Session
                </button>
            </div>
        </div>
    );
}
