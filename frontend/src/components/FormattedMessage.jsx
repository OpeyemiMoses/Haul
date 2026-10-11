import React from 'react';

/**
 * Cleanly renders formatted text without displaying raw markdown symbols like #, *, or **.
 * Converts markdown headers to clean styled titles, bullet points to styled rows, and bold text to <strong>.
 */
export default function FormattedMessage({ text = '', isUser = false }) {
  if (!text) return null;

  // Split into lines to parse line-level elements (headings, bullets, paragraphs)
  const lines = text.split('\n');

  const renderInlineFormatted = (rawText) => {
    if (!rawText) return null;

    // Tokenize for bold (**text**), inline code (`text`), and clean text
    const parts = [];
    let remaining = rawText;
    let keyIdx = 0;

    // Regex to match **bold** or `code`
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
    const splits = remaining.split(pattern);

    return splits.map((segment, idx) => {
      if (!segment) return null;

      // Handle **bold**
      if (segment.startsWith('**') && segment.endsWith('**') && segment.length > 4) {
        const cleanBold = segment.slice(2, -2).trim();
        return (
          <strong 
            key={idx} 
            style={{ 
              color: isUser ? '#080F0F' : '#FFFFFF', 
              fontWeight: 700 
            }}
          >
            {cleanBold}
          </strong>
        );
      }

      // Handle `code` (e.g. PIN or Order IDs)
      if (segment.startsWith('`') && segment.endsWith('`') && segment.length > 2) {
        const cleanCode = segment.slice(1, -1).trim();
        return (
          <span
            key={idx}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              background: isUser ? 'rgba(0, 0, 0, 0.15)' : 'rgba(132, 244, 59, 0.12)',
              color: isUser ? '#080F0F' : 'var(--brand-green)',
              border: isUser ? 'none' : '1px solid rgba(132, 244, 59, 0.25)',
              padding: '1px 6px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}
          >
            {cleanCode}
          </span>
        );
      }

      // Clean any stray asterisks or hashes from the regular text segment
      const sanitized = segment.replace(/\*\*/g, '').replace(/\*/g, '');
      return <span key={idx}>{sanitized}</span>;
    });
  };

  const renderedElements = [];
  let index = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 1. Empty lines -> soft paragraph spacing
    if (!trimmed) {
      renderedElements.push(<div key={`sp-${index++}`} style={{ height: '8px' }} />);
      continue;
    }

    // 2. Headings (starts with one or more #)
    if (/^#{1,6}\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^#{1,6}\s+/, '').trim();
      renderedElements.push(
        <div 
          key={`h-${index++}`}
          style={{
            fontSize: '0.98rem',
            fontWeight: 800,
            color: isUser ? '#080F0F' : '#FFFFFF',
            margin: '10px 0 4px',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {renderInlineFormatted(headingText)}
        </div>
      );
      continue;
    }

    // 3. Bullet list items (starts with *, -, •, or numbered 1.)
    if (/^(\*|\-|\•|\d+\.)\s+/.test(trimmed)) {
      const bulletContent = trimmed.replace(/^(\*|\-|\•|\d+\.)\s+/, '').trim();
      renderedElements.push(
        <div 
          key={`b-${index++}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            margin: '4px 0',
            lineHeight: 1.5
          }}
        >
          <span 
            style={{ 
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: isUser ? '#080F0F' : 'var(--brand-green)',
              marginTop: '7px',
              flexShrink: 0
            }} 
          />
          <div style={{ flex: 1 }}>
            {renderInlineFormatted(bulletContent)}
          </div>
        </div>
      );
      continue;
    }

    // 4. Blockquotes (starts with >)
    if (/^>\s+/.test(trimmed)) {
      const quoteText = trimmed.replace(/^>\s+/, '').trim();
      renderedElements.push(
        <div 
          key={`q-${index++}`}
          style={{
            borderLeft: `3px solid ${isUser ? '#080F0F' : 'var(--brand-green)'}`,
            paddingLeft: '10px',
            margin: '6px 0',
            color: isUser ? '#080F0F' : '#D1D5DB',
            fontStyle: 'normal',
            fontSize: '0.86rem'
          }}
        >
          {renderInlineFormatted(quoteText)}
        </div>
      );
      continue;
    }

    // 5. Standard line / paragraph
    renderedElements.push(
      <div key={`p-${index++}`} style={{ margin: '2px 0', lineHeight: 1.6 }}>
        {renderInlineFormatted(trimmed)}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {renderedElements}
    </div>
  );
}
