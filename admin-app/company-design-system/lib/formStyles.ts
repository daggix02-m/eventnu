/** Standard form field classes — use on inputs, textareas, and selects in both apps. */
export const inputClass = `
  w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm
  bg-white text-slate-900 outline-none
  focus:ring-2 focus:ring-primary/25 focus:border-primary
  transition-all duration-150
  dark:bg-slate-900 dark:border-slate-700 dark:text-white
  dark:focus:border-primary
  placeholder:text-slate-400
`.trim().replace(/\s+/g, ' ')

export const inputErrorClass = `${inputClass} border-red-400 focus:border-red-400 focus:ring-red-400/25`

export const labelClass = 'text-xs font-semibold text-slate-500 uppercase tracking-wide'

export const errorClass = 'text-xs text-red-500 mt-0.5'
