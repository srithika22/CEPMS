const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Analytics = require('../models/Analytics');
const Performance = require('../models/Performance');

class DatabaseOptimizer {
  constructor() {
    this.models = {
      User,
      Event,
      Registration,
      Attendance,
      Session,
      Analytics,
      Performance
    };
  }

  // Create all indexes
  async createIndexes() {
    console.log('🔧 Creating database indexes...');
    
    for (const [modelName, Model] of Object.entries(this.models)) {
      try {
        console.log(`  Creating indexes for ${modelName}...`);
        await Model.createIndexes();
        console.log(`  ✅ ${modelName} indexes created successfully`);
      } catch (error) {
        console.error(`  ❌ Error creating indexes for ${modelName}:`, error.message);
      }
    }
  }

  // Update analytics for all users
  async updateUserAnalytics() {
    console.log('📊 Updating user analytics...');
    
    const users = await User.find({ role: 'student' });
    let updated = 0;

    for (const user of users) {
      try {
        const registrations = await Registration.find({ userId: user._id });
        const totalEventsRegistered = registrations.length;
        const totalEventsAttended = registrations.filter(r => r.attendedSessions > 0).length;
        const avgAttendanceRate = registrations.length > 0 
          ? registrations.reduce((sum, r) => sum + r.attendancePercentage, 0) / registrations.length 
          : 0;
        const certificatesEarned = registrations.filter(r => r.certificate.issued).length;

        user.analytics = {
          ...user.analytics,
          totalEventsRegistered,
          totalEventsAttended,
          avgAttendanceRate,
          certificatesEarned,
          lastActivityAt: new Date()
        };

        await user.save();
        updated++;
      } catch (error) {
        console.error(`Error updating analytics for user ${user._id}:`, error.message);
      }
    }

    console.log(`✅ Updated analytics for ${updated} users`);
  }

  // Update event analytics
  async updateEventAnalytics() {
    console.log('📈 Updating event analytics...');
    
    const events = await Event.find({});
    let updated = 0;

    for (const event of events) {
      try {
        const registrations = await Registration.find({ eventId: event._id });
        const sessions = await Session.find({ eventId: event._id });
        
        // Department-wise statistics
        const departmentStats = registrations.reduce((acc, reg) => {
          const dept = reg.department || 'Unknown';
          if (!acc[dept]) {
            acc[dept] = { registered: 0, attended: 0, totalAttendance: 0 };
          }
          acc[dept].registered++;
          if (reg.attendedSessions > 0) acc[dept].attended++;
          acc[dept].totalAttendance += reg.attendancePercentage;
          return acc;
        }, {});

        const departmentWiseStats = Object.entries(departmentStats).map(([dept, stats]) => ({
          department: dept,
          registered: stats.registered,
          attended: stats.attended,
          avgAttendance: stats.registered > 0 ? stats.totalAttendance / stats.registered : 0
        }));

        // Session-wise attendance
        const sessionWiseAttendance = await Promise.all(sessions.map(async (session) => {
          const attendance = await Attendance.find({ sessionId: session._id });
          const presentCount = attendance.filter(a => a.present).length;
          return {
            sessionId: session._id,
            attendanceRate: attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0,
            participantCount: attendance.length
          };
        }));

        // Update event stats
        event.stats.departmentWiseStats = departmentWiseStats;
        event.stats.sessionWiseAttendance = sessionWiseAttendance;
        event.stats.totalRegistered = registrations.length;
        event.stats.completionRate = registrations.length > 0 
          ? (registrations.filter(r => r.attendancePercentage >= 80).length / registrations.length) * 100 
          : 0;

        // Update performance metrics
        event.performance = {
          registrationRate: event.registration.maxParticipants 
            ? (registrations.length / event.registration.maxParticipants) * 100 
            : 0,
          dropoutRate: registrations.length > 0 
            ? (registrations.filter(r => r.attendancePercentage < 30).length / registrations.length) * 100 
            : 0,
          engagementScore: Math.min((event.stats.avgAttendance + event.stats.avgRating * 20) / 2, 100),
          lastUpdated: new Date()
        };

        await event.save();
        updated++;
      } catch (error) {
        console.error(`Error updating analytics for event ${event._id}:`, error.message);
      }
    }

    console.log(`✅ Updated analytics for ${updated} events`);
  }

