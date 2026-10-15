import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { Category } from '../src/models/Category.js';

describe('Categories & Budgets Integrity APIs', () => {
  let userToken, userId;

  beforeEach(async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Budget Tester',
      email: 'budget@example.com',
      password: 'Password123!',
    });
    userToken = regRes.body.token;
    userId = regRes.body.user.id;
  });

  it('should create a custom category and reject duplicate category names of the same type', async () => {
    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Gym & Fitness',
        type: 'expense',
        color: '#10b981',
        icon: 'dumbbell',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.category.name).toBe('Gym & Fitness');

    // Attempt duplicate creation
    const dupRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Gym & Fitness',
        type: 'expense',
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.message).toContain('already exists');
  });

  it('should prevent deletion of a category that has active transactions', async () => {
    const cat = await Category.findOne({ userId, type: 'expense' });

    // Create transaction in this category
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'expense',
        amount: 150,
        categoryId: cat._id.toString(),
        description: 'Test expense in category',
        date: new Date().toISOString(),
      });

    // Try deleting category
    const deleteRes = await request(app)
      .delete(`/api/categories/${cat._id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.message).toContain('currently linked to 1 transaction');
  });

  it('should create monthly budget for an expense category and reject income category budget', async () => {
    const expCat = await Category.findOne({ userId, type: 'expense' });
    const incCat = await Category.findOne({ userId, type: 'income' });

    // Reject income category budget
    const invalidBudgetRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categoryId: incCat._id.toString(),
        amount: 5000,
        month: 10,
        year: 2026,
      });

    expect(invalidBudgetRes.status).toBe(400);
    expect(invalidBudgetRes.body.message).toContain('expense categories');

    // Create valid budget
    const validBudgetRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categoryId: expCat._id.toString(),
        amount: 7000,
        month: 10,
        year: 2026,
        alertThreshold: 85,
      });

    expect(validBudgetRes.status).toBe(201);
    expect(validBudgetRes.body.budget.amount).toBe(7000);

    // Reject duplicate budget for same category, month, and year
    const dupBudgetRes = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        categoryId: expCat._id.toString(),
        amount: 8000,
        month: 10,
        year: 2026,
      });

    expect(dupBudgetRes.status).toBe(409);
    expect(dupBudgetRes.body.message).toContain('already exists');
  });
});
