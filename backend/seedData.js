import User from './models/User.js';
import Event from './models/Event.js';

const seedDatabase = async () => {
  try {
    console.log('Seeding database...');

    // Create sample users (password will be hashed by the User model pre-save hook)
    const plainPassword = 'password123';

    const sampleUsers = [
      {
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@college.edu',
        password: plainPassword,
        role: 'admin',
        department: 'Administration',
        phone: '+1234567890',
        employeeId: 'ADM001'
      },
      {
        name: 'Dr. Sarah Johnson',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@college.edu',
        password: plainPassword,
        role: 'faculty',
        department: 'Computer Science',
        phone: '+1234567891',
        employeeId: 'FAC001',
        specialization: 'Software Engineering'
      },
      {
        name: 'Prof. Michael Chen',
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@college.edu',
        password: plainPassword,
        role: 'faculty',
        department: 'Electronics',
        phone: '+1234567892',
        employeeId: 'FAC002',
        specialization: 'Digital Electronics'
      },
      {
        name: 'John Smith',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@student.college.edu',
        password: plainPassword,
        role: 'student',
        department: 'Computer Science',
        phone: '+1234567893',
        studentId: 'CS2023001',
        year: 3,
        section: 'A'
      },
      {
        name: 'Emily Davis',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@student.college.edu',
        password: plainPassword,
        role: 'student',
        department: 'Electronics',
        phone: '+1234567894',
        studentId: 'EC2023002',
        year: 2,
        section: 'B'
      },
      {
        name: 'David Wilson',
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@trainer.college.edu',
        password: plainPassword,
        role: 'trainer',
        department: 'Training Center',
        phone: '+1234567895',
        employeeId: 'TRA001',
        experience: 5,
        expertise: ['JavaScript', 'React', 'Node.js'],
        bio: 'Experienced full-stack developer and trainer with 5 years in the industry'
      }
    ];

    // Create users individually to avoid duplicate key errors
    let createdCount = 0;
    for (const userData of sampleUsers) {
      try {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          await User.create(userData);
          createdCount++;
          console.log(`✅ Created user: ${userData.email}`);
        } else {
          console.log(`⏭️  User already exists: ${userData.email}`);
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  Duplicate user skipped: ${userData.email}`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
      }
    }

    console.log(`📊 Created ${createdCount} new users`);

    // Create sample events
    const sampleEvents = [
      {
        title: 'JavaScript Workshop',
        description: 'Comprehensive workshop covering modern JavaScript concepts including ES6+, async/await, and popular frameworks.',
        type: 'workshop',
        date: new Date('2024-12-15T10:00:00Z'),
        location: 'Computer Lab 1',
        capacity: 30,
        department: 'Computer Science',
        createdBy: (await User.findOne({ email: 'sarah.johnson@college.edu' }))._id,
        status: 'published',
        registrationDeadline: new Date('2024-12-13T23:59:59Z')
      },
      {
        title: 'AI and Machine Learning Seminar',
        description: 'Explore the latest trends in artificial intelligence and machine learning with industry experts.',
        type: 'academic',
        date: new Date('2024-12-20T14:00:00Z'),
        location: 'Auditorium',
        capacity: 100,
        department: 'Computer Science',
        createdBy: (await User.findOne({ email: 'sarah.johnson@college.edu' }))._id,
        status: 'published',
        registrationDeadline: new Date('2024-12-18T23:59:59Z')
      },
      {
        title: 'Annual Tech Fest',
        description: 'Two-day technical festival featuring coding competitions, project exhibitions, and guest lectures.',
        type: 'cultural',
        date: new Date('2024-12-25T09:00:00Z'),
        location: 'Main Campus',
        capacity: 500,
        department: 'All Departments',
        createdBy: (await User.findOne({ email: 'admin@college.edu' }))._id,
        status: 'published',
        registrationDeadline: new Date('2024-12-22T23:59:59Z')
      },
      {
        title: 'Electronics Circuit Design Workshop',
        description: 'Hands-on workshop on PCB design and circuit simulation using industry-standard tools.',
        type: 'technical',
        date: new Date('2024-12-18T11:00:00Z'),
        location: 'Electronics Lab',
        capacity: 25,
        department: 'Electronics',
        createdBy: (await User.findOne({ email: 'michael.chen@college.edu' }))._id,
        status: 'published',
        registrationDeadline: new Date('2024-12-16T23:59:59Z')
      },
      {
        title: 'Career Guidance Session',
        description: 'Interactive session with industry professionals discussing career opportunities and trends.',
        type: 'academic',
        date: new Date('2024-12-22T15:30:00Z'),
        location: 'Conference Hall',
        capacity: 80,
        department: 'All Departments',
        createdBy: (await User.findOne({ email: 'admin@college.edu' }))._id,
        status: 'published',
        registrationDeadline: new Date('2024-12-20T23:59:59Z')
      }
    ];

    await Event.insertMany(sampleEvents);
    console.log('Sample events created');

    console.log('Database seeding completed successfully!');
    console.log('\nSample Credentials:');
    console.log('Admin: admin@college.edu / password123');
    console.log('Faculty: sarah.johnson@college.edu / password123');
    console.log('Student: john.smith@student.college.edu / password123');
    console.log('Trainer: david.wilson@trainer.college.edu / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

export default seedDatabase;