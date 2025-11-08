const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const DatabaseOptimizer = require('../utils/databaseOptimizer');

class DatabaseMigration {
  constructor() {
    this.optimizer = new DatabaseOptimizer();
  }

  // Main migration function
  async runMigration() {
    console.log('🚀 Starting database migration...');
    
    try {
      await this.migrateUsers();
      await this.migrateEvents();
      await this.migrateRegistrations();
      await this.migrateAttendance();
      await this.migrateSessions();
      await this.createIndexes();
      await this.updateAnalytics();
      
      console.log('✅ Database migration completed successfully!');
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    }
  }

  // Migrate User documents
  async migrateUsers() {
    console.log('👥 Migrating User documents...');
    
    const users = await User.find({});
    let migrated = 0;

    for (const user of users) {
      try {
        let updated = false;

        // Add analytics field if missing
        if (!user.analytics) {
          user.analytics = {
            totalEventsRegistered: 0,
            totalEventsAttended: 0,
            avgAttendanceRate: 0,
            certificatesEarned: 0,
            lastActivityAt: user.lastLogin || user.createdAt,
            profileCompleteness: 0
          };
          updated = true;
        }

        // Add searchIndex if missing
        if (!user.searchIndex) {
          user.searchIndex = `${user.firstName} ${user.lastName} ${user.email} ${user.student?.rollNumber || ''}`.toLowerCase();
          updated = true;
        }

        // Add primaryDepartment if missing
        if (!user.primaryDepartment) {
          user.primaryDepartment = user.student?.department || user.faculty?.department || user.trainer?.organization || 'Unknown';
          updated = true;
        }

        if (updated) {
          await user.save();
          migrated++;
        }
      } catch (error) {
        console.error(`Error migrating user ${user._id}:`, error.message);
      }
    }

    console.log(`  ✅ Migrated ${migrated} user documents`);
  }

  // Migrate Event documents
  async migrateEvents() {
    console.log('📅 Migrating Event documents...');
    
    const events = await Event.find({});
    let migrated = 0;

    for (const event of events) {
      try {
        let updated = false;

        // Add enhanced stats if missing
        if (!event.stats.departmentWiseStats) {
          event.stats.departmentWiseStats = [];
          updated = true;
        }

        if (!event.stats.sessionWiseAttendance) {
          event.stats.sessionWiseAttendance = [];
          updated = true;
        }

        if (typeof event.stats.completionRate === 'undefined') {
          event.stats.completionRate = 0;
          updated = true;
        }

        // Add performance metrics if missing
        if (!event.performance) {
          event.performance = {
            registrationRate: 0,
            dropoutRate: 0,
            engagementScore: 0,
            lastUpdated: new Date()
          };
          updated = true;
        }

        if (updated) {
          await event.save();
          migrated++;
        }
      } catch (error) {
        console.error(`Error migrating event ${event._id}:`, error.message);
      }
    }

    console.log(`  ✅ Migrated ${migrated} event documents`);
  }

  // Migrate Registration documents
  async migrateRegistrations() {
    console.log('📝 Migrating Registration documents...');
    
    const registrations = await Registration.find({}).populate('eventId userId');
    let migrated = 0;

    for (const registration of registrations) {
      try {
        let updated = false;

        // Add missing denormalized fields
        if (!registration.eventCategory && registration.eventId) {
          registration.eventCategory = registration.eventId.category;
          updated = true;
        }

        if (!registration.eventStartDate && registration.eventId) {
          registration.eventStartDate = registration.eventId.startDate;
          registration.eventEndDate = registration.eventId.endDate;
          updated = true;
        }

        if (!registration.year && registration.userId?.student) {
          registration.year = registration.userId.student.year;
          registration.section = registration.userId.student.section;
          registration.program = registration.userId.student.program;
          updated = true;
        }

        // Add analytics field if missing
        if (!registration.analytics) {
          registration.analytics = {
            registrationSource: 'web',
            totalSessionsAttended: registration.attendedSessions || 0,
            consecutiveAbsences: 0,
            engagementScore: Math.min(registration.attendancePercentage || 0, 100)
          };
          updated = true;
        }

        // Add performance metrics if missing
        if (!registration.performanceMetrics) {
          registration.performanceMetrics = {
            attendanceStreak: 0,
            maxConsecutiveAttendance: 0,
            punctualityScore: 100,
            participationLevel: registration.attendancePercentage >= 80 ? 'high' : 
                             registration.attendancePercentage >= 60 ? 'medium' : 'low'
          };
          updated = true;
        }

        if (updated) {
          await registration.save();
          migrated++;
        }
      } catch (error) {
        console.error(`Error migrating registration ${registration._id}:`, error.message);
      }
    }

    console.log(`  ✅ Migrated ${migrated} registration documents`);
  }

  // Migrate Attendance documents
  async migrateAttendance() {
    console.log('✅ Migrating Attendance documents...');
    
    const attendanceRecords = await Attendance.find({}).populate('userId sessionId');
    let migrated = 0;

    for (const attendance of attendanceRecords) {
      try {
        let updated = false;

        // Add missing denormalized fields
        if (!attendance.department && attendance.userId?.student) {
          attendance.department = attendance.userId.student.department;
          attendance.year = attendance.userId.student.year;
          attendance.section = attendance.userId.student.section;
          updated = true;
        }

        if (!attendance.sessionTitle && attendance.sessionId) {
          attendance.sessionTitle = attendance.sessionId.title;
          attendance.sessionDate = attendance.sessionId.date;
          updated = true;
        }

        // Add tracking fields if missing
        if (typeof attendance.lateArrival === 'undefined') {
          attendance.lateArrival = false;
          attendance.earlyDeparture = false;
          updated = true;
        }

        if (updated) {
          await attendance.save();
          migrated++;
        }
      } catch (error) {
        console.error(`Error migrating attendance ${attendance._id}:`, error.message);
      }
    }

    console.log(`  ✅ Migrated ${migrated} attendance documents`);
  }