  // Clean up old data
  async cleanupOldData() {
    console.log('🗑️ Cleaning up old data...');
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    try {
      // Clean up old daily analytics (older than 6 months)
      const deletedAnalytics = await Analytics.deleteMany({
        period: 'daily',
        createdAt: { $lt: sixMonthsAgo }
      });
      console.log(`  Deleted ${deletedAnalytics.deletedCount} old daily analytics records`);

      // Clean up old performance records (older than 1 year)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const deletedPerformance = await Performance.deleteMany({
        createdAt: { $lt: oneYearAgo },
        isActive: false
      });
      console.log(`  Deleted ${deletedPerformance.deletedCount} old performance records`);

    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }

  // Generate analytics summary
  async generateAnalyticsSummary(period = 'monthly') {
    console.log(`📊 Generating ${period} analytics summary...`);
    
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        throw new Error('Invalid period specified');
    }

    try {
      // Check if analytics already exists for this period
      const existingAnalytics = await Analytics.findOne({
        period,
        startDate,
        endDate
      });

      if (existingAnalytics) {
        console.log(`Analytics for ${period} period already exists`);
        return existingAnalytics;
      }

      // Generate platform metrics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({
        lastLogin: { $gte: startDate }
      });
      const newUsers = await User.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      });
      const totalEvents = await Event.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      });
      const completedEvents = await Event.countDocuments({
        status: 'completed',
        endDate: { $gte: startDate, $lt: endDate }
      });
      const totalRegistrations = await Registration.countDocuments({
        registeredAt: { $gte: startDate, $lt: endDate }
      });
      const totalAttendance = await Attendance.countDocuments({
        markedAt: { $gte: startDate, $lt: endDate }
      });

      // Create analytics record
      const analytics = new Analytics({
        period,
        startDate,
        endDate,
        platformMetrics: {
          totalUsers,
          activeUsers,
          newUsers,
          totalEvents,
          completedEvents,
          totalRegistrations,
          totalAttendance
        }
      });

      await analytics.save();
      console.log(`✅ Generated ${period} analytics summary`);
      return analytics;

    } catch (error) {
      console.error(`Error generating ${period} analytics:`, error.message);
      throw error;
    }
  }

  // Database health check
  async healthCheck() {
    console.log('🏥 Performing database health check...');
    
    const results = {
      collections: {},
      indexes: {},
      performance: {},
      recommendations: []
    };

    for (const [modelName, Model] of Object.entries(this.models)) {
      try {
        const collectionName = Model.collection.name;
        
        // Collection stats
        const stats = await mongoose.connection.db.collection(collectionName).stats();
        results.collections[modelName] = {
          documents: stats.count,
          avgDocSize: stats.avgObjSize,
          totalSize: stats.size,
          indexSize: stats.totalIndexSize
        };

        // Index information
        const indexes = await Model.collection.indexes();
        results.indexes[modelName] = indexes.length;

        // Performance recommendations
        if (stats.count > 10000 && indexes.length < 5) {
          results.recommendations.push(`Consider adding more indexes to ${modelName} collection`);
        }

        if (stats.avgObjSize > 10000) {
          results.recommendations.push(`${modelName} documents are large, consider document redesign`);
        }

      } catch (error) {
        console.error(`Error checking health for ${modelName}:`, error.message);
        results.collections[modelName] = { error: error.message };
      }
    }

    console.log('📋 Database Health Check Results:');
    console.log(JSON.stringify(results, null, 2));
    
    return results;
  }

  // Run complete optimization
  async runCompleteOptimization() {
    console.log('🚀 Starting complete database optimization...');
    
    try {
      await this.createIndexes();
      await this.updateUserAnalytics();
      await this.updateEventAnalytics();
      await this.cleanupOldData();
      await this.generateAnalyticsSummary('daily');
      await this.healthCheck();
      
      console.log('✅ Database optimization completed successfully!');
    } catch (error) {
      console.error('❌ Error during database optimization:', error.message);
      throw error;
    }
  }
}

module.exports = DatabaseOptimizer;