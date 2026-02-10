'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './Home.module.css';

const CoachingSession = dynamic(() => import('./CoachingSession'), {
    ssr: false,
    loading: () => (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#000',
            color: '#fff'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid rgba(255, 255, 255, 0.1)',
                    borderTopColor: '#FBBF24',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem'
                }}></div>
                <p style={{ fontSize: '1.25rem', color: '#FBBF24' }}>Loading Coaching Interface...</p>
            </div>
        </div>
    ),
});

export default function Home() {
    const [selectedMode, setSelectedMode] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleModeSelect = async (mode: string) => {
        setIsLoading(true);
        setSelectedMode(mode);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: 'user_' + Math.random().toString(36).substr(2, 9),
                    mode: mode,
                }),
            });

            const session = await response.json();
            console.log('Session created:', session);
            setSessionId(session.session_id);
        } catch (error) {
            console.error('Failed to create session:', error);
            alert('⚠️ Backend connection failed.\n\nMake sure the FastAPI server is running on port 8000.');
            setIsLoading(false);
            setSelectedMode(null);
        }
    };

    if (sessionId && selectedMode) {
        return (
            <CoachingSession
                mode={selectedMode}
                sessionId={sessionId}
                onExit={() => {
                    setSessionId(null);
                    setSelectedMode(null);
                    setIsLoading(false);
                }}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.bgOrb1}></div>
            <div className={styles.bgOrb2}></div>
            <div className={styles.bgOrb3}></div>

            <div className={styles.content}>
                <div className={styles.badge}>
                    <div className={styles.badgeDot}></div>
                    Powered by Gemini 3 Flash Preview
                </div>

                <h1 className={styles.title}>
                    <span className={styles.gradientText}>Socratic Mirror</span>
                </h1>

                <p className={styles.subtitle}>
                    AI-Powered Coaching with Real-Time Biometric Feedback
                </p>

                <div className={styles.tags}>
                    <div className={styles.tag}>
                        <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        University of Missouri
                    </div>
                    <span className={styles.dot}>•</span>
                    <div className={styles.tag}>
                        <svg className={styles.icon} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                        </svg>
                        Real-Time Analysis
                    </div>
                </div>

                <div className={styles.grid}>
                    <div
                        className={`${styles.card} ${styles.cardBlue}`}
                        onClick={() => !isLoading && handleModeSelect('tutoring')}
                        style={{
                            opacity: isLoading && selectedMode === 'tutoring' ? 0.6 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <div className={styles.cardIcon}>🧠</div>
                        <h3 className={styles.cardTitle}>Socratic Tutoring</h3>
                        <p className={styles.cardDesc}>Master concepts through guided questioning and critical thinking</p>
                        <div className={styles.cardArrow}>
                            <span>{isLoading && selectedMode === 'tutoring' ? 'Starting...' : 'Start Session'}</span>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    <div
                        className={`${styles.card} ${styles.cardYellow}`}
                        onClick={() => !isLoading && handleModeSelect('public_speaking')}
                        style={{
                            opacity: isLoading && selectedMode === 'public_speaking' ? 0.6 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <div className={styles.cardIcon}>🎯</div>
                        <h3 className={styles.cardTitle}>Public Speaking</h3>
                        <p className={styles.cardDesc}>Perfect your presentations with real-time delivery feedback</p>
                        <div className={styles.cardArrow}>
                            <span>{isLoading && selectedMode === 'public_speaking' ? 'Starting...' : 'Start Session'}</span>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    <div
                        className={`${styles.card} ${styles.cardGreen}`}
                        onClick={() => !isLoading && handleModeSelect('interview')}
                        style={{
                            opacity: isLoading && selectedMode === 'interview' ? 0.6 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <div className={styles.cardIcon}>💼</div>
                        <h3 className={styles.cardTitle}>Interview Mastery</h3>
                        <p className={styles.cardDesc}>Prepare for high-stakes interviews with AI evaluators</p>
                        <div className={styles.cardArrow}>
                            <span>{isLoading && selectedMode === 'interview' ? 'Starting...' : 'Start Session'}</span>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>❤️</div>
                        <div className={styles.featureLabel}>rPPG Heart Rate</div>
                        <div className={styles.featureSub}>Camera-based</div>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>👁️</div>
                        <div className={styles.featureLabel}>Gaze Tracking</div>
                        <div className={styles.featureSub}>Eye contact</div>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>🎙️</div>
                        <div className={styles.featureLabel}>Voice Analysis</div>
                        <div className={styles.featureSub}>Quality metrics</div>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>📊</div>
                        <div className={styles.featureLabel}>Vibe Reports</div>
                        <div className={styles.featureSub}>Performance insights</div>
                    </div>
                </div>

                <div className={styles.disclaimer}>
                    <svg className={styles.disclaimerIcon} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p>Biometric monitoring requires webcam and microphone access</p>
                    <p className={styles.disclaimerSub}>Not medical-grade • For educational and coaching purposes only</p>
                </div>
            </div>
        </div>
    );
}
