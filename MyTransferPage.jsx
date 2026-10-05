import { useState } from 'react'
import { PAYMENT_SOURCES, calcPersonalTransfer, formatMoney, newestMonth } from './finance.mjs'

const STORAGE_KEY = 'hf-personal-transfer:Tushar:v1'

function loadSettings() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid settings')
    return { months: value, error: '' }
  } catch {
    return { months: {}, error: 'Saved personal settings could not be loaded. Choose payment sources again.' }
  }
}

export default function MyTransferPage({ data, user }) {
  const months = data.months || {}
  const [selected, setSelected] = useState(() => newestMonth(months))
  const [saved, setSaved] = useState(loadSettings)
  const active = months[selected] ? selected : newestMonth(months)
  const month = months[active] || {}
  const stored = saved.months[active]
  const settings = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
  const calculation = calcPersonalTransfer(month, settings)
  const { finance, ownExpenses, personalPaid, companyPaid, amount, missingSources } = calculation

  const updateSettings = patch => {
    const next = { ...saved.months, [active]: { ...settings, ...patch } }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setSaved({ months: next, error: '' })
    } catch {
      setSaved(current => ({ ...current, error: 'Could not save on this browser. Check that browser storage is available.' }))
    }
  }

  if (user !== 'Tushar') return null
  if (!active) return <main className="my-transfer"><h1>My Transfer</h1><p>No finance months yet.</p></main>

  return (
    <main className="my-transfer">
      <header className="transfer-heading">
        <div><h1>My Transfer</h1><p>Personal settings stay on this browser.</p></div>
        <label className="transfer-month">Finance month
          <select aria-label="Finance month" value={active} onChange={event => setSelected(event.target.value)}>
            {Object.keys(months).map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
      </header>

      {saved.error && <p className="transfer-warning" role="alert">{saved.error}</p>}
      {!calculation.validFinance && <p className="transfer-warning" role="alert">Check this month's income and expense amounts on the Finance page.</p>}
      {missingSources > 0 && <p className="transfer-warning" role="status">Choose Paid From for {missingSources} {missingSources === 1 ? 'expense' : 'expenses'} to calculate your transfer.</p>}
      {!calculation.validTransferred && <p className="transfer-warning" role="alert">Enter a valid amount already paid to you or your card, including zero.</p>}

      <section className="transfer-result" aria-label="Your remaining transfer">
        <div>
          <h2>{amount !== null && amount < 0 ? 'Return to company' : 'Transfer to myself'}</h2>
          <p>{amount === null ? 'Select payment sources below' : amount === 0 ? 'Nothing left to transfer' : 'Remaining for ' + active}</p>
        </div>
        <output data-testid="personal-transfer">{amount === null ? '--' : formatMoney(Math.abs(amount))}</output>
      </section>

      <dl className="transfer-breakdown">
        <div><dt>My profit / loss share (50%)</dt><dd className={finance.profitShares.Tushar < 0 ? 'transfer-loss' : ''}>{formatMoney(finance.profitShares.Tushar)}</dd></div>
        <div><dt>Personal expense reimbursement</dt><dd>{formatMoney(personalPaid)}</dd></div>
        <div><dt>Company-paid expenses</dt><dd>{formatMoney(companyPaid)}</dd></div>
      </dl>

      <div className="transfer-prior">
        <label htmlFor="already-transferred">Already paid to me / my card
          <input id="already-transferred" type="number" min="0" step="0.01" value={settings.alreadyTransferred ?? 0}
            onChange={event => updateSettings({ alreadyTransferred: event.target.value })}/>
        </label>
        <p>Include previous profit payouts, reimbursements and company payments toward your personal card bill. Keep those repayments out of the expense list.</p>
      </div>

      <section className="transfer-expenses" aria-labelledby="personal-expenses-title">
        <h2 id="personal-expenses-title">My expenses</h2>
        {ownExpenses.length === 0 ? <p>No expenses recorded for Tushar this month.</p> : (
          <div className="transfer-table-wrap">
            <table>
              <thead><tr><th scope="col">Expense</th><th scope="col">Amount</th><th scope="col">Paid From</th><th scope="col">Reimbursement</th></tr></thead>
              <tbody>{ownExpenses.map(expense => {
                const source = settings.sources?.[expense.id] || ''
                const known = PAYMENT_SOURCES.includes(source)
                return <tr key={expense.id}>
                  <td>{expense.name}</td><td>{formatMoney(expense.amount)}</td>
                  <td><select aria-label={'Paid From for ' + expense.name} value={known ? source : ''}
                    onChange={event => updateSettings({ sources: { ...settings.sources, [expense.id]: event.target.value } })}>
                    <option value="">Choose source</option>
                    {PAYMENT_SOURCES.map(name => <option key={name}>{name}</option>)}
                  </select></td>
                  <td>{known ? formatMoney(source === 'Company Account' ? 0 : expense.amount) : '--'}</td>
                </tr>
              })}</tbody>
            </table>
          </div>
        )}
      </section>
      <div className="transfer-totals"><span>Total collected: {formatMoney(finance.totR)}</span><span>All business expenses: {formatMoney(finance.tot)}</span><span>Net profit / loss: {formatMoney(finance.profit)}</span></div>
    </main>
  )
}

