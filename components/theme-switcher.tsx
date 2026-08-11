'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex flex-wrap gap-2" aria-label="Theme selection">
      <Button variant={theme === 'light' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('light')}><Sun data-icon="inline-start" />Light</Button>
      <Button variant={theme === 'dark' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('dark')}><Moon data-icon="inline-start" />Dark</Button>
      <Button variant={theme === 'system' ? 'default' : 'outline'} size="sm" onClick={() => setTheme('system')}><Monitor data-icon="inline-start" />System</Button>
    </div>
  )
}
