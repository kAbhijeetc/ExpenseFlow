import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Category, DEFAULT_CATEGORIES } from '../models/Category.js';
import { Transaction } from '../models/Transaction.js';
import { Budget } from '../models/Budget.js';

dotenv.config();

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@expenseflow.app';
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'DemoPassword123!';
const DEMO_NAME = process.env.DEMO_USER_NAME || 'Demo Student';

export const seedDemoData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log(`[Seed] Target demo user: ${DEMO_EMAIL}`);

    // Clean up existing demo user and their associated data
    const existingDemoUser = await User.findOne({ email: DEMO_EMAIL });
    if (existingDemoUser) {
      console.log(`[Seed] Found existing demo account (${existingDemoUser._id}). Cleaning up old records...`);
      await Promise.all([
        Transaction.deleteMany({ userId: existingDemoUser._id }),
        Budget.deleteMany({ userId: existingDemoUser._id }),
        Category.deleteMany({ userId: existingDemoUser._id }),
        User.deleteOne({ _id: existingDemoUser._id }),
      ]);
      console.log('[Seed] Previous demo records purged.');
    }

    // Create fresh demo user
    const passwordHash = await User.hashPassword(DEMO_PASSWORD);
    const user = await User.create({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      passwordHash,
      currency: 'INR',
      monthlyIncomeTarget: 85000,
      theme: 'light',
    });
    console.log(`[Seed] Demo user created with ID: ${user._id}`);

    // Insert categories for demo user
    const categoryDocs = await Category.insertMany(
      DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        userId: user._id,
      }))
    );
    console.log(`[Seed] ${categoryDocs.length} categories created.`);

    // Map categories by name for easy reference
    const catMap = {};
    categoryDocs.forEach((c) => {
      catMap[c.name] = c._id;
    });

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth(); // 0-indexed

    // Generate realistic transactions across past 3 months
    const transactions = [];

    // Helper for date creation
    const makeDate = (monthsAgo, day, hour = 12) => {
      return new Date(curYear, curMonth - monthsAgo, day, hour, 0, 0);
    };

    // Month offsets: 2 (2 months ago), 1 (last month), 0 (current month)
    const monthsToSeed = [2, 1, 0];

    for (const mOffset of monthsToSeed) {
      // Regular Income (Salary on 1st, Freelance around 15th)
      transactions.push({
        userId: user._id,
        type: 'income',
        amount: 75000,
        categoryId: catMap['Salary'],
        description: 'Monthly Tech Industry Salary',
        date: makeDate(mOffset, 1, 10),
        paymentMethod: 'bank transfer',
        notes: 'Monthly corporate salary direct deposit',
        tags: ['salary', 'direct-deposit'],
      });

      transactions.push({
        userId: user._id,
        type: 'income',
        amount: 15000,
        categoryId: catMap['Freelance & Projects'],
        description: 'Web Dev & Design Freelance Milestone',
        date: makeDate(mOffset, 14, 15),
        paymentMethod: 'UPI',
        notes: 'Client dashboard MVP design contract',
        tags: ['freelance', 'client-project'],
      });

      if (mOffset !== 0) {
        transactions.push({
          userId: user._id,
          type: 'income',
          amount: 3500,
          categoryId: catMap['Investments'],
          description: 'Quarterly Mutual Fund Dividend',
          date: makeDate(mOffset, 22, 11),
          paymentMethod: 'bank transfer',
          notes: 'Bluechip equity growth fund payout',
          tags: ['dividend', 'investment'],
        });
      }

      // Fixed Expenses (Bills, Rent/Utilities)
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 12000,
        categoryId: catMap['Bills & Utilities'],
        description: 'Apartment Maintenance & Electricity Bill',
        date: makeDate(mOffset, 3, 14),
        paymentMethod: 'UPI',
        notes: 'Monthly power and society maintenance',
        tags: ['bills', 'electricity'],
      });

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 1499,
        categoryId: catMap['Bills & Utilities'],
        description: 'High-speed Fiber Broadband Internet',
        date: makeDate(mOffset, 5, 9),
        paymentMethod: 'card',
        notes: 'Unlimited 300Mbps gigabit home fiber',
        tags: ['internet', 'work-from-home'],
      });

      // Food & Dining transactions
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 4250,
        categoryId: catMap['Food & Dining'],
        description: 'Monthly Organic Supermarket Grocery Stockup',
        date: makeDate(mOffset, 4, 17),
        paymentMethod: 'card',
        notes: 'Provisions, grains, cooking oil and dairy',
        tags: ['groceries', 'home-cooking'],
      });

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 980,
        categoryId: catMap['Food & Dining'],
        description: 'Weekend Dining at Bistro',
        date: makeDate(mOffset, 8, 20),
        paymentMethod: 'UPI',
        notes: 'Dinner with college project teammates',
        tags: ['dining', 'social'],
      });

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 350,
        categoryId: catMap['Food & Dining'],
        description: 'Artisan Coffee & Snacks',
        date: makeDate(mOffset, 12, 16),
        paymentMethod: 'UPI',
        notes: 'Study session refreshment',
        tags: ['cafe', 'study'],
      });

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 1650,
        categoryId: catMap['Food & Dining'],
        description: 'Mid-month Fresh Produce & Fruits',
        date: makeDate(mOffset, 18, 11),
        paymentMethod: 'cash',
        notes: 'Local farmers market vegetables and fruits',
        tags: ['groceries', 'fresh'],
      });

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 720,
        categoryId: catMap['Food & Dining'],
        description: 'Food Delivery Dinner',
        date: makeDate(mOffset, 24, 21),
        paymentMethod: 'UPI',
        notes: 'Late night coding session meal',
        tags: ['delivery', 'takeout'],
      });

      // Transport
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 2200,
        categoryId: catMap['Transport'],
        description: 'Metro Card Monthly Recharge',
        date: makeDate(mOffset, 2, 8),
        paymentMethod: 'card',
        notes: 'Daily campus and office commute',
        tags: ['metro', 'commute'],
      });

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 450,
        categoryId: catMap['Transport'],
        description: 'Cab Ride to Campus Seminar',
        date: makeDate(mOffset, 15, 9),
        paymentMethod: 'UPI',
        notes: 'Rainy morning express ride',
        tags: ['commute', 'taxi'],
      });

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 1200,
        categoryId: catMap['Transport'],
        description: 'Fuel for Two-Wheeler',
        date: makeDate(mOffset, 20, 18),
        paymentMethod: 'UPI',
        notes: 'Full tank petrol refill',
        tags: ['fuel', 'bike'],
      });

      // Shopping & Tech
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 2899,
        categoryId: catMap['Shopping'],
        description: 'Ergonomic Desk Accessories & Cable Organizers',
        date: makeDate(mOffset, 11, 13),
        paymentMethod: 'card',
        notes: 'Setup upgrade for programming workspace',
        tags: ['shopping', 'desk-setup'],
      });

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 1450,
        categoryId: catMap['Shopping'],
        description: 'Apparel & Casual Sneakers',
        date: makeDate(mOffset, 21, 16),
        paymentMethod: 'card',
        notes: 'Seasonal wardrobe essentials',
        tags: ['shopping', 'clothing'],
      });

      // Education & Subscriptions
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 1800,
        categoryId: catMap['Education'],
        description: 'Advanced Cloud Architecture Textbook & Course',
        date: makeDate(mOffset, 7, 10),
        paymentMethod: 'card',
        notes: 'Distributed systems and MongoDB course materials',
        tags: ['education', 'learning'],
      });

      // Entertainment
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 699,
        categoryId: catMap['Entertainment'],
        description: 'Streaming & Media Subscriptions',
        date: makeDate(mOffset, 6, 12),
        paymentMethod: 'card',
        notes: 'Monthly music and video streaming services',
        tags: ['entertainment', 'subscription'],
      });

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 900,
        categoryId: catMap['Entertainment'],
        description: 'IMAX Movie Tickets with Friends',
        date: makeDate(mOffset, 23, 19),
        paymentMethod: 'UPI',
        notes: 'Weekend sci-fi cinema screening',
        tags: ['movies', 'weekend'],
      });

      // Healthcare
      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: 650,
        categoryId: catMap['Healthcare'],
        description: 'Prescription Vitamins & Eye Drops',
        date: makeDate(mOffset, 16, 11),
        paymentMethod: 'UPI',
        notes: 'Screen fatigue eye relief and supplements',
        tags: ['health', 'pharmacy'],
      });
    }

    await Transaction.insertMany(transactions);
    console.log(`[Seed] ${transactions.length} realistic transactions created across 3 calendar months.`);

    // Set up Budgets for current and past months
    const budgetEntries = [];

    for (const mOffset of [1, 0]) {
      const budgetDate = new Date(curYear, curMonth - mOffset, 1);
      const bMonth = budgetDate.getMonth() + 1;
      const bYear = budgetDate.getFullYear();

      budgetEntries.push(
        {
          userId: user._id,
          categoryId: catMap['Food & Dining'],
          amount: 10000,
          month: bMonth,
          year: bYear,
          alertThreshold: 80,
        },
        {
          userId: user._id,
          categoryId: catMap['Transport'],
          amount: 5000,
          month: bMonth,
          year: bYear,
          alertThreshold: 75,
        },
        {
          userId: user._id,
          categoryId: catMap['Shopping'],
          amount: 6000,
          month: bMonth,
          year: bYear,
          alertThreshold: 85,
        },
        {
          userId: user._id,
          categoryId: catMap['Bills & Utilities'],
          amount: 15000,
          month: bMonth,
          year: bYear,
          alertThreshold: 90,
        },
        {
          userId: user._id,
          categoryId: catMap['Entertainment'],
          amount: 2500,
          month: bMonth,
          year: bYear,
          alertThreshold: 80,
        }
      );
    }

    await Budget.insertMany(budgetEntries);
    console.log(`[Seed] ${budgetEntries.length} monthly budgets established.`);

    console.log('===========================================================');
    console.log(' Demo Seeding Complete!');
    console.log(` Email:    ${DEMO_EMAIL}`);
    console.log(` Password: ${DEMO_PASSWORD}`);
    console.log(` Transactions: ${transactions.length}`);
    console.log(` Budgets:      ${budgetEntries.length}`);
    console.log('===========================================================');
  } catch (error) {
    console.error(`[Seed] Error occurred while seeding demo data: ${error.message}`);
    throw error;
  }
};

// If run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDemoData()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await disconnectDB();
      process.exit(1);
    });
}
