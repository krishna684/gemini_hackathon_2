'use client';

import { useEffect, useMemo, useState } from 'react';
import { VibeReport as VibeReportType } from '@/types';

interface VibeReportProps {
    sessionId: string;
    onClose: () => void;
    initialReport?: VibeReportType | null;
    whiteboardExport?: {
        mode: string;
        activeSteps: any[];
        archivedTopics: any[];
        currentStepId: number;
    };
}

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        overflowY: 'auto' as const,
        padding: '3rem 1.5rem',
        color: '#fff',
        fontFamily: '"Outfit", sans-serif',
    },
    content: {
        maxWidth: '900px',
        margin: '0 auto',
    },
    glassCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '1.5rem',
        padding: '2.5rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
    header: {
        textAlign: 'center' as const,
        marginBottom: '3rem',
    },
    title: {
        fontSize: '3.5rem',
        fontWeight: 800,
        margin: '0 0 0.5rem 0',
        background: 'linear-gradient(135deg, #FCD34D 0%, #FBBF24 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-1px',
    },
    subtitle: {
        fontSize: '1.25rem',
        color: '#9CA3AF',
        fontWeight: 500,
    },
    scoreSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        marginBottom: '2rem',
    },
    scoreRing: {
        position: 'relative' as const,
        width: '180px',
        height: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
    },
    scoreValue: {
        fontSize: '3.5rem',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #fff 0%, #FBBF24 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1.5rem',
        marginBottom: '3rem',
    },
    statCard: {
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '1rem',
        padding: '1.5rem',
        textAlign: 'center' as const,
    },
    statLabel: {
        fontSize: '0.75rem',
        color: '#9CA3AF',
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        marginBottom: '0.5rem',
    },
    statValue: {
        fontSize: '1.75rem',
        fontWeight: 700,
        color: '#fff',
    },
    sectionTitle: {
        fontSize: '1.5rem',
        fontWeight: 700,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    analysis: {
        fontSize: '1.1rem',
        lineHeight: 1.6,
        color: '#D1D5DB',
        whiteSpace: 'pre-wrap' as const,
    },
    summaryBox: {
        marginTop: '1rem',
        padding: '1rem 1.25rem',
        borderRadius: '0.9rem',
        background: 'rgba(251, 191, 36, 0.08)',
        border: '1px solid rgba(251, 191, 36, 0.22)',
    },
    summaryTitle: {
        fontSize: '0.75rem',
        color: '#FCD34D',
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        marginBottom: '0.4rem',
        fontWeight: 700,
    },
    summaryText: {
        fontSize: '0.95rem',
        color: '#E5E7EB',
        lineHeight: 1.5,
    },
    summaryList: {
        marginTop: '0.5rem',
        paddingLeft: '1.1rem',
        color: '#D1D5DB',
        fontSize: '0.9rem',
        lineHeight: 1.45,
    },
    badgeList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
    },
    badge: {
        display: 'flex',
        alignItems: 'start',
        gap: '1rem',
        padding: '1.25rem',
        borderRadius: '1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
    },
    buttonContainer: {
        display: 'flex',
        gap: '1rem',
        marginTop: '3rem',
        flexWrap: 'wrap' as const,
    },
    primaryButton: {
        flex: 2,
        minWidth: '190px',
        padding: '1.25rem',
        borderRadius: '1rem',
        background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
        color: '#000',
        fontSize: '1.05rem',
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    secondaryButton: {
        flex: 1,
        minWidth: '170px',
        padding: '1.25rem',
        borderRadius: '1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
};

export default function VibeReport({ sessionId, onClose, initialReport = null, whiteboardExport }: VibeReportProps) {
    const [report, setReport] = useState<VibeReportType | null>(initialReport);
    const [loading, setLoading] = useState(!initialReport);

    useEffect(() => {
        if (!initialReport) {
            void fetchReport();
        }
    }, [sessionId]);

    const fetchReport = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/session/${sessionId}/report`);
            if (!response.ok) throw new Error('Report not found');
            const data = await response.json();
            setReport(data);
        } catch (error) {
            console.error('Failed to fetch vibe report:', error);
        } finally {
            setLoading(false);
        }
    };

    const peakHeartRate = useMemo(() => {
        if (!report?.peak_confidence_frame) return null;
        const frame: any = report.peak_confidence_frame;
        const value = frame.heartRate ?? frame.heart_rate;
        return typeof value === 'number' && Number.isFinite(value) ? value : null;
    }, [report]);

    const downloadWhiteboardData = () => {
        if (!whiteboardExport) return;

        const payload = {
            sessionId,
            exportedAt: new Date().toISOString(),
            mode: whiteboardExport.mode,
            currentStepId: whiteboardExport.currentStepId,
            activeSteps: whiteboardExport.activeSteps || [],
            archivedTopics: whiteboardExport.archivedTopics || [],
            reportSummary: {
                overall_score: report?.overall_score ?? null,
                discussion_summary: report?.discussion_summary ?? '',
            },
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whiteboard-${sessionId.slice(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            border: '4px solid rgba(252, 211, 77, 0.1)',
                            borderTopColor: '#FBBF24',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }}
                    ></div>
                    <p style={{ marginTop: '2rem', fontSize: '1.25rem', color: '#9CA3AF' }}>Analyzing your session...</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!report) {
        return (
            <div style={styles.container}>
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <h2 style={{ fontSize: '2rem', color: '#F87171', marginBottom: '1.5rem' }}>Report Generation Failed</h2>
                    <button onClick={onClose} style={styles.primaryButton}>Back To Home</button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <header style={styles.header}>
                    <h1 style={styles.title}>The Vibe Report</h1>
                    <p style={styles.subtitle}>Session analysis for {sessionId.slice(0, 8)}</p>
                </header>

                <div style={styles.glassCard}>
                    <div style={styles.scoreSection}>
                        <div style={styles.scoreRing}>
                            <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                <circle
                                    cx="90"
                                    cy="90"
                                    r="80"
                                    fill="none"
                                    stroke="#FBBF24"
                                    strokeWidth="12"
                                    strokeDasharray={`${2 * Math.PI * 80}`}
                                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - report.overall_score / 100)}`}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute' }}>
                                <span style={styles.scoreValue}>{report.overall_score}</span>
                            </div>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Overall Performance</h2>
                    </div>

                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}>
                            <div style={styles.statLabel}>Peak Heart Rate</div>
                            <div style={styles.statValue}>{peakHeartRate !== null ? peakHeartRate.toFixed(0) : '72'} <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>BPM</span></div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statLabel}>Stress Events</div>
                            <div style={styles.statValue}>{report.stress_events}</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statLabel}>AI Corrections</div>
                            <div style={styles.statValue}>{report.barge_in_count}</div>
                        </div>
                    </div>
                </div>

                <div style={styles.glassCard}>
                    <h3 style={styles.sectionTitle}>AI Insight</h3>
                    <div style={styles.analysis}>{report.analysis}</div>
                    <div style={styles.summaryBox}>
                        <div style={styles.summaryTitle}>What You Discussed</div>
                        <div style={styles.summaryText}>{report.discussion_summary || 'Session summary is being prepared.'}</div>
                        {report.discussion_points && report.discussion_points.length > 0 && (
                            <ul style={styles.summaryList}>
                                {report.discussion_points.map((point, idx) => (
                                    <li key={idx}>{point}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={styles.glassCard}>
                        <h3 style={styles.sectionTitle}>Strengths</h3>
                        <div style={styles.badgeList}>
                            {report.strengths.map((s, i) => (
                                <div key={i} style={styles.badge}>
                                    <div style={{ width: '24px', height: '24px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399', fontSize: '0.8rem' }}>S</div>
                                    <span style={{ fontSize: '0.95rem', color: '#E5E7EB' }}>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.glassCard}>
                        <h3 style={styles.sectionTitle}>Improvements</h3>
                        <div style={styles.badgeList}>
                            {report.improvements.map((s, i) => (
                                <div key={i} style={styles.badge}>
                                    <div style={{ width: '24px', height: '24px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24', fontSize: '0.8rem' }}>I</div>
                                    <span style={{ fontSize: '0.95rem', color: '#E5E7EB' }}>{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {report.futureVisualizationUrl && (
                    <div style={styles.glassCard}>
                        <h3 style={styles.sectionTitle}>Future Visualization</h3>
                        <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <img src={report.futureVisualizationUrl} alt="Future Visualization" style={{ width: '100%', display: 'block' }} />
                        </div>
                    </div>
                )}

                <div style={styles.buttonContainer}>
                    <button
                        style={styles.primaryButton}
                        onClick={onClose}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 191, 36, 0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        Back To Home
                    </button>
                    <button
                        style={{ ...styles.secondaryButton, opacity: whiteboardExport ? 1 : 0.55, cursor: whiteboardExport ? 'pointer' : 'not-allowed' }}
                        onClick={downloadWhiteboardData}
                        disabled={!whiteboardExport}
                    >
                        Download Whiteboard
                    </button>
                    <button
                        style={styles.secondaryButton}
                        onClick={() => window.print()}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        Save PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
