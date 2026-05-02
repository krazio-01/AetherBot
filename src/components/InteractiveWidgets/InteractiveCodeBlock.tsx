import React, { useState, useMemo, useCallback, memo } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Sandpack } from '@codesandbox/sandpack-react';
import { LuCopy, LuPlay, LuCode, LuTerminal, LuX } from 'react-icons/lu';
import { Oval } from 'react-loader-spinner';
import { useRequest } from '@/hooks/useRequest';
import './interactiveWidgets.css';

interface InteractiveCodeBlockProps {
    content: string;
    language: string;
    handleCopyClick: (content: string) => void;
}

const BROWSER_LANGUAGES = new Set(['javascript', 'js', 'jsx', 'react', 'tsx', 'ts', 'html', 'angular']);
const BACKEND_LANGUAGES = new Set(['cpp', 'c++', 'c', 'java', 'rust', 'python']);

type SandpackTemplate = 'vanilla' | 'react' | 'angular';

const InteractiveCodeBlock = ({ content, language, handleCopyClick }: InteractiveCodeBlockProps) => {
    const lang = language.toLowerCase();

    const isBrowserRunnable = BROWSER_LANGUAGES.has(lang);
    const isBackendRunnable = BACKEND_LANGUAGES.has(lang);

    const [showPreview, setShowPreview] = useState(false);
    const [backendOutput, setBackendOutput] = useState<string | null>(null);

    const { postRequest, isPending: isRunningBackend } = useRequest();

    const sandpackConfig = useMemo(() => {
        if (!isBrowserRunnable) return null;

        let template: SandpackTemplate = 'vanilla';
        let files: Record<string, string> = {};
        const isJS = !['react', 'jsx', 'tsx', 'html', 'angular'].includes(lang);

        if (['react', 'jsx', 'tsx'].includes(lang)) {
            template = 'react';
            files = { '/App.js': content };
        } else if (lang === 'angular') {
            template = 'angular';
            files = { '/src/app/app.component.ts': content };
        } else if (lang === 'html') {
            files = { '/index.html': content, '/index.js': '' };
        } else {
            files = {
                '/index.js': content,
                '/index.html': `<!DOCTYPE html><html><body><div style="font-family: sans-serif; padding: 20px;"><h2>JavaScript Environment</h2><p>Check the console below for output!</p></div></body></html>`,
            };
        }

        return { template, files, isJS };
    }, [lang, content, isBrowserRunnable]);

    const runBackendCode = useCallback(async () => {
        setBackendOutput('Compiling and running on secure server...');

        try {
            const { data }: any = await postRequest('/execute', {
                language: lang,
                content: content,
            });

            if (data?.output) setBackendOutput(data.output);
            else setBackendOutput('Execution completed with no output.');
        } catch (error: any) {
            console.error('Execution Error:', error);
            setBackendOutput(typeof error === 'string' ? error : 'Network error: Could not reach execution server.');
        }
    }, [lang, content, postRequest]);

    return (
        <div className="code-block">
            <div className="code-block-header">
                <span> {language}</span>

                <div>
                    {isBrowserRunnable && (
                        <button
                            onClick={() => setShowPreview((prev) => !prev)}
                            title={showPreview ? 'View Code' : 'Run in Browser'}
                        >
                            {showPreview ? <LuCode /> : <LuPlay />}
                        </button>
                    )}

                    {isBackendRunnable && (
                        <button
                            onClick={runBackendCode}
                            disabled={isRunningBackend}
                            title="Run on Server"
                            style={{ color: isRunningBackend ? 'var(--light-text-clr)' : 'inherit' }}
                        >
                            {isRunningBackend ? (
                                <Oval
                                    visible={true}
                                    height="14"
                                    width="14"
                                    color="currentColor"
                                    secondaryColor="currentColor"
                                />
                            ) : (
                                <LuTerminal />
                            )}
                        </button>
                    )}

                    <button onClick={() => handleCopyClick(content)} title="Copy Code">
                        <LuCopy />
                    </button>
                </div>
            </div>

            {isBrowserRunnable && showPreview && sandpackConfig ? (
                <div className="sandpack-container">
                    <Sandpack
                        template={sandpackConfig.template}
                        theme="dark"
                        files={sandpackConfig.files}
                        options={{
                            showNavigator: false,
                            showTabs: false,
                            editorHeight: 400,
                            wrapContent: true,
                            showConsole: sandpackConfig.isJS,
                            showConsoleButton: true,
                        }}
                    />
                </div>
            ) : (
                <SyntaxHighlighter
                    style={atomOneDark}
                    language={language}
                    PreTag="div"
                    customStyle={{ padding: '1rem', margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                >
                    {content}
                </SyntaxHighlighter>
            )}

            {isBackendRunnable && backendOutput !== null && !showPreview && (
                <div className="backend-output-container">
                    <div className="backend-label">
                        <span>Terminal Output</span>
                        <button onClick={() => setBackendOutput(null)} title="Close Output">
                            <LuX />
                        </button>
                    </div>
                    <pre className="backend-output-text">{backendOutput}</pre>
                </div>
            )}
        </div>
    );
};

InteractiveCodeBlock.displayName = 'InteractiveCodeBlock';
export default memo(InteractiveCodeBlock);
