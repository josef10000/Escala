import React from 'react';
import { tokenizeQuery } from '../utils/search';

interface HighlightTextProps {
  text: string;
  query?: string;
  className?: string;
  highlightClassName?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  query,
  className = '',
  highlightClassName = 'bg-cyan-400/30 text-cyan-200 font-bold px-1 py-0.5 rounded shadow-[0_0_8px_rgba(6,182,212,0.35)]',
}) => {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters
  const pattern = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  try {
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);

    return (
      <span className={className}>
        {parts.map((part, index) => {
          const isMatch = tokens.some(
            (t) => part.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === t
          );

          if (isMatch) {
            return (
              <mark key={index} className={highlightClassName}>
                {part}
              </mark>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </span>
    );
  } catch {
    return <span className={className}>{text}</span>;
  }
};
