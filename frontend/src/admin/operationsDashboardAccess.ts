import { resolveAdminSectionFromHash } from './navigation'
type Scope={role?:string;platformScope?:string;guildScope?:string;regionScope?:string}
function full(value?:string){return !value?.trim()||value.trim()==='*'}
export function canUseOperationsDashboard(session:Scope|null|undefined){return !!session&&['super_admin','admin','operations','operator','customer_support'].includes(session.role?.toLowerCase()??'')&&full(session.platformScope)&&full(session.guildScope)&&full(session.regionScope)}
// This is deliberately legacy-only. New /console default routing is not changed.
export function legacyDashboardLanding(hash:string|undefined,allowed:boolean){return !hash&&allowed?'operationsDashboard':resolveAdminSectionFromHash(hash)}
