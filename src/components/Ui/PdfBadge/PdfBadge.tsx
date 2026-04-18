import React, { memo } from 'react';
import { LuFile } from 'react-icons/lu';
import './pdfBadge.css';

interface IPdfBadgeProps {
    name: string;
    className?: string;
}

const PdfBadge = ({ name, className = '' }: IPdfBadgeProps) => {
    return (
        <div className={`pdf-badge-container ${className}`} title={name}>
            <div className="custom-pdf-icon">
                <LuFile className="file-outline" />
                <span className="file-text">PDF</span>
            </div>
            <span className="pdf-name">{name}</span>
        </div>
    );
};

export default memo(PdfBadge);
