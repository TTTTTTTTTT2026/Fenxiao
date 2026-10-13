export function dashboardRate(numerator:number,denominator:number){return denominator===0?'—':`${(numerator/denominator*100).toFixed(1)}%`}
