'use client';
import React, { useState, useRef, useCallback, MouseEvent, useEffect } from 'react';
import { IoSparklesSharp, IoDocumentTextOutline } from 'react-icons/io5';
import { FaCode } from 'react-icons/fa6';
import './hologram.css';

type TabType = 'idle' | 'doc' | 'reason' | 'code';

const TAB_CYCLE: TabType[] = ['doc', 'reason', 'code'];

const TAB_CONFIG = {
    idle: { file: 'AetherBot.exe' },
    doc: {
        file: 'Scanning_Document.pdf',
        label: 'Document Analysis',
        Icon: IoDocumentTextOutline,
        posClass: 'pos-top-right',
    },
    reason: { file: 'thinking...', label: 'Reasoning', Icon: IoSparklesSharp, posClass: 'pos-bottom-right' },
    code: { file: 'generate_app.tsx', label: 'Code Generation', Icon: FaCode, posClass: 'pos-bottom-left' },
} as const;

const IdleView = () => (
    <div className="view-idle">
        <div className="pulse-ring"></div>
        <p className="typewriter-text">Hi, how can I help you today?</p>
    </div>
);

const DocView = () => (
    <div className="view-scanner">
        <div className="paper-mockup">
            <div className="laser-beam"></div>
            <div className="text-line title"></div>
            <div className="text-line"></div>
            <div className="text-line"></div>
            <div className="text-line short"></div>
        </div>
        <div className="status-badge pop-in">Key Insights Extracted</div>
    </div>
);

const LogicView = () => (
    <div className="view-logic">
        <div className="step-node delay-1">1. Parse Intent</div>
        <div className="connection-wire fade-1"></div>
        <div className="step-node delay-2">2. Search Vector DB</div>
        <div className="connection-wire fade-2"></div>
        <div className="step-node delay-3 is-highlighted">3. Synthesize Output</div>
    </div>
);

const CodeView = () => (
    <div className="view-editor">
        <div className="editor-line">
            <span className="token comment">{'// AetherBot: Here is your fetch logic'}</span>
        </div>
        <div className="editor-line t-1">
            <span className="token kw">async function</span> <span className="token func">getData</span>() {'{'}
        </div>
        <div className="editor-line t-2 indent">
            <span className="token kw">const</span> res = <span className="token kw">await</span> fetch(
            <span className="token str">{"'/api/data'"}</span>);
        </div>
        <div className="editor-line t-3 indent">
            <span className="token kw">return await</span> res.json();
        </div>
        <div className="editor-line t-4">{'}'}</div>
    </div>
);

export default function AetherHologram() {
    const [activeTab, setActiveTab] = useState<TabType>('idle');
    const [isHovering, setIsHovering] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<HTMLDivElement>(null);
    const rafId = useRef<number | null>(null);

    useEffect(() => {
        if (isHovering) return;

        const intervalId = setInterval(() => {
            setActiveTab((currentTab) => {
                if (currentTab === 'idle') return TAB_CYCLE[0];
                const currentIndex = TAB_CYCLE.indexOf(currentTab);
                const nextIndex = (currentIndex + 1) % TAB_CYCLE.length;
                return TAB_CYCLE[nextIndex];
            });
        }, 3500);

        return () => clearInterval(intervalId);
    }, [isHovering]);

    const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || !sceneRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -15;
        const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 15;

        if (rafId.current) cancelAnimationFrame(rafId.current);

        rafId.current = requestAnimationFrame(() => {
            if (sceneRef.current) {
                sceneRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
        });
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovering(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovering(false);

        if (rafId.current) cancelAnimationFrame(rafId.current);
        if (sceneRef.current) sceneRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
    }, []);

    const renderActiveView = () => {
        switch (activeTab) {
            case 'doc':
                return <DocView />;
            case 'reason':
                return <LogicView />;
            case 'code':
                return <CodeView />;
            case 'idle':
            default:
                return <IdleView />;
        }
    };

    return (
        <div
            className="hologram-wrapper"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="scene-root" ref={sceneRef}>
                <div className={`ambient-glow ${activeTab !== 'idle' ? 'is-active' : ''}`} />

                <div className="glass-panel main-display">
                    <div className="display-header">
                        <div className="window-dot dot-red" />
                        <div className="window-dot dot-yellow" />
                        <div className="window-dot dot-green" />
                        <div className="file-name">{TAB_CONFIG[activeTab].file}</div>
                    </div>

                    <div className="display-content">{renderActiveView()}</div>
                </div>

                {TAB_CYCLE.map((tabKey) => {
                    if (tabKey === 'idle') return null;
                    const config = TAB_CONFIG[tabKey] as {
                        label: string;
                        Icon: React.ElementType;
                        posClass: string;
                    };
                    const { label, Icon, posClass } = config;
                    const isActive = activeTab === tabKey;

                    return (
                        <div
                            key={tabKey}
                            role="tab"
                            tabIndex={0}
                            className={`glass-panel interactive-badge ${posClass} ${isActive ? 'is-active' : ''}`}
                            onMouseEnter={() => setActiveTab(tabKey)}
                            onFocus={() => {
                                setIsHovering(true);
                                setActiveTab(tabKey);
                            }}
                            onBlur={() => setIsHovering(false)}
                        >
                            <span className="badge-icon">
                                <Icon />
                            </span>
                            <span className="badge-text">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
