import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  title, 
  value, 
  subtitle,
  onClick,
  ...props 
}) => {
  const baseClasses = 'bg-white border border-gray-200 rounded-xl p-6 transition-shadow hover:shadow-sm';
  const cardClasses = `${baseClasses} ${onClick ? 'cursor-pointer' : ''} ${className}`;
  
  return (
    <div 
      className={cardClasses} 
      onClick={onClick}
      {...props}
    >
      {title && (
        <div className="space-y-2">
          <h3 className="text-base font-medium text-gray-900 leading-6">{title}</h3>
          {value && (
            <p className="text-2xl font-bold text-gray-900 leading-8">{value}</p>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;