import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { Category } from '../src/models/Category.js';

describe('MongoDB Aggregation Analytics APIs', () => {
  let userToken, userId;
  let foodCat, salaryCat;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Analytics Tester',
      email: 'analytics@example.com',
      password: 'Password123!',
    });
    userToken = regRes.body.token;
    userId = regRes.body.user.id;

    foodCat = await Category.findOne({ userId, name: 'Food & Dining' });
    salaryCat = await Category.findOne({ userId, name: 'Salary' });
  });

  it('should calculate summary totals and savings rate accurately (Aggregation 1)', async () => {
    // Add income: 50,000
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'income',
        amount: 50000,
        categoryId: salaryCat._id.toString(),
        description: 'Monthly Salary',
        date: '2026-10-01T10:00:00.000Z',
      });

    // Add expense: 15,000
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'expense',
        amount: 15000,
        categoryId: foodCat._id.toString(),
        description: 'Monthly Food',
        date: '2026-10-05T12:00:00.000Z',
      });

    const res = await request(app)
      .get('/api/analytics/summary?startDate=2026-10-01&endDate=2026-10-31')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe(50000);
    expect(res.body.data.totalExpense).toBe(15000);
    expect(res.body.data.netBalance).toBe(35000);
    // Savings rate = (50000 - 15000) / 50000 * 100 = 70%
    expect(res.body.data.savingsRate).toBe(70);
  });

  it('should return empty summary gracefully when user has no transactions', async () => {
    const res = await request(app)
      .get('/api/analytics/summary')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalIncome).toBe(0);
    expect(res.body.data.totalExpense).toBe(0);
    expect(res.body.data.netBalance).toBe(0);
    expect(res.body.data.savingsRate).toBe(0);
  });

  it('should compute budget utilization against actual transaction records (Aggregation 5)', async () => {
    // Create budget: 10,000 for Food in Oct 2026
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categoryId: foodCat._id.toString(),
        amount: 10000,
        month: 10,
        year: 2026,
        alertThreshold: 80,
      });

    // Create spending: 8,500 in Oct 2026
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'expense',
        amount: 8500,
        categoryId: foodCat._id.toString(),
        description: 'Supermarket Groceries',
        date: '2026-10-10T14:00:00.000Z',
      });

    const res = await request(app)
      .get('/api/analytics/budget-utilization?month=10&year=2026')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.budgets.length).toBe(1);
    const item = res.body.data.budgets[0];
    expect(item.budgetAmount).toBe(10000);
    expect(item.actualSpent).toBe(8500);
    expect(item.remaining).toBe(1500);
    expect(item.percentageUsed).toBe(85);
    expect(item.isNearThreshold).toBe(true);
    expect(item.isExceeded).toBe(false);
  });

  it('should calculate month-over-month comparison without zero division errors (Aggregation 8)', async () => {
    // Current month (Month 10): 5,000 expense, Previous month (Month 9): 0 expense
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'expense',
        amount: 5000,
        categoryId: foodCat._id.toString(),
        description: 'October Expense',
        date: '2026-10-12T10:00:00.000Z',
      });

    const res = await request(app)
      .get('/api/analytics/month-comparison?month=10&year=2026')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.current.expense).toBe(5000);
    expect(res.body.data.previous.expense).toBe(0);
    // Should handle 0 previous cleanly without NaN or Infinity
    expect(res.body.data.changes.expenseChangePct).toBe(100);
  });
});
