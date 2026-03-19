import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 px-4">
        <div
          className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words"
          style={{ background: '#2d2e33', color: '#e3e3e3', border: '1px solid #3c3f4a' }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 px-4 gap-3">
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
        style={{ background: '#1a73e8', color: '#fff' }}
      >
        G
      </div>
      <div className="flex-1 min-w-0 pt-0.5" style={{ color: '#e3e3e3' }}>
        {message.content ? (
          <div className="markdown text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2" style={{ color: '#e3e3e3' }}>{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2" style={{ color: '#e3e3e3' }}>{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1.5" style={{ color: '#e3e3e3' }}>{children}</h3>,
                p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="mb-3 pl-5 space-y-1 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 pl-5 space-y-1 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: '#2d2e33', color: '#c2e7ff', border: '1px solid #3c3f4a' }}>
                      {children}
                    </code>
                  ) : (
                    <code>{children}</code>
                  ),
                pre: ({ children }) => (
                  <pre className="mb-3 p-4 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed" style={{ background: '#2d2e33', border: '1px solid #3c3f4a', color: '#c2e7ff' }}>
                    {children}
                  </pre>
                ),
                strong: ({ children }) => <strong className="font-semibold" style={{ color: '#e3e3e3' }}>{children}</strong>,
                blockquote: ({ children }) => (
                  <blockquote className="pl-3 my-2 italic" style={{ borderLeft: '3px solid #3c3f4a', color: '#9aa0a6' }}>
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-3" style={{ borderColor: '#3c3f4a' }} />,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#8ab4f8', textDecoration: 'underline' }}>
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <span className="flex items-center gap-1.5" style={{ color: '#9aa0a6' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#9aa0a6', animationDelay: '0ms' }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#9aa0a6', animationDelay: '150ms' }} />
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#9aa0a6', animationDelay: '300ms' }} />
          </span>
        )}
      </div>
    </div>
  );
}
