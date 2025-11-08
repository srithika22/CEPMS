import React from 'react';

const DashboardLayout = ({ 
  title, 
  subtitle, 
  children, 
  headerActions,
  tabs,
  activeTab,
  onTabChange,
  theme = 'blue' // blue, green, purple, orange
}) => {
  const getThemeClasses = (theme) => {
    switch (theme) {
      case 'green':
        return {
          border: 'border-green-500',
          text: 'text-green-600'
        };
      case 'purple':
        return {
          border: 'border-purple-500',
          text: 'text-purple-600'
        };
      case 'orange':
        return {
          border: 'border-orange-500',
          text: 'text-orange-600'
        };
      default: // blue
        return {
          border: 'border-blue-500',
          text: 'text-blue-600'
        };
    }
  };

  const themeClasses = getThemeClasses(theme);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">{subtitle}</p>
            </div>
            {headerActions && (
              <div className="flex space-x-3">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.key
                      ? `${themeClasses.border} ${themeClasses.text}`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;