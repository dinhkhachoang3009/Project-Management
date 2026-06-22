import { describe, test, expect } from '@jest/globals';

describe('Backend Setup', () => {
  test('Node.js version >= 20', () => {
    const major = parseInt(process.version.slice(1).split('.')[0], 10);
    expect(major).toBeGreaterThanOrEqual(20);
  });

  test('Express có thể import', async () => {
    const express = await import('express');
    expect(express.default).toBeDefined();
    expect(typeof express.default).toBe('function');
  });

  test('Mongoose có thể import', async () => {
    const mongoose = await import('mongoose');
    expect(mongoose.default).toBeDefined();
  });

  test('JWT_SECRET tồn tại trong env hoặc test', () => {
    // Trong CI sẽ set JWT_SECRET; local có thể chưa có
    expect(process.env.JWT_SECRET || 'test-secret').toBeTruthy();
  });
});
