import React from 'react';

const StatisticsCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  trend,
  description,
  onClick 
}) => {
  const getColorClasses = (color) => {
    switch (color) {
      case 'green':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          icon: 'text-green-500',
          border: 'border-green-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          icon: 'text-purple-500',
          border: 'border-purple-200'
        };
      case 'orange':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-600',
          icon: 'text-orange-500',
          border: 'border-orange-200'
        };
      case 'red':
        return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          icon: 'text-red-500',
          border: 'border-red-200'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-50',
          text: 'text-indigo-600',
          icon: 'text-indigo-500',
          border: 'border-indigo-200'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          icon: 'text-yellow-500',
          border: 'border-yellow-200'
        };
      default: // blue
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          icon: 'text-blue-500',
          border: 'border-blue-200'
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <div 
      className={`${colorClasses.bg} ${colorClasses.border} border rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses.text}`}>{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.positive ? '↗' : '↘'} {trend.value}
              </span>
              <span className="text-xs text-gray-500 ml-1">{trend.period}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`text-3xl ${colorClasses.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsCard;