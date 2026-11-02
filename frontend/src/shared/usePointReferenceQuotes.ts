import { useEffect, useState } from 'react'
import { quoteAccountPoints, type AccountCurrencyReference } from '../api'
import { formatMoney } from './legacyFormatting'
import type { ConsumerLocale } from './catalog'

function pointKey(value:number):string | null {
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER / 1_000_000) return null
  return value.toFixed(6)
}

/** Reference quotes are fetched in batches; unsupported, stale or failed quotes fall back to points. */
export function usePointReferenceQuotes(session:{userId:number;accessToken:string}|null,platform:string|null,values:number[]) {
  const keys=Array.from(new Set(values.map(pointKey).filter((key):key is string=>key!==null))).sort()
  const signature=JSON.stringify(keys)
  const [result,setResult]=useState<{signature:string;platform:string;userId:number;quotes:Record<string,AccountCurrencyReference> }|null>(null)
  const userId=session?.userId, token=session?.accessToken
  useEffect(()=>{
    if (!userId || !token || !platform) return
    const requested=JSON.parse(signature) as string[]
    if (!requested.length) return
    let active=true
    const chunks:Array<string[]>=[]
    for(let index=0;index<requested.length;index+=100) chunks.push(requested.slice(index,index+100))
    void Promise.all(chunks.map(chunk=>quoteAccountPoints(userId,token,platform,chunk))).then(batches=>{
      if (!active) return
      const quotes:Record<string,AccountCurrencyReference>={}
      batches.flat().forEach(quote=>{const key=pointKey(Number(quote.points));if(key)quotes[key]=quote})
      setResult({signature,platform,userId,quotes})
    }).catch(()=>{if(active)setResult(null)})
    return ()=>{active=false}
  },[userId,token,platform,signature])
  return (points:number,locale:ConsumerLocale,unit:string) => {
    const key=pointKey(points)
    const quote=key && result?.signature===signature && result.platform===platform && result.userId===userId ? result.quotes[key] : null
    return quote?.status==='CONFIGURED' && quote.amount!==null && quote.currencyCode
      ? `${quote.amount} ${quote.currencyCode}` : `${formatMoney(points,locale)} ${unit}`
  }
}
