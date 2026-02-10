'use client';

import { useState, useEffect, useRef } from 'react';
import { CoachingMode, BiometricData, VibeReport as VibeReportType } from '@/types';
import BiometricMonitor from '@/components/BiometricMonitor';
import AvatarScene from '@/components/AvatarScene';
import AudioProcessor, { AudioEvent } from '@/components/AudioProcessor';
import SessionControls from '@/components/SessionControls';
import Whiteboard, { WhiteboardStep } from '@/components/Whiteboard';
import VibeReport from '@/components/VibeReport';

interface CoachingSessionProps {
    mode: string;
    sessionId: string;
    onExit: () => void;
}

const styles = {
    container: {
        minHeight: '100vh',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #000 50%, #0a0a0a 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
    },
    header: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '1rem 1.5rem',
        flexShrink: 0,
    },
    headerContent: {
        maxWidth: '1800px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sessionInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
    },
    modeTitle: {
        fontSize: '1.25rem',
        fontWeight: 700,
        margin: 0,
        background: 'linear-gradient(90deg, #FCD34D, #FBBF24)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    metrics: {
        display: 'flex',
        gap: '1.25rem',
    },
    metric: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    metricLabel: {
        fontSize: '0.875rem',
        color: '#9CA3AF',
    },
    metricValue: {
        fontSize: '1rem',
        fontWeight: 600,
        color: '#fff',
    },
    endButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 1.25rem',
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#F87171',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '0.75rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.3s',
        fontSize: '0.875rem',
    },
    main: {
        flex: 1,
        maxWidth: '1800px',
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) 2fr minmax(320px, 1fr)',
        gap: '1.5rem',
        alignItems: 'stretch',
        overflow: 'hidden',
    },
    leftColumn: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.5rem',
        height: '100%',
        overflow: 'hidden',
    },
    centerColumn: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'stretch',
    },
    rightColumn: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.5rem',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
    },
    avatarContainer: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '1.5rem',
        padding: '1.5rem',
        flex: 1,
        height: '100%',
        position: 'relative' as const,
        display: 'flex',
        flexDirection: 'column' as const,
    },
};

type SessionState = 'IDLE' | 'THINK' | 'SPEAK' | 'LISTEN';
type AvatarExpression = 'neutral' | 'happy' | 'thinking' | 'concerned' | 'excited';
type AvatarGesture = 'idle' | 'greeting' | 'explaining' | 'pointing';
type NarrationItem =
    | { kind: 'audio'; audio: { mime_type: string; data: string } }
    | { kind: 'text'; text: string };

