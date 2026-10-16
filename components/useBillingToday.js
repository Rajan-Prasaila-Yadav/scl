import { useEffect, useState } from 'react'
import { billingToday } from '../lib/invoiceTiming'
export default function useBillingToday() {
  const [today,setToday]=useState(billingToday)
  useEffect(()=>{
    const update=()=>setToday(billingToday())
    const timer=setInterval(update,60000)
    window.addEventListener('focus',update)
    return ()=>{clearInterval(timer);window.removeEventListener('focus',update)}
  },[])
  return today
}
