export const PAYMENT_SOURCES = ['Credit Card', 'Company Account', 'Personal Account']

const paise = value => Math.round(Number(value ?? 0) * 100)

export function formatMoney(value) {
  if (!Number.isFinite(Number(value))) return 'Unavailable'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2
  }).format(Number(value))
}

export function getEffectiveIncome(month = {}) {
  return { ...{ tusharReceived: 0, dheerajReceived: 0 }, ...month.income, ...month.incomeOverrides }
}

export function syncClientIncome(months, clients) {
  return Object.fromEntries(Object.entries(months).map(([name, month]) => {
    const income = { tusharReceived: 0, dheerajReceived: 0 }
    for (const client of clients.filter(client => client.month === name)) {
      if (!['Tushar', 'Dheeraj'].includes(client.receivedBy)) continue
      const key = client.receivedBy === 'Tushar' ? 'tusharReceived' : 'dheerajReceived'
      income[key] += paise(client.amountReceived) / 100
    }
    return [name, { ...month, income }]
  }))
}

export function calcFinance(expenses = [], income = {}) {
  const paid = { Tushar: 0, Dheeraj: 0 }
  for (const expense of expenses) {
    if (Object.hasOwn(paid, expense.paidBy)) paid[expense.paidBy] += paise(expense.amount)
  }
  const tIncome = paise(income.tusharReceived)
  const dIncome = paise(income.dheerajReceived)
  const totalPaid = paid.Tushar + paid.Dheeraj
  const totalIncome = tIncome + dIncome
  const profit = totalIncome - totalPaid
  // Assign an indivisible paisa to Tushar so payouts always reconcile exactly.
  const tProfit = Math.ceil(profit / 2)
  const dProfit = profit - tProfit
  const transfer = tProfit - (tIncome - paid.Tushar)
  return {
    tP: paid.Tushar / 100, dP: paid.Dheeraj / 100, tot: totalPaid / 100, sh: totalPaid / 200,
    tR: tIncome / 100, dR: dIncome / 100, totR: totalIncome / 100,
    profit: profit / 100, ps: profit / 200,
    profitShares: { Tushar: tProfit / 100, Dheeraj: dProfit / 100 },
    s: { amt: Math.abs(transfer) / 100, from: transfer > 0 ? 'Dheeraj' : 'Tushar', to: transfer > 0 ? 'Tushar' : 'Dheeraj' }
  }
}

export function calcPersonalTransfer(month = {}, settings = {}) {
  const expenses = month.expenses || []
  const finance = calcFinance(expenses, getEffectiveIncome(month))
  const ownExpenses = expenses.filter(expense => expense.paidBy === 'Tushar')
  let personal = 0, company = 0, missingSources = 0
  for (const expense of ownExpenses) {
    const source = settings.sources?.[expense.id]
    if (!PAYMENT_SOURCES.includes(source)) missingSources++
    else if (source === 'Company Account') company += paise(expense.amount)
    else personal += paise(expense.amount)
  }
  const alreadyTransferred = settings.alreadyTransferred ?? 0
  const validTransferred = alreadyTransferred !== '' && Number.isFinite(Number(alreadyTransferred)) && Number(alreadyTransferred) >= 0
  const validFinance = Number.isFinite(finance.profit) && expenses.every(expense => Number.isFinite(Number(expense.amount)) && Number(expense.amount) >= 0)
  return {
    finance, ownExpenses, missingSources, validTransferred, validFinance,
    personalPaid: personal / 100, companyPaid: company / 100,
    amount: missingSources || !validTransferred || !validFinance ? null :
      (paise(finance.profitShares.Tushar) + personal - paise(alreadyTransferred)) / 100
  }
}

export function newestMonth(months) {
  const names = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  const order = key => {
    const match = key.match(/^([a-z]+)[\s-]+(\d{4})$/i)
    if (!match) return 0
    const index = names.indexOf(match[1].toLowerCase().slice(0, 3))
    return index < 0 ? 0 : Number(match[2]) * 12 + index
  }
  return Object.keys(months).sort((a, b) => order(b) - order(a))[0] || ''
}

