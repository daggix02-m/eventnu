'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion } from 'motion/react'

import { cn } from '@/lib/utils'

interface AnimatedTabsContextValue {
  active: string | undefined
}

const AnimatedTabsContext = React.createContext<AnimatedTabsContextValue>({
  active: undefined,
})

interface AnimatedTabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  defaultValue?: string
}

const AnimatedTabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  AnimatedTabsProps
>(({ value, defaultValue, onValueChange, children, ...props }, ref) => {
  const [internal, setInternal] = React.useState(defaultValue)
  const active = value ?? internal

  const handleValueChange = (next: string) => {
    setInternal(next)
    onValueChange?.(next)
  }

  return (
    <AnimatedTabsContext.Provider value={{ active }}>
      <TabsPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </AnimatedTabsContext.Provider>
  )
})
AnimatedTabs.displayName = 'AnimatedTabs'

const AnimatedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-11 w-full items-center justify-center gap-1 rounded-xl border border-outline-variant bg-surface-container-low p-1',
      className,
    )}
    {...props}
  />
))
AnimatedTabsList.displayName = 'AnimatedTabsList'

const AnimatedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const { active } = React.useContext(AnimatedTabsContext)
  const isActive = active === props.value

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'relative inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-body-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface',
        className,
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId="auth-tabs-indicator"
          className="absolute inset-0 rounded-lg bg-primary"
          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </TabsPrimitive.Trigger>
  )
})
AnimatedTabsTrigger.displayName = 'AnimatedTabsTrigger'

const AnimatedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      className,
    )}
    {...props}
  />
))
AnimatedTabsContent.displayName = 'AnimatedTabsContent'

export { AnimatedTabs, AnimatedTabsList, AnimatedTabsTrigger, AnimatedTabsContent }
