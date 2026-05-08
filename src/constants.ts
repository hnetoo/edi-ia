/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CURRENCY_FORMAT = new Intl.NumberFormat('pt-AO', {
  style: 'currency',
  currency: 'AOA',
});

export const MOCK_STATS = {
  cashInHand: 0,
  monthlyExpenses: 0,
  staffExpenses: 0,
  totalEmployees: 0,
  activeEmployees: 0,
  delinquencyRate: 0,
};

export const MOCK_HISTORY = [];

export const MOCK_DEBT_HISTORY = [];
