import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', title, onClick }: CardProps) {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}
