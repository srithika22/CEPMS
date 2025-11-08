/* Dashboard Component Usage Guide */

/* 
This file shows how to use the shared dashboard components across different dashboard types.
All styles are defined in src/styles/components.css and can be themed using CSS variables.
*/

/* 1. DASHBOARD ROOT SETUP */
/* Use dashboard-root with appropriate theme class */

// Student Dashboard
<div className="dashboard-root student-theme">

// Faculty Dashboard  
<div className="dashboard-root faculty-theme">

// Admin Dashboard
<div className="dashboard-root admin-theme">

// Trainer Dashboard
<div className="dashboard-root trainer-theme">


/* 2. HEADER COMPONENT */
/* Standard header layout for all dashboards */

<div className="dashboard-header">
  <div className="dashboard-header-inner">
    <div>
      <h1>Dashboard Name</h1>
      <p className="dashboard-subtitle">Dashboard description</p>
    </div>
  </div>
</div>


/* 3. NAVIGATION TABS */
/* Themed navigation with active state support */

<div className="dashboard-tabs-wrap">
  <div className="dashboard-tabs">
    {tabs.map(tab => (
      <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key)}
        className={"dashboard-tab" + (activeTab === tab.key ? ' active' : '')}
      >
        <span className="dashboard-tab-icon">{tab.icon}</span>
        {tab.label}
      </button>
    ))}
  </div>
</div>


/* 4. MAIN CONTENT CONTAINER */

<div className="dashboard-content">
  {/* All dashboard content goes here */}
</div>


/* 5. WELCOME SECTION */
/* Themed welcome banner with gradient background */

<div className="welcome-section">
  <div className="welcome-inner">
    <div className="welcome-text">
      <h2>Welcome back, {user?.name}! {emoji}</h2>
      <p className="welcome-subtitle">Dashboard Type</p>
      <div className="welcome-details">
        {/* User-specific details */}
      </div>
    </div>
    <div className="welcome-emoji">{emoji}</div>
  </div>
</div>


/* 6. STATISTICS GRID */
/* Responsive grid with themed stat cards */

<div className="stats-grid">
  <div className="stat-card card-blue">
    <div className="stat-inner">
      <div>
        <p className="stat-label">Stat Label</p>
        <p className="stat-value">{value}</p>
        <p className="stat-note">Description</p>
      </div>
      <div className="stat-icon">{icon}</div>
    </div>
  </div>
  
  {/* More stat cards with different colors: card-green, card-purple, card-orange */}
</div>


/* 7. DASHBOARD CARDS */
/* Standard card container for content sections */

<div className="dashboard-card">
  <h3>Section Title</h3>
  {/* Card content */}
</div>


/* 8. ACTION GRIDS */
/* Responsive button layouts */

<div className="actions-grid">
  <button className="btn-primary">Action 1</button>
  <button className="btn-primary">Action 2</button>
  <button className="btn-primary">Action 3</button>
</div>


/* 9. FORM FILTERS */
/* Search and filter components */

<div className="dashboard-card">
  <div className="filters-grid">
    <div className="filter-group">
      <input
        type="text"
        placeholder="Search..."
        className="form-input"
      />
    </div>
    <div className="filter-group">
      <select className="form-select">
        <option>Filter Option</option>
      </select>
    </div>
  </div>
</div>


/* 10. DATA TABLES */
/* Responsive tables with styled headers and cells */

<div className="dashboard-card table-card">
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th>Column 1</th>
          <th>Column 2</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div className="cell-title">Main Text</div>
            <div className="cell-subtitle">Sub Text</div>
          </td>
          <td className="table-cell-date">Date</td>
          <td>
            <button className="btn-outline">Action</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>


/* 11. STATUS BADGES */
/* Colored status indicators */

<span className="status-badge status-confirmed">Confirmed</span>
<span className="status-badge status-pending">Pending</span>
<span className="status-badge status-cancelled">Cancelled</span>

<span className="badge badge-green">Success</span>
<span className="badge badge-red">Error</span>
<span className="badge badge-blue">Info</span>


/* 12. EMPTY STATES */
/* Placeholder content when no data is available */

<div className="empty-state">
  <div className="empty-icon">📄</div>
  <h3>No Data Available</h3>
  <p>Description of empty state</p>
  <button className="btn-primary">Call to Action</button>
</div>


/* 13. LOADING STATES */
/* Themed loading spinner */

<div className="loading-container">
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p className="loading-text">Loading...</p>
  </div>
</div>


/* 14. ERROR/SUCCESS BANNERS */
/* Notification banners */

<div className="error-banner">
  <span className="banner-icon">⚠️</span>
  Error message
</div>

<div className="success-banner">
  <span className="banner-icon">✅</span>
  Success message
</div>


/* 15. BUTTON VARIANTS */

<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-outline">Outline Button</button>
<button className="btn-small">Small Button</button>
<button className="btn-outline btn-danger">Danger Button</button>


/* 16. GRID LAYOUTS FOR CONTENT */

/* Events/Cards Grid */
<div className="events-grid">
  <div className="event-card">
    <div className="event-header">
      <h4>Card Title</h4>
      <span className="event-type category">Category</span>
    </div>
    <p className="event-description">Description</p>
    <div className="event-details">
      <p><strong>Detail:</strong> Value</p>
    </div>
    <div className="event-badges">
      <span className="badge badge-green">Badge</span>
    </div>
    <div className="event-actions">
      <button className="btn-primary">Action</button>
    </div>
  </div>
</div>

/* Certificates Grid */
<div className="certificates-grid">
  <div className="certificate-card">
    <div className="certificate-header">
      <div className="certificate-icon">🏆</div>
      <h3>Certificate Title</h3>
    </div>
    <div className="certificate-details">
      <p className="issued-date">Issue Date</p>
    </div>
    <div className="certificate-actions">
      <button className="btn-primary">View</button>
      <button className="btn-secondary">Download</button>
    </div>
  </div>
</div>


/* THEME CUSTOMIZATION */
/* 
Each dashboard theme automatically applies the correct colors via CSS variables:
- --theme-primary: Main theme color
- --theme-primary-light: Light theme color for backgrounds
- --theme-gradient: Gradient for welcome sections and primary buttons

Available themes:
- student-theme (Green)
- faculty-theme (Blue) 
- admin-theme (Purple)
- trainer-theme (Orange)
*/

/* RESPONSIVE DESIGN */
/*
All components are fully responsive and adapt to:
- Mobile: Single column layouts, stacked elements
- Tablet: 2-column grids where appropriate
- Desktop: Full multi-column layouts

The system automatically handles:
- Grid responsiveness
- Navigation tab wrapping
- Table horizontal scrolling
- Button stacking
*/