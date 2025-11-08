const cron = require('node-cron');
const DatabaseOptimizer = require('./databaseOptimizer');
const Analytics = require('../models/Analytics');
const Performance = require('../models/Performance');

class ScheduledTasks {
  constructor() {
    this.optimizer = new DatabaseOptimizer();
    this.tasks = new Map();
  }

  // Initialize all scheduled tasks
  init() {
    console.log('🕐 Initializing scheduled tasks...');

    // Daily analytics generation (every day at 2 AM)
    this.tasks.set('daily-analytics', cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Running daily analytics generation...');
      try {
        await this.optimizer.generateAnalyticsSummary('daily');
        console.log('✅ Daily analytics generation completed');
      } catch (error) {
        console.error('❌ Daily analytics generation failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    }));

    // Weekly analytics (every Sunday at 3 AM)
    this.tasks.set('weekly-analytics', cron.schedule('0 3 * * 0', async () => {
      console.log('🔄 Running weekly analytics generation...');
      try {
        await this.optimizer.generateAnalyticsSummary('weekly');
        console.log('✅ Weekly analytics generation completed');
      } catch (error) {
        console.error('❌ Weekly analytics generation failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    }));

    // Monthly analytics (1st day of month at 4 AM)
    this.tasks.set('monthly-analytics', cron.schedule('0 4 1 * *', async () => {
      console.log('🔄 Running monthly analytics generation...');
      try {
        await this.optimizer.generateAnalyticsSummary('monthly');
        console.log('✅ Monthly analytics generation completed');
      } catch (error) {
        console.error('❌ Monthly analytics generation failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    }));

    // User analytics update (every 4 hours)
    this.tasks.set('user-analytics', cron.schedule('0 */4 * * *', async () => {
      console.log('🔄 Running user analytics update...');
      try {
        await this.optimizer.updateUserAnalytics();
        console.log('✅ User analytics update completed');
      } catch (error) {
        console.error('❌ User analytics update failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    }));

    // Event analytics update (every 6 hours)
    this.tasks.set('event-analytics', cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 Running event analytics update...');
      try {
        await this.optimizer.updateEventAnalytics();
        console.log('✅ Event analytics update completed');
      } catch (error) {
        console.error('❌ Event analytics update failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    }));

    // Database cleanup (every Sunday at 1 AM)
    this.tasks.set('database-cleanup', cron.schedule('0 1 * * 0', async () => {
      console.log('🔄 Running database cleanup...');
      try {
        await this.optimizer.cleanupOldData();
        console.log('✅ Database cleanup completed');
      } catch (error) {
        console.error('❌ Database cleanup failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    }));

    // Performance metrics calculation (daily at 5 AM)
    this.tasks.set('performance-metrics', cron.schedule('0 5 * * *', async () => {
      console.log('🔄 Running performance metrics calculation...');
      try {
        await this.calculatePerformanceMetrics();
        console.log('✅ Performance metrics calculation completed');
      } catch (error) {
        console.error('❌ Performance metrics calculation failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    }));

    // Database health check (every day at 6 AM)
    this.tasks.set('health-check', cron.schedule('0 6 * * *', async () => {
      console.log('🔄 Running database health check...');
      try {
        await this.optimizer.healthCheck();
        console.log('✅ Database health check completed');
      } catch (error) {
        console.error('❌ Database health check failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata'
    }));

    console.log(`✅ Initialized ${this.tasks.size} scheduled tasks`);
  }

  // Start all tasks
  startAll() {
    console.log('▶️ Starting all scheduled tasks...');
    let started = 0;
    
    this.tasks.forEach((task, name) => {
      try {
        task.start();
        started++;
        console.log(`  ✅ Started task: ${name}`);
      } catch (error) {
        console.error(`  ❌ Failed to start task ${name}:`, error.message);
      }
    });

    console.log(`🚀 Started ${started}/${this.tasks.size} scheduled tasks`);
  }

  // Stop all tasks
  stopAll() {
    console.log('⏹️ Stopping all scheduled tasks...');
    let stopped = 0;

    this.tasks.forEach((task, name) => {
      try {
        task.stop();
        stopped++;
        console.log(`  ⏹️ Stopped task: ${name}`);
      } catch (error) {
        console.error(`  ❌ Failed to stop task ${name}:`, error.message);
      }
    });

    console.log(`⏹️ Stopped ${stopped}/${this.tasks.size} scheduled tasks`);
  }

  // Start specific task
  startTask(taskName) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.start();
      console.log(`▶️ Started task: ${taskName}`);
    } else {
      console.error(`❌ Task not found: ${taskName}`);
    }
  }

  // Stop specific task
  stopTask(taskName) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      console.log(`⏹️ Stopped task: ${taskName}`);
    } else {
      console.error(`❌ Task not found: ${taskName}`);
    }
  }

  // Get task status
  getTaskStatus() {
    const status = {};
    this.tasks.forEach((task, name) => {
      status[name] = {
        running: task.running || false,
        scheduled: task.scheduled || false
      };
    });
    return status;
  }

  // Calculate performance metrics for users and events
  async calculatePerformanceMetrics() {
    const User = require('../models/User');
    const Event = require('../models/Event');
    const Registration = require('../models/Registration');

    // Calculate user performance
    const students = await User.find({ role: 'student' }).limit(100); // Process in batches

    for (const student of students) {
      try {
        const registrations = await Registration.find({ userId: student._id });
        
        if (registrations.length === 0) continue;

        const avgAttendanceRate = registrations.reduce((sum, r) => sum + r.attendancePercentage, 0) / registrations.length;
        const certificatesEarned = registrations.filter(r => r.certificate.issued).length;
        const consistencyScore = this.calculateConsistencyScore(registrations);
        
        const performance = new Performance({
          entityType: 'user',
          entityId: student._id,
          entityModel: 'User',
          period: {
            startDate: new Date(new Date().getFullYear(), 0, 1), // Year start
            endDate: new Date()
          },
          userMetrics: {
            attendanceRate: avgAttendanceRate,
            eventsParticipated: registrations.length,
            certificatesEarned,
            consistencyScore,
            engagementLevel: avgAttendanceRate >= 80 ? 'high' : avgAttendanceRate >= 60 ? 'medium' : 'low'
          }
        });

        performance.generateRecommendations();
        await performance.save();

      } catch (error) {
        console.error(`Error calculating performance for user ${student._id}:`, error.message);
      }
    }

    // Calculate event performance
    const events = await Event.find({ status: 'completed' }).limit(50);

    for (const event of events) {
      try {
        const registrations = await Registration.find({ eventId: event._id });
        
        if (registrations.length === 0) continue;

        const attendanceRate = registrations.reduce((sum, r) => sum + r.attendancePercentage, 0) / registrations.length;
        const completionRate = registrations.filter(r => r.attendancePercentage >= 80).length / registrations.length * 100;
        const dropoutRate = registrations.filter(r => r.attendancePercentage < 30).length / registrations.length * 100;
        
        const performance = new Performance({
          entityType: 'event',
          entityId: event._id,
          entityModel: 'Event',
          period: {
            startDate: event.startDate,
            endDate: event.endDate
          },
          eventMetrics: {
            attendanceRate,
            completionRate,
            dropoutRate,
            registrationRate: event.registration.maxParticipants 
              ? (registrations.length / event.registration.maxParticipants) * 100 
              : 100
          }
        });

        performance.generateRecommendations();
        await performance.save();

      } catch (error) {
        console.error(`Error calculating performance for event ${event._id}:`, error.message);
      }
    }
  }

  // Helper method to calculate consistency score
  calculateConsistencyScore(registrations) {
    if (registrations.length === 0) return 0;

    const attendanceRates = registrations.map(r => r.attendancePercentage);
    const mean = attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length;
    const variance = attendanceRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / attendanceRates.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower standard deviation means higher consistency
    // Convert to a score between 0-100 (higher is better)
    return Math.max(0, 100 - standardDeviation);
  }

  // Manual trigger for any task
  async runTaskManually(taskName) {
    console.log(`🔄 Manually running task: ${taskName}`);
    
    try {
      switch (taskName) {
        case 'daily-analytics':
          await this.optimizer.generateAnalyticsSummary('daily');
          break;
        case 'weekly-analytics':
          await this.optimizer.generateAnalyticsSummary('weekly');
          break;
        case 'monthly-analytics':
          await this.optimizer.generateAnalyticsSummary('monthly');
          break;
        case 'user-analytics':
          await this.optimizer.updateUserAnalytics();
          break;
        case 'event-analytics':
          await this.optimizer.updateEventAnalytics();
          break;
        case 'database-cleanup':
          await this.optimizer.cleanupOldData();
          break;
        case 'performance-metrics':
          await this.calculatePerformanceMetrics();
          break;
        case 'health-check':
          await this.optimizer.healthCheck();
          break;
        default:
          throw new Error(`Unknown task: ${taskName}`);
      }
      
      console.log(`✅ Manual task execution completed: ${taskName}`);
    } catch (error) {
      console.error(`❌ Manual task execution failed: ${taskName}`, error.message);
      throw error;
    }
  }
}

module.exports = ScheduledTasks;