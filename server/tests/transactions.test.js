import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { Category } from '../src/models/Category.js';

describe('Transaction Management & Isolation APIs', () => {
  let userAToken, userBToken, userAId, userBId;
  let userACategoryExpense, userACategoryIncome, userBCategoryExpense;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User Alpha',
      email: 'alpha@example.com',
      password: 'Password123!',
    });
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User Beta',
      email: 'beta@example.com',
      password: 'Password123!',
    });
    userBToken = resB.body.token;
    userBId = resB.body.user.id;

    // Get default categories for User A & User B
    const catAExpense = await Category.findOne({ userId: userAId, type: 'expense' });
    const catAIncome = await Category.findOne({ userId: userAId, type: 'income' });
    const catBExpense = await Category.findOne({ userId: userBId, type: 'expense' });

    userACategoryExpense = catAExpense._id.toString();
    userACategoryIncome = catAIncome._id.toString();
    userBCategoryExpense = catBExpense._id.toString();
  });

  it('should successfully create a valid transaction for authenticated user', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 250.5,
        categoryId: userACategoryExpense,
        description: 'Team Lunch',
        date: new Date().toISOString(),
        paymentMethod: 'UPI',
        notes: 'Lunch at cafe',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.transaction.amount).toBe(250.5);
    expect(res.body.transaction.description).toBe('Team Lunch');
  });

  it('should reject non-positive amounts (amount <= 0)', async () => {
    const resZero = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 0,
        categoryId: userACategoryExpense,
        description: 'Zero amount item',
        date: new Date().toISOString(),
      });

    expect(resZero.status).toBe(400);

    const resNegative = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: -50,
        categoryId: userACategoryExpense,
        description: 'Negative amount item',
        date: new Date().toISOString(),
      });

    expect(resNegative.status).toBe(400);
  });

  it('should reject assigning a category belonging to another user', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 100,
        categoryId: userBCategoryExpense, // Belongs to User B!
        description: 'Unauthorized category use',
        date: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject creating expense transaction with income category', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 500,
        categoryId: userACategoryIncome, // Income category!
        description: 'Mismatched type test',
        date: new Date().toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('designated for');
  });

  it('should prevent User B from viewing, modifying, or deleting User A transactions', async () => {
    // Create transaction by User A
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 320,
        categoryId: userACategoryExpense,
        description: 'Private confidential purchase',
        date: new Date().toISOString(),
      });

    const txId = createRes.body.transaction._id;

    // User B attempts to GET User A's transaction
    const getRes = await request(app)
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(getRes.status).toBe(404);

    // User B attempts to PATCH User A's transaction
    const patchRes = await request(app)
      .patch(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ amount: 9999 });

    expect(patchRes.status).toBe(404);

    // User B attempts to DELETE User A's transaction
    const deleteRes = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(deleteRes.status).toBe(404);
  });

  it('should export transactions to CSV matching RFC 4180 headers', async () => {
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'expense',
        amount: 450,
        categoryId: userACategoryExpense,
        description: 'Books, Pens & "Stationery"',
        date: new Date().toISOString(),
        paymentMethod: 'UPI',
        notes: 'Semester materials',
      });

    const res = await request(app)
      .get('/api/transactions/export/csv')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/csv');
    expect(res.text).toContain('Transaction ID,Date,Type,Category,Description,Amount');
    expect(res.text).toContain('Books, Pens & ""Stationery""');
  });
});