export default function CoachingSession({ mode, sessionId, onExit }: CoachingSessionProps) {
    const [gameState, setGameState] = useState<'setup' | 'permissions' | 'active' | 'report'>('setup');
    const [setupInfo, setSetupInfo] = useState('');
    const [interviewJobDescription, setInterviewJobDescription] = useState('');
    const [interviewResumeText, setInterviewResumeText] = useState('');
    const [interviewResumeName, setInterviewResumeName] = useState('');
    const [speakingType, setSpeakingType] = useState('');
    const [speakingTopic, setSpeakingTopic] = useState('');
    const [speakingScriptText, setSpeakingScriptText] = useState('');
    const [speakingScriptName, setSpeakingScriptName] = useState('');
    const [isSessionActive, setIsSessionActive] = useState(true);
    const [biometricData, setBiometricData] = useState<BiometricData | null>(null);
    const [sessionState, setSessionState] = useState<SessionState>('IDLE');
    const [avatarState, setAvatarState] = useState<{ expression: AvatarExpression; gesture: AvatarGesture; isSpeaking: boolean }>({
        expression: 'neutral',
        gesture: 'idle',
        isSpeaking: false,
    });
    const [whiteboardSteps, setWhiteboardSteps] = useState<WhiteboardStep[]>([]);
    const [archivedTopics, setArchivedTopics] = useState<{ id: string, steps: WhiteboardStep[] }[]>([]);
    const [currentStepId, setCurrentStepId] = useState<number>(0);
    const [isPaused, setIsPaused] = useState(false);
    const [thinkingState, setThinkingState] = useState<'idle' | 'logic' | 'check_in'>('idle');
    const [checkInOptions, setCheckInOptions] = useState<string[]>([]);
    const [showReport, setShowReport] = useState(false);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [quickInput, setQuickInput] = useState('');
    const [finalReport, setFinalReport] = useState<VibeReportType | null>(null);
    const [voiceInputError, setVoiceInputError] = useState<string | null>(null);
    const [wsReconnectNonce, setWsReconnectNonce] = useState(0);
    const [isEnding, setIsEnding] = useState(false);

    const hasSentInitialRef = useRef(false);
    const narrationQueueRef = useRef<NarrationItem[]>([]);
    const isProcessingQueueRef = useRef(false);
    const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
    const whiteboardStepCounterRef = useRef(0);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectAttemptRef = useRef(0);
    const isEndingSessionRef = useRef(false);

    const allowFallbackTts = false;
    const baseTurnConfig = { silenceMsToCommit: 800, idleResultCommitMs: 800, minUtteranceChars: 5 };
    const turnConfig = mode === 'interview'
        ? { silenceMsToCommit: 1000, idleResultCommitMs: 1000, minUtteranceChars: 6 }
        : baseTurnConfig;
    const startButtonLabel =
        mode === 'tutoring'
            ? 'Start Tutoring'
            : mode === 'public_speaking'
                ? 'Start Speaking'
                : mode === 'interview'
                    ? 'Start Interview'
                    : 'Start Coaching';

    const sendWsJson = (payload: any, opts?: { setThink?: boolean; failMessage?: string; silentFailure?: boolean }) => {
        const failMessage = opts?.failMessage || 'Connection issue: could not send your message to AI.';
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            console.warn(failMessage, payload);
            if (!opts?.silentFailure) setVoiceInputError(failMessage);
            if (opts?.setThink) setSessionState('LISTEN');
            return false;
        }

        try {
            if (opts?.setThink) setSessionState('THINK');
            ws.send(JSON.stringify(payload));
            if (!opts?.silentFailure) setVoiceInputError(null);
            return true;
        } catch (error) {
            console.error('WebSocket send failed:', error);
            if (!opts?.silentFailure) setVoiceInputError(failMessage);
            if (opts?.setThink) setSessionState('LISTEN');
            return false;
        }
    };



    const enqueueNarrationItem = (item: NarrationItem): boolean => {
        if (!item) return false;
        narrationQueueRef.current.push(item);
        if (!isProcessingQueueRef.current) {
            processNarrationQueue();
        } else {
            setTimeout(() => processNarrationQueue(), 0);
        }
        return true;
    };

    const enqueueNarrationFromMessage = (message: any): boolean => {
        const text = message?.narration || message?.voice_text || message?.text;
        if (text) {
            return enqueueNarrationItem({ kind: 'text', text: String(text) });
        }
        return false;
    };

    // Lock a consistent TTS voice once available
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const selectVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            if (!voices || voices.length === 0) return;

            const rankedAmericanFemaleVoices = [
                'Microsoft Aria Online (Natural) - English (United States)',
                'Microsoft Jenny Online (Natural) - English (United States)',
                'Samantha',
                'Google US English',
                'Microsoft Zira Desktop - English (United States)',
            ];

            const exactMatch = rankedAmericanFemaleVoices
                .map(name => voices.find(v => v.name === name))
                .find(Boolean);

            if (exactMatch) {
                preferredVoiceRef.current = exactMatch;
                return;
            }

            const likelyFemaleUsVoice = voices.find(v =>
                v.lang?.toLowerCase() === 'en-us' &&
                /(aria|jenny|samantha|zira|female|woman|girl|alloy|nova|ava)/i.test(v.name)
            );

            if (likelyFemaleUsVoice) {
                preferredVoiceRef.current = likelyFemaleUsVoice;
                return;
            }

            const anyUsVoice = voices.find(v => v.lang?.toLowerCase() === 'en-us');
            preferredVoiceRef.current = anyUsVoice || voices[0];
        };

        selectVoice();
        window.speechSynthesis.addEventListener('voiceschanged', selectVoice);

        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', selectVoice);
        };
    }, []);



    // Initial message based on mode
    useEffect(() => {
        if (gameState === 'active' && ws && ws.readyState === WebSocket.OPEN && !hasSentInitialRef.current) {
            hasSentInitialRef.current = true;
            const initialMsg = mode === 'tutoring'
                ? `I want to learn about: ${setupInfo}. DO NOT greet me. Immediately start lesson Step 1 by explaining the core concept on the whiteboard.`
                : mode === 'interview'
                    ? `BEGIN_INTERVIEW::${JSON.stringify({
                        job_description: interviewJobDescription,
                        resume: interviewResumeText,
                    })}`
                    : `BEGIN_PUBLIC_SPEAKING::${JSON.stringify({
                        speaking_type: speakingType,
                        topic: speakingTopic,
                        script: speakingScriptText,
                    })}`;

            sendWsJson({
                type: 'user_speech',
                transcript: initialMsg,
            }, { setThink: true, failMessage: 'Could not send initial message to AI.' });
        }
    }, [
        gameState,
        ws,
        mode,
        setupInfo,
        interviewJobDescription,
        interviewResumeText,
        speakingType,
        speakingTopic,
        speakingScriptText,
    ]);

    useEffect(() => {
        if (!sessionId || !isSessionActive) return;
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        let shouldReconnect = true;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://localhost:8000';
        const websocket = new WebSocket(`${backendUrl.replace('http', 'ws')}/ws/coach/${sessionId}`);

        websocket.onopen = () => {
            console.log('WebSocket connected');
            reconnectAttemptRef.current = 0;
            setVoiceInputError(null);
        };

        websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('Invalid WS message payload:', event.data, error);
                setVoiceInputError('Received invalid response from server.');
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setVoiceInputError('Realtime connection error. Try again or use text input.');
        };

        websocket.onclose = () => {
            console.log('WebSocket disconnected');
            setWs(current => (current === websocket ? null : current));
            if (shouldReconnect && isSessionActive && !isEndingSessionRef.current) {
                reconnectAttemptRef.current += 1;
                const retryDelayMs = Math.min(5000, 500 * Math.pow(2, Math.min(reconnectAttemptRef.current, 4)));
                setVoiceInputError(`Connection lost. Reconnecting in ${(retryDelayMs / 1000).toFixed(1)}s...`);
                setSessionState('LISTEN');
                reconnectTimerRef.current = setTimeout(() => {
                    setWsReconnectNonce(prev => prev + 1);
                }, retryDelayMs);
            }
        };

        setWs(websocket);

        return () => {
            shouldReconnect = false;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            websocket.close();
        };
    }, [sessionId, isSessionActive, wsReconnectNonce]);

    const normalizeExpression = (expression?: string): AvatarExpression => {
        const value = (expression || '').toLowerCase();
        if (value.includes('concern')) return 'concerned';
        if (value.includes('think') || value.includes('skeptical')) return 'thinking';
        if (value.includes('happy') || value.includes('encouraging')) return 'happy';
        if (value.includes('excited')) return 'excited';
        return 'neutral';
    };

    const normalizeGesture = (gesture?: string): AvatarGesture => {
        const value = (gesture || '').toLowerCase();
        if (value.includes('point')) return 'pointing';
        if (value.includes('greet')) return 'greeting';
        if (value.includes('explain')) return 'explaining';
        return 'idle';
    };

    const allocateWhiteboardStepId = (preferred?: number): number => {
        if (
            typeof preferred === 'number' &&
            Number.isFinite(preferred) &&
            preferred > whiteboardStepCounterRef.current
        ) {
            whiteboardStepCounterRef.current = preferred;
            return preferred;
        }

        whiteboardStepCounterRef.current += 1;
        return whiteboardStepCounterRef.current;
    };

    const applyAvatarFromMessage = (message: any, fallbackGesture: AvatarGesture = 'idle') => {
        const avatar = message?.avatar_intent || message?.avatar_state || {};
        setAvatarState(prev => ({
            ...prev,
            expression: normalizeExpression(avatar?.expression),
            gesture: avatar?.gesture ? normalizeGesture(avatar.gesture) : fallbackGesture,
        }));
    };

    const pushFeedbackStep = (content?: any) => {
        if (content === undefined || content === null) return;
        const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        if (!text.trim()) return;
        const feedbackStepId = allocateWhiteboardStepId();

        setWhiteboardSteps(prev => [
            ...prev,
            {
                id: feedbackStepId,
                subtopic_id: 'feedback',
                narration: text,
                visual: { type: 'none', content: null },
            },
        ]);
        setCurrentStepId(feedbackStepId);
    };

    const processNarrationQueue = async () => {
        if (isProcessingQueueRef.current || isPaused || narrationQueueRef.current.length === 0) return;

        isProcessingQueueRef.current = true;
        const item = narrationQueueRef.current.shift();

        if (!item) {
            isProcessingQueueRef.current = false;
            setSessionState('LISTEN');
            return;
        }

        if (item.kind === 'text' && typeof window !== 'undefined') {
            const utterance = new SpeechSynthesisUtterance(item.text);
            const selectedVoice = preferredVoiceRef.current || window.speechSynthesis.getVoices()[0];
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.lang = 'en-US';

            await new Promise<void>((resolve) => {
                utterance.onstart = () => {
                    setAvatarState(prev => ({ ...prev, isSpeaking: true }));
                };
                utterance.onerror = () => {
                    setAvatarState(prev => ({ ...prev, isSpeaking: false }));
                    resolve();
                };
                utterance.onend = () => {
                    setAvatarState(prev => ({ ...prev, isSpeaking: false }));
                    resolve();
                };
                window.speechSynthesis.speak(utterance);
            });
        }

        isProcessingQueueRef.current = false;
        if (narrationQueueRef.current.length === 0) {
            setSessionState('LISTEN');
        } else {
            processNarrationQueue();
        }
    };

    const handleWebSocketMessage = (message: any) => {
        console.log('WS Message:', message.kind || message.type, message);
        setThinkingState('idle');

        const messageKind = message.kind || message.type || ((message.narration || message.voice_text || message.text) ? 'coach_response' : 'unknown');

        switch (messageKind) {

            case 'connected':
                setSessionState(prev => (prev === 'THINK' ? 'THINK' : 'LISTEN'));
                break;

            case 'step':
                setSessionState('SPEAK');
                setCheckInOptions([]);
                applyAvatarFromMessage(message, 'explaining');

                const stepId = allocateWhiteboardStepId(
                    typeof message.step === 'number' ? message.step : undefined
                );
                const newStep: WhiteboardStep = {
                    id: stepId,
                    subtopic_id: message.subtopic_id,
                    narration: message.narration,
                    visual: message.visual || { type: 'none' },
                };

                setWhiteboardSteps(prev => [...prev, newStep]);
                setCurrentStepId(stepId);
                if (!enqueueNarrationFromMessage(message)) {
                    setSessionState('LISTEN');
                }
                break;

            case 'meta':
                if (message.action === 'clear_whiteboard') {
                    setWhiteboardSteps(prev => {
                        if (prev.length > 0) {
                            const subtopic = prev[0].subtopic_id || 'Previous Topic';
                            setArchivedTopics(arch => [...arch, { id: subtopic, steps: prev }]);
                        }
                        return [];
                    });
                }
                break;

            case 'check_in':
                applyAvatarFromMessage(message, 'idle');
                setCheckInOptions(message.options || []);
                setSessionState('SPEAK');
                if (!enqueueNarrationFromMessage(message)) {
                    setSessionState('LISTEN');
                }
                break;

            case 'barge_in':
                setSessionState('SPEAK');
                applyAvatarFromMessage(message, 'pointing');
                if (!enqueueNarrationFromMessage(message)) {
                    setSessionState('LISTEN');
                }
                pushFeedbackStep(message.visual_content || message.text);
                break;

            case 'error':
                setSessionState('SPEAK');
                applyAvatarFromMessage(message, 'idle');
                if (!enqueueNarrationFromMessage(message)) {
                    setSessionState('LISTEN');
                }
                if (message.visual_content || message.message) pushFeedbackStep(message.visual_content || message.message);
                break;

            case 'coach_response':
                setSessionState('SPEAK');
                applyAvatarFromMessage(message, 'idle');
                if (!enqueueNarrationFromMessage(message)) {
                    setSessionState('LISTEN');
                }
                if (message.visual_content) pushFeedbackStep(message.visual_content);
                break;

            case 'session_started':
                console.log('Session started successfully');
                setSessionState('LISTEN');
                break;

            case 'session_ended':
                isEndingSessionRef.current = false;
                setIsEnding(false);
                if (message.report) {
                    setFinalReport(message.report);
                }
                setIsSessionActive(false);
                setShowReport(true);
                setGameState('report');
                break;
        }
    };

    const handleBiometricUpdate = (data: BiometricData) => {
        setBiometricData(data);
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        sendWsJson({
            type: 'biometric_data',
            data: {
                heart_rate: data.heartRate,
                stress_level: data.stressLevel,
                gaze_direction: data.gazeDirection,
                posture_score: data.postureScore,
                confidence_level: data.confidenceLevel,
                timestamp: data.timestamp,
            },
        }, { silentFailure: true });
    };



    const handleAudioEvent = (event: AudioEvent) => {
        if (!isSessionActive || isPaused) return;

        // Barge-in: Stop AI speaking if user starts talking
        if (event.kind === 'activity' && event.isSpeaking && typeof window !== 'undefined' && sessionState === 'SPEAK') {
            window.speechSynthesis.cancel();
            narrationQueueRef.current = [];
            setAvatarState(prev => ({ ...prev, isSpeaking: false }));
            isProcessingQueueRef.current = false;
            setSessionState('LISTEN');
        }

        switch (event.kind) {
            case 'activity':
                setThinkingState(event.isSpeaking ? 'logic' : 'idle');
                break;
            case 'utterance':
                console.log('Sending user speech:', event.text);
                sendWsJson(
                    {
                        type: 'user_speech',
                        transcript: event.text,
                    },
                    { setThink: true, failMessage: 'Voice captured, but failed to send to AI.' }
                );
                break;
            case 'error':
                console.error('AudioProcessor Error:', event.message);
                setVoiceInputError(event.message);
                setSessionState('LISTEN');
                break;
        }
    };

    const handleInterrupt = () => {
        if (typeof window !== 'undefined') {
            window.speechSynthesis.cancel();
            narrationQueueRef.current = [];
            setAvatarState(prev => ({ ...prev, isSpeaking: false }));
            isProcessingQueueRef.current = false;
            setSessionState('LISTEN');
        }
    };

    const handleEndSession = async () => {
        isEndingSessionRef.current = true;
        setIsEnding(true);
        setGameState('report');
        setShowReport(true);
        window.speechSynthesis.cancel();
        narrationQueueRef.current = [];
        if (sendWsJson({ type: 'end_session' }, { failMessage: 'Could not notify server to end session.' })) {
            // WS send worked, wait for session_ended message
            return;
        }

        // Fallback if WS fails
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session/end/${sessionId}`, {
                method: 'POST',
            });
        } catch (err) {
            console.error('Error ending session:', err);
        }

        setIsEnding(false);
        setIsSessionActive(false);
        setGameState('report');
        setShowReport(true);
    };

    const prewarmTts = () => {
        if (typeof window === 'undefined') return;
        try {
            const voices = window.speechSynthesis.getVoices();
            const utterance = new SpeechSynthesisUtterance(' ');
            const voice = preferredVoiceRef.current || voices[0];
            if (voice) utterance.voice = voice;
            utterance.volume = 0;
            utterance.rate = 1;
            window.speechSynthesis.speak(utterance);
            setTimeout(() => window.speechSynthesis.cancel(), 200);
        } catch (error) {
            console.warn('TTS prewarm failed:', error);
        }
    };

    const handleStartSession = () => {
        if (mode === 'tutoring' && !setupInfo) {
            alert('Please enter a topic you want to learn.');
            return;
        }
        if (mode === 'interview' && !interviewJobDescription.trim()) {
            alert('Please paste a job description.');
            return;
        }
        if (mode === 'public_speaking') {
            if (!speakingType) {
                alert('Please select a practice type.');
                return;
            }
            if (!speakingTopic.trim()) {
                alert('Please enter a topic.');
                return;
            }
        }
        isEndingSessionRef.current = false;
        setVoiceInputError(null);
        setGameState('permissions');
    };

    const handleQuickSend = () => {
        const text = quickInput.trim();
        if (!text) return;
        setQuickInput('');
        sendWsJson(
            { type: 'user_speech', transcript: text },
            { setThink: true, failMessage: 'Could not send typed message to AI.' }
        );
    };

    const canSendQuick = quickInput.trim().length > 0 && ws?.readyState === WebSocket.OPEN;

    if (showReport && !finalReport) {
        return (
            <div style={styles.container}>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '1rem',
                }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        border: '3px solid rgba(255, 255, 255, 0.12)',
                        borderTopColor: '#FBBF24',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <div style={{ color: '#E5E7EB', fontSize: '1rem' }}>Generating your report...</div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>This usually takes a few seconds.</div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (showReport) {
        return (
            <div style={styles.container}>
                <VibeReport
                    sessionId={sessionId}
                    onClose={onExit}
                    initialReport={finalReport}
                    whiteboardExport={{
                        mode,
                        activeSteps: whiteboardSteps,
                        archivedTopics,
                        currentStepId,
                    }}
                />
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.sessionInfo}>
                        <h1 style={styles.modeTitle}>
                            {mode === 'tutoring' && '🧠 Socratic Tutoring'}
                            {mode === 'public_speaking' && '🎯 Public Speaking'}
                            {mode === 'interview' && '💼 Interview Mastery'}
                        </h1>
                        {biometricData && (
                            <div style={styles.metrics}>
                                <div style={styles.metric}>
                                    <span style={styles.metricLabel}>HR:</span>
                                    <span style={styles.metricValue}>{biometricData.heartRate} bpm</span>
                                </div>
                                <div style={styles.metric}>
                                    <span style={styles.metricLabel}>Stress:</span>
                                    <span style={{
                                        ...styles.metricValue,
                                        color: biometricData.stressLevel === 'low' ? '#4ADE80' :
                                            biometricData.stressLevel === 'medium' ? '#FBBF24' : '#F87171'
                                    }}>{biometricData.stressLevel}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={handleEndSession} style={styles.endButton}>
                        End Session
                    </button>
                </div>
            </header>

            {/* Layout */}
            {gameState === 'active' && (
                <main style={styles.main}>
                    <div style={styles.leftColumn}>
                        <div style={{ flex: '1', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.5rem' }}>
                            <BiometricMonitor onBiometricUpdate={handleBiometricUpdate} />
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={handleInterrupt}
                                        disabled={sessionState === 'LISTEN' || sessionState === 'THINK'}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(251, 191, 36, 0.3)',
                                            background: 'rgba(251, 191, 36, 0.1)',
                                            color: '#FBBF24', fontWeight: 600, cursor: 'pointer',
                                            opacity: (sessionState === 'LISTEN' || sessionState === 'THINK') ? 0.5 : 1
                                        }}
                                    >
                                        🎤 Interrupt / Ask Question
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => {
                                            if (isPaused) {
                                                setIsPaused(false);
                                                processNarrationQueue();
                                            } else {
                                                setIsPaused(true);
                                                window.speechSynthesis.cancel();
                                            }
                                        }}
                                        style={{
                                            flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: isPaused ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                            color: isPaused ? '#4ADE80' : '#fff', fontWeight: 600, cursor: 'pointer'
                                        }}
                                    >
                                        {isPaused ? '▶ Resume' : '⏸ Pause Tutor'}
                                    </button>
                                </div>

                                {checkInOptions.length > 0 && sessionState === 'LISTEN' && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {checkInOptions.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setThinkingState('check_in');
                                                    sendWsJson(
                                                        { type: 'user_speech', transcript: opt.replace('_', ' ') },
                                                        { setThink: true, failMessage: 'Failed to send check-in response.' }
                                                    );
                                                    setCheckInOptions([]);
                                                }}
                                                style={{
                                                    padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid rgba(251, 191, 36, 0.3)',
                                                    background: 'rgba(251, 191, 36, 0.1)', color: '#FBBF24', fontSize: '0.8rem', cursor: 'pointer'
                                                }}
                                            >
                                                {opt.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {voiceInputError && (
                                    <div style={{
                                        padding: '0.65rem 0.8rem',
                                        borderRadius: '0.7rem',
                                        background: 'rgba(239, 68, 68, 0.14)',
                                        border: '1px solid rgba(239, 68, 68, 0.35)',
                                        color: '#FCA5A5',
                                        fontSize: '0.82rem',
                                        lineHeight: 1.35
                                    }}>
                                        {voiceInputError}
                                    </div>
                                )}

                                <AudioProcessor
                                    onAudioEvent={handleAudioEvent}
                                    isActive={isSessionActive && !isPaused && sessionState === 'LISTEN'}
                                    isAiSpeaking={avatarState.isSpeaking}
                                    {...turnConfig}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={styles.centerColumn}>
                        <div style={{ ...styles.avatarContainer, cursor: (sessionState === 'SPEAK' || sessionState === 'THINK') ? 'pointer' : 'default' }} onClick={() => (sessionState === 'SPEAK' || sessionState === 'THINK') && handleInterrupt()}>

                            <AvatarScene
                                expression={avatarState.expression}
                                gesture={avatarState.gesture}
                                isSpeaking={avatarState.isSpeaking}

                            />
                            {sessionState === 'LISTEN' && (
                                <div style={{
                                    position: 'absolute', top: '2rem', right: '2rem',
                                    padding: '0.4rem 1rem', borderRadius: '2rem', background: 'rgba(34, 197, 94, 0.2)',
                                    border: '1px solid #4ADE80', color: '#4ADE80', fontSize: '0.75rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 10
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', animation: 'pulse 1s infinite' }}></div>
                                    LISTENING
                                </div>
                            )}
                            {(thinkingState !== 'idle' || sessionState === 'THINK') && (
                                <div style={{
                                    position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                                    padding: '0.5rem 1.5rem', borderRadius: '2rem', background: 'rgba(0,0,0,0.6)',
                                    backdropFilter: 'blur(10px)', border: '1px solid rgba(251, 191, 36, 0.3)',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 10
                                }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%',
                                        background: '#FBBF24',
                                        animation: 'pulse 1.5s infinite ease-in-out'
                                    }}></div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FBBF24', letterSpacing: '0.05em' }}>
                                        {thinkingState === 'logic' ? 'AI THINKING...' : 'AI PROCESSING...'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div style={{
                            marginTop: '1rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '1.25rem',
                            padding: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(20px)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <textarea
                                    value={quickInput}
                                    onChange={(e) => setQuickInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (canSendQuick) handleQuickSend();
                                        }
                                    }}
                                    placeholder={
                                        mode === 'tutoring'
                                            ? 'Ask or answer here'
                                            : mode === 'interview'
                                                ? 'Type your answer here'
                                                : 'Type your response here'
                                    }
                                    rows={2}
                                    style={{
                                        flex: 1, padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem',
                                        color: '#fff', fontSize: '0.9rem', resize: 'none', lineHeight: 1.4
                                    }}
                                />
                                <button
                                    onClick={handleQuickSend}
                                    disabled={!canSendQuick}
                                    aria-label="Send message"
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '0.75rem', border: '1px solid rgba(251, 191, 36, 0.35)',
                                        background: canSendQuick ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.08)',
                                        color: '#FBBF24', cursor: canSendQuick ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: canSendQuick ? 1 : 0.6
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={styles.rightColumn}>
                        <div style={{ flex: '2', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <Whiteboard
                                steps={whiteboardSteps}
                                archivedTopics={archivedTopics}
                                currentStepId={currentStepId}
                                title={mode === 'tutoring' ? 'VIRTUAL WHITEBOARD' : 'AI FEEDBACK'}
                            />
                        </div>
                        <div style={{ flex: '1', minHeight: 0, overflow: 'hidden' }}>
                            <SessionControls mode={mode as any} />
                        </div>
                    </div>
                </main>
            )}

            {/* Setup Overlay */}
            {gameState === 'setup' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100,
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '1.5rem', borderRadius: '1.5rem',
                        maxWidth: '480px', width: '90%', textAlign: 'center'
                    }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#FCD34D' }}>
                            {mode === 'tutoring'
                                ? 'What are we learning?'
                                : mode === 'interview'
                                    ? 'Interview Practice'
                                    : 'Public Speaking Practice'}
                        </h2>
                        {mode === 'interview' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                <textarea
                                    value={interviewJobDescription}
                                    onChange={(e) => setInterviewJobDescription(e.target.value)}
                                    placeholder="Paste the job description here"
                                    rows={6}
                                    style={{
                                        width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem',
                                        color: '#fff', fontSize: '1rem', resize: 'vertical'
                                    }}
                                />
                                <div style={{
                                    width: '100%', padding: '0.75rem 1rem',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '1rem',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <label style={{ fontSize: '0.85rem', color: '#9CA3AF', display: 'block', marginBottom: '0.5rem' }}>
                                        Upload resume (optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".txt,.md,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setInterviewResumeName(file.name);
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                const text = typeof reader.result === 'string' ? reader.result : '';
                                                setInterviewResumeText(text.slice(0, 8000));
                                            };
                                            reader.readAsText(file);
                                        }}
                                        style={{ color: '#D1D5DB' }}
                                    />
                                    {interviewResumeName && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
                                            Selected: {interviewResumeName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {mode === 'tutoring' && (
                            <input
                                type="text"
                                value={setupInfo}
                                onChange={(e) => setSetupInfo(e.target.value)}
                                placeholder={mode === 'tutoring' ? "e.g. Quantum Physics, Python Basics" : "e.g. Junior Web Developer"}
                                style={{
                                    width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem',
                                    color: '#fff', fontSize: '1.1rem', marginBottom: '2rem'
                                }}
                            />
                        )}
                        {mode === 'public_speaking' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {[
                                        'Interview answer',
                                        'Presentation',
                                        'Pitch',
                                        'Storytelling',
                                        'Casual conversation'
                                    ].map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setSpeakingType(option)}
                                            style={{
                                                padding: '0.5rem 0.9rem', borderRadius: '1.5rem',
                                                border: '1px solid rgba(251, 191, 36, 0.3)',
                                                background: speakingType === option ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                                color: speakingType === option ? '#FBBF24' : '#E5E7EB',
                                                fontSize: '0.85rem', cursor: 'pointer'
                                            }}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={speakingTopic}
                                    onChange={(e) => setSpeakingTopic(e.target.value)}
                                    placeholder="Choose a topic or enter your own"
                                    style={{
                                        width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem',
                                        color: '#fff', fontSize: '1rem'
                                    }}
                                />
                                <div style={{
                                    width: '100%', padding: '0.75rem 1rem',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '1rem',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <label style={{ fontSize: '0.85rem', color: '#9CA3AF', display: 'block', marginBottom: '0.5rem' }}>
                                        Upload script or outline (optional)
                                    </label>
                                    <input
                                        type="file"
                                        accept=".txt,.md,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setSpeakingScriptName(file.name);
                                            const reader = new FileReader();
                                            reader.onload = () => {
                                                const text = typeof reader.result === 'string' ? reader.result : '';
                                                setSpeakingScriptText(text.slice(0, 8000));
                                            };
                                            reader.readAsText(file);
                                        }}
                                        style={{ color: '#D1D5DB' }}
                                    />
                                    {speakingScriptName && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
                                            Selected: {speakingScriptName}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleStartSession}
                            style={{
                                width: '100%', padding: '1rem',
                                background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                                color: '#000', fontWeight: 700, borderRadius: '1rem',
                                border: 'none', cursor: 'pointer', fontSize: '1.1rem'
                            }}
                        >
                            {startButtonLabel}
                        </button>
                    </div>
                </div>
            )}
            {/* Permission Gate Overlay */}
            {gameState === 'permissions' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(30px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 110,
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(251, 191, 36, 0.2)',
                        padding: '1.5rem', borderRadius: '1.5rem',
                        maxWidth: '480px', width: '90%', textAlign: 'center',
                        boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🎫</div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#FCD34D' }}>
                            Ready to Start?
                        </h2>
                        <p style={{ color: '#9CA3AF', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                            To begin your session on <b>{setupInfo || (mode === 'interview' ? 'your interview practice' : (mode === 'public_speaking' ? (speakingTopic || 'your speaking topic') : 'this session'))}</b>, we need access to your microphone and camera for real-time coaching.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                onClick={async () => {
                                    try {
                                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                                        // Stop the stream immediately, it was just for the permission check.
                                        // AudioProcessor/Avatar will request it again.
                                        stream.getTracks().forEach(track => track.stop());
                                        prewarmTts();
                                        setGameState('active');
                                    } catch (err) {
                                        console.error('Permission denied:', err);
                                        alert('Please allow microphone and camera access to continue.');
                                    }
                                }}
                                style={{
                                    width: '100%', padding: '1rem',
                                    background: 'linear-gradient(135deg, #FBBF24, #F59E0B)',
                                    color: '#000', fontWeight: 800, borderRadius: '1rem',
                                    border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Allow Access & Start
                            </button>

                            <button
                                onClick={() => setGameState('setup')}
                                style={{
                                    width: '100%', padding: '0.875rem',
                                    background: 'transparent',
                                    color: '#9CA3AF', fontWeight: 600, borderRadius: '1rem',
                                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '1rem'
                                }}
                            >
                                ← Change Topic
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
