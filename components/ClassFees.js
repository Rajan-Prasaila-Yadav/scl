import React from 'react'
import Link from 'next/link'
import { currencySymbol } from '../lib/schoolConfig'
import { canPerform } from '../lib/permissions'
import { money } from '../lib/billing'

export const assignedToClass = (fee, classId) => (fee.classIds || []).some(id => String(id) === String(classId))
const classRate = (fee, id) => fee.classRates?.[id] !== undefined && fee.classRates[id] !== '' ? Number(fee.classRates[id]) : Number(fee.amount)

export default function ClassFees({ classroom, fees, onSaved }) {
  const assigned = fees.filter(f => assignedToClass(f, classroom.id))
  const totals = assigned.filter(f => f.status === 'active').reduce((result, fee) => ({...result, [fee.frequency]: money((result[fee.frequency] || 0) + classRate(fee, classroom.id))}), {})
  return <section className="class-fees">
    <div className="class-fees-heading">
      <div><h3>Fees for {classroom.name} {classroom.section}</h3><p className="class-fees-count">{assigned.length} assigned fees <span aria-hidden="true">·</span> {assigned.filter(f => f.status === 'active').length} active</p></div>
      <div className="class-fees-actions">
        {canPerform('edit', 'Fees') && <Link className="btn btn-primary" href={`/fees?tab=configurator&classId=${classroom.id}&fromClass=${classroom.id}`}><i className="fa-solid fa-sliders" aria-hidden="true"/>Manage class fees</Link>}
      </div>
    </div>
    <p className="class-fees-note"><i className="fa-solid fa-circle-info" aria-hidden="true"/><span>Rates are per student per billing unit. Student overrides can change the final invoice. Existing invoices keep their original amounts.</span></p>
    {assigned.length ? <div className="table-wrap"><table className="roles-table"><thead><tr><th>Fee</th><th>Frequency</th><th>Base rate</th><th>Class rate</th><th>Status</th></tr></thead><tbody>{assigned.map(fee => <tr key={fee.id}><td>{fee.name}</td><td>{fee.frequency}</td><td>{currencySymbol()}{Number(fee.amount).toFixed(2)}</td><td>{currencySymbol()}{classRate(fee,classroom.id).toFixed(2)} {fee.classRates?.[classroom.id] !== undefined && fee.classRates[classroom.id] !== '' ? '(class override)' : '(base)'}</td><td><span className={`badge ${fee.status === 'active' ? 'badge-active' : 'badge-gray'}`}>{fee.status === 'active' ? 'Active' : 'Inactive'}</span></td></tr>)}</tbody></table></div> : <p>No fees assigned to this class yet.</p>}
    <div className="class-fees-summary"><h4>Active totals by frequency</h4><div className="class-fees-total-grid">
      {Object.entries(totals).map(([frequency, total]) => <div className="class-fees-total" key={frequency}><span>{frequency}</span><strong>{currencySymbol()}{total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</strong><small>per student / unit</small></div>)}
      {!Object.keys(totals).length && <p>No active charges.</p>}
    </div></div>
  </section>
}
