import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcFinance, calcPersonalTransfer, getEffectiveIncome, formatMoney, newestMonth, syncClientIncome } from './finance.mjs'

const month = {
  expenses: [
    { id: 1, name: 'Tools', paidBy: 'Tushar', amount: 3000 },
    { id: 2, name: 'Software', paidBy: 'Tushar', amount: 12000 },
    { id: 3, name: 'Subscription', paidBy: 'Dheeraj', amount: 5000 }
  ],
  income: { tusharReceived: 100000, dheerajReceived: 0 }
}
const personal = { sources: { 1: 'Credit Card', 2: 'Credit Card' } }

test('settlement leaves each partner with half the net profit', () => {
  const result = calcFinance(month.expenses, month.income)
  assert.deepEqual(result.s, { from: 'Tushar', to: 'Dheeraj', amt: 45000 })
  assert.equal(result.tR - result.tP - result.s.amt, 40000)
  assert.equal(result.dR - result.dP + result.s.amt, 40000)
})

test('personal expenses are reimbursed once, company expenses are not', () => {
  assert.equal(calcPersonalTransfer(month, personal).amount, 55000)
  assert.equal(calcPersonalTransfer(month, { sources: {1:'Company Account',2:'Company Account'} }).amount, 40000)
  assert.equal(calcPersonalTransfer(month, { sources: {1:'Company Account',2:'Credit Card'} }).amount, 52000)
  assert.equal(calcPersonalTransfer(month, { sources: {1:'Personal Account',2:'Credit Card'} }).amount, 55000)
})

test('prior payouts and card-bill reimbursements reduce remaining transfer', () => {
  assert.equal(calcPersonalTransfer(month, {...personal,alreadyTransferred:15000}).amount, 40000)
  assert.equal(calcPersonalTransfer(month, {...personal,alreadyTransferred:55000}).amount, 0)
  assert.equal(calcPersonalTransfer(month, {...personal,alreadyTransferred:60000}).amount, -5000)
})

test('unclassified expenses and invalid prior payments cannot produce a payout', () => {
  assert.equal(calcPersonalTransfer(month).amount, null)
  assert.equal(calcPersonalTransfer(month).missingSources, 2)
  assert.equal(calcPersonalTransfer(month, {...personal,alreadyTransferred:''}).amount, null)
  assert.equal(calcPersonalTransfer(month, {...personal,alreadyTransferred:-1}).amount, null)
  assert.equal(calcPersonalTransfer(month, {sources:{1:'Unknown',2:'Credit Card'}}).amount, null)
})

test('losses, zero income and empty months keep their correct meaning', () => {
  const loss = {...month,income:{tusharReceived:0,dheerajReceived:0}}
  assert.equal(calcPersonalTransfer(loss, personal).finance.profitShares.Tushar, -10000)
  assert.equal(calcPersonalTransfer(loss, personal).amount, 5000)
  assert.equal(calcPersonalTransfer({expenses:[],income:{}}).amount, 0)
  assert.match(formatMoney(-5000.5), /-/)
  assert.match(formatMoney(5000.5), /5,000\.5/)
})

test('an odd paisa never creates or loses money when dividing profit', () => {
  for (const income of [0.01,0.03,100.01]) {
    const result = calcFinance([], {tusharReceived:income})
    assert.equal(Math.round((result.profitShares.Tushar+result.profitShares.Dheeraj)*100), Math.round(income*100))
    assert.ok(Math.abs(result.profitShares.Tushar-result.profitShares.Dheeraj) < 0.010001)
    assert.equal(Math.round((income-result.s.amt)*100),Math.round(result.profitShares.Tushar*100))
  }
})

test('source choices ignore deleted expenses and reflect changed amounts', () => {
  const edited = {...month,expenses:month.expenses.map(expense=>expense.id===1?{...expense,amount:4000}:expense)}
  assert.equal(calcPersonalTransfer(edited, personal).amount, 55500)
  const deleted = {...month,expenses:month.expenses.filter(expense=>expense.id!==1)}
  assert.equal(calcPersonalTransfer(deleted, personal).amount, 53500)
})

test('client syncing preserves manual overrides, including zero', () => {
  const months = {'Sept-2026':{...month,incomeOverrides:{tusharReceived:0}}}
  const clients = [{month:'Sept-2026',receivedBy:'Tushar',amountReceived:20000}]
  const updated = syncClientIncome(months,clients)
  assert.equal(updated['Sept-2026'].income.tusharReceived,20000)
  assert.equal(getEffectiveIncome(updated['Sept-2026']).tusharReceived,0)
  assert.equal(calcPersonalTransfer(updated['Sept-2026'],personal).finance.profit,-20000)
  assert.deepEqual(months['Sept-2026'].income,month.income)
})

test('latest month handles existing space and hyphen labels', () => {
  assert.equal(newestMonth({'Feb 2026':{},'Sept-2026':{},'June 2026':{},'Aug 2026':{}}),'Sept-2026')
  assert.equal(newestMonth({}), '')
})

