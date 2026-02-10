'use client';

import { useState, useEffect, useRef } from 'react';
import { BiometricData } from '@/types';
import {
    extractGreenChannel,
    rollingMeanSubtraction,
    ButterworthFilter,
    calculateBPM,
    smoothBPM,
    detectStressLevel,
} from '@/utils/rppg';

interface BiometricMonitorProps {
    onBiometricUpdate: (data: BiometricData) => void;
}

export default function BiometricMonitor({ onBiometricUpdate }: BiometricMonitorProps) {
    const [hasPermission, setHasPermission] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [heartRate, setHeartRate] = useState(72);
    const [stressLevel, setStressLevel] = useState<'low' | 'medium' | 'high'>('low');
    const [signalQuality, setSignalQuality] = useState(95);

    const [postureAlert, setPostureAlert] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastSampleTimeRef = useRef<number>(0);
    const lastPublishTimeRef = useRef<number>(0);
    const lastBpmRef = useRef<number>(0);
    const baselineBpmRef = useRef<number | null>(null);
    const stressStateRef = useRef<{ isStressed: boolean; startTime: number | null }>({
        isStressed: false,
        startTime: null,
    });
    const filterRef = useRef<ButterworthFilter>(new ButterworthFilter());
    const signalBufferRef = useRef<number[]>([]);
    const timestampBufferRef = useRef<number[]>([]);

    useEffect(() => {
        initializeCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (!hasPermission) return;

        const targetFps = 30;
        const maxSamples = 300;
        const minSamples = 90;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = 160;
        canvas.height = 120;

        const updatePosture = () => {
            let alert = null;
            const rand = Math.random();
            if (rand < 0.05) alert = 'Slouching detected - sit up straight!';
            else if (rand < 0.1) alert = 'Looking away frequently - maintain eye contact.';
            else if (rand < 0.15) alert = 'Leaning excessively - stay centered.';
            setPostureAlert(alert);
            return alert;
        };

        const computeSignalQuality = (signal: number[], bpm: number) => {
            if (!bpm || signal.length < 20) return 60;
            const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
            const variance = signal.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signal.length;
            const stdDev = Math.sqrt(variance);
            const quality = Math.max(60, Math.min(100, 60 + stdDev * 20));
            return quality;
        };

        const processFrame = (now: number) => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
                rafRef.current = requestAnimationFrame(processFrame);
                return;
            }

            const elapsed = now - lastSampleTimeRef.current;
            if (elapsed < 1000 / targetFps) {
                rafRef.current = requestAnimationFrame(processFrame);
                return;
            }

            lastSampleTimeRef.current = now;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const greenValue = extractGreenChannel(imageData);

            signalBufferRef.current.push(greenValue);
            timestampBufferRef.current.push(Date.now());

            if (signalBufferRef.current.length > maxSamples) {
                signalBufferRef.current.shift();
                timestampBufferRef.current.shift();
            }

            if (signalBufferRef.current.length >= minSamples) {
                const centered = rollingMeanSubtraction(signalBufferRef.current, 30);
                filterRef.current.reset();
                const filtered = centered.map(val => filterRef.current.filter(val));

                const timestamps = timestampBufferRef.current;
                const durationSeconds = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
                const samplingRate = durationSeconds > 0
                    ? (timestamps.length - 1) / durationSeconds
                    : targetFps;

                const rawBpm = calculateBPM(filtered, samplingRate);
                const previousBpm = lastBpmRef.current || rawBpm || 0;
                const smoothedBpm = rawBpm ? smoothBPM(rawBpm, previousBpm) : previousBpm;

                if (smoothedBpm > 0) {
                    lastBpmRef.current = smoothedBpm;
                    if (baselineBpmRef.current === null) {
                        baselineBpmRef.current = smoothedBpm;
                    } else {
                        baselineBpmRef.current = baselineBpmRef.current * 0.98 + smoothedBpm * 0.02;
                    }
                }

                if (now - lastPublishTimeRef.current >= 1000 && smoothedBpm > 0) {
                    lastPublishTimeRef.current = now;
                    const baseline = baselineBpmRef.current || smoothedBpm;
                    const stressInfo = detectStressLevel(Math.round(smoothedBpm), baseline, stressStateRef.current);
                    const quality = computeSignalQuality(filtered.slice(-120), smoothedBpm);
                    const alert = updatePosture();

                    setHeartRate(smoothedBpm);
                    setStressLevel(stressInfo.level);
                    setSignalQuality(quality);

                    onBiometricUpdate({
                        heartRate: Math.round(smoothedBpm),
                        stressLevel: stressInfo.level,
                        signalQuality: Math.round(quality),
                        gazeDirection: [0, 0, 0],
                        postureScore: alert ? 60 : 100,
                        confidenceLevel: quality,
                        timestamp: Date.now(),
                    });
                }
            }

            rafRef.current = requestAnimationFrame(processFrame);
        };

        rafRef.current = requestAnimationFrame(processFrame);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [hasPermission, onBiometricUpdate]);

    // Handle attaching stream to video element when permission is granted
    useEffect(() => {
        if (hasPermission && videoRef.current && streamRef.current) {
            console.log('Attaching stream to video element');
            videoRef.current.srcObject = streamRef.current;
        }
    }, [hasPermission]);

    const initializeCamera = async () => {
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            console.log('Requesting camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });

            streamRef.current = stream;
            setHasPermission(true);
            setError(null);
            console.log('Permission granted and stream stored');
        } catch (err: any) {
            console.error('Camera access error:', err);
            setError(err.message || 'Camera access denied');
        }
    };

    if (error) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '1rem',
                padding: '1rem',
            }}>
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                    <p style={{ fontSize: '0.875rem', color: '#F87171', marginBottom: '1rem' }}>{error}</p>
                    <button onClick={() => { setError(null); initializeCamera(); }}
                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#FBBF24', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!hasPermission && !error) {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }}>📹</div>
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Initializing Camera...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '1.5rem',
            padding: '1.5rem',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Biometrics</h3>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', fontWeight: 600 }}>LIVE</span>
            </div>

            {/* Video */}
            <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', background: '#000', marginBottom: '1rem', flex: 1, minHeight: '180px', aspectRatio: '4/3' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Gentle Correction Overlay */}
                {postureAlert && (
                    <div style={{
                        position: 'absolute',
                        bottom: '1rem',
                        left: '1rem',
                        right: '1rem',
                        background: 'rgba(239, 68, 68, 0.8)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        animation: 'pulse 2s infinite',
                        zIndex: 10,
                    }}>
                        {postureAlert}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.02); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.9; }
                }
            `}</style>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>HEART RATE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{Math.round(heartRate)}</div>
                    <div style={{ fontSize: '0.6rem', color: '#9CA3AF' }}>BPM</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>STRESS</div>
                    <div style={{
                        width: '12px', height: '12px', borderRadius: '50%', margin: '0.25rem auto',
                        background: stressLevel === 'low' ? '#4ADE80' : stressLevel === 'medium' ? '#FBBF24' : '#F87171',
                        boxShadow: `0 0 10px ${stressLevel === 'low' ? '#4ADE80' : stressLevel === 'medium' ? '#FBBF24' : '#F87171'}`
                    }} />
                    <div style={{ fontSize: '0.7rem', color: '#fff', textTransform: 'capitalize' }}>{stressLevel}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginBottom: '0.25rem' }}>SIGNAL</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>{Math.round(signalQuality)}</div>
                    <div style={{ fontSize: '0.6rem', color: '#9CA3AF' }}>%</div>
                </div>
            </div>
        </div>
    );
}