  // Migrate Session documents
  async migrateSessions() {
    console.log('🎓 Migrating Session documents...');
    
    const sessions = await Session.find({});
    let migrated = 0;

    for (const session of sessions) {
      try {
        let updated = false;

        // Add real-time tracking if missing
        if (!session.realTimeTracking) {
          session.realTimeTracking = {
            lateStartMinutes: 0,
            extendedMinutes: 0,
            interruptions: []
          };
          updated = true;
        }

        // Add enhanced attendance stats
        if (!session.attendance.departmentWise) {
          session.attendance.departmentWise = [];
          updated = true;
        }

        if (!session.attendance.late) {
          session.attendance.late = 0;
          session.attendance.earlyLeave = 0;
          updated = true;
        }

        // Add analytics if missing
        if (!session.analytics) {
          session.analytics = {
            materialDownloads: 0,
            questionCount: 0,
            engagementLevel: 'medium',
            lastUpdated: new Date()
          };
          updated = true;
        }

        // Add postponed status option
        if (session.status && !['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'].includes(session.status)) {
          session.status = 'scheduled';
          updated = true;
        }

        if (updated) {
          await session.save();
          migrated++;
        }
      } catch (error) {
        console.error(`Error migrating session ${session._id}:`, error.message);
      }
    }

    console.log(`  ✅ Migrated ${migrated} session documents`);
  }

  // Create all indexes
  async createIndexes() {
    console.log('🔧 Creating database indexes...');
    await this.optimizer.createIndexes();
  }

  // Update analytics after migration
  async updateAnalytics() {
    console.log('📊 Updating analytics after migration...');
    await this.optimizer.updateUserAnalytics();
    await this.optimizer.updateEventAnalytics();
  }

  // Rollback migration (in case of issues)
  async rollbackMigration() {
    console.log('🔄 Rolling back migration...');
    
    try {
      // Remove new fields from User documents
      await User.updateMany({}, {
        $unset: {
          analytics: 1,
          searchIndex: 1,
          primaryDepartment: 1
        }
      });

      // Remove new fields from Event documents
      await Event.updateMany({}, {
        $unset: {
          'stats.departmentWiseStats': 1,
          'stats.sessionWiseAttendance': 1,
          'stats.completionRate': 1,
          performance: 1
        }
      });

      // Remove new fields from Registration documents
      await Registration.updateMany({}, {
        $unset: {
          eventCategory: 1,
          eventStartDate: 1,
          eventEndDate: 1,
          year: 1,
          section: 1,
          program: 1,
          analytics: 1,
          performanceMetrics: 1
        }
      });

      // Remove new fields from Attendance documents
      await Attendance.updateMany({}, {
        $unset: {
          department: 1,
          year: 1,
          section: 1,
          eventTitle: 1,
          sessionTitle: 1,
          sessionDate: 1,
          lateArrival: 1,
          earlyDeparture: 1,
          location: 1,
          deviceInfo: 1
        }
      });

      // Remove new fields from Session documents
      await Session.updateMany({}, {
        $unset: {
          realTimeTracking: 1,
          'attendance.departmentWise': 1,
          'attendance.late': 1,
          'attendance.earlyLeave': 1,
          analytics: 1
        }
      });

      console.log('✅ Migration rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  // Validate migration
  async validateMigration() {
    console.log('🔍 Validating migration...');
    
    const validation = {
      users: {
        total: await User.countDocuments(),
        withAnalytics: await User.countDocuments({ analytics: { $exists: true } }),
        withSearchIndex: await User.countDocuments({ searchIndex: { $exists: true } })
      },
      events: {
        total: await Event.countDocuments(),
        withPerformance: await Event.countDocuments({ performance: { $exists: true } })
      },
      registrations: {
        total: await Registration.countDocuments(),
        withAnalytics: await Registration.countDocuments({ analytics: { $exists: true } })
      },
      attendance: {
        total: await Attendance.countDocuments(),
        withDepartment: await Attendance.countDocuments({ department: { $exists: true } })
      },
      sessions: {
        total: await Session.countDocuments(),
        withRealTimeTracking: await Session.countDocuments({ realTimeTracking: { $exists: true } })
      }
    };

    console.log('📋 Migration Validation Results:');
    console.log(JSON.stringify(validation, null, 2));

    return validation;
  }
}

// Export for use in scripts
module.exports = DatabaseMigration;

// Command line execution
if (require.main === module) {
  const connectDB = require('../config/database');
  
  async function runMigration() {
    try {
      await connectDB();
      
      const migration = new DatabaseMigration();
      const args = process.argv.slice(2);
      
      if (args.includes('--rollback')) {
        await migration.rollbackMigration();
      } else if (args.includes('--validate')) {
        await migration.validateMigration();
      } else {
        await migration.runMigration();
        await migration.validateMigration();
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  }
  
  runMigration();
}