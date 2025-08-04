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
  const baseClasses = 'bg-white border border-gray-200 rounded-xl p-4 sm:p-6 transition-shadow hover:shadow-sm';
  const cardClasses = `${baseClasses} ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`;
  
  return (
    <div 
      className={cardClasses} 
      onClick={onClick}
      {...props}
    >
      {title && (
        <div className="space-y-2">
          <h3 className="text-sm sm:text-base font-medium text-emerald-900 leading-6">{title}</h3>
          {value && (
            <p className="text-xl sm:text-2xl font-bold text-emerald-800 leading-tight sm:leading-8">{value}</p>
          )}
          {subtitle && (
            <p className="text-sm text-emerald-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;