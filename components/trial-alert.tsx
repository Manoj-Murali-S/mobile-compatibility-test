'use client'

import { useEffect, useState } from 'react'
import { getSetting } from '@/lib/repository/settings'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export function TrialAlert() {
  const [isOpen, setIsOpen] = useState(true)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  // Don't show the alert on the admin settings page to avoid blocking the admin from changing it
  const isAdminSettings = pathname === '/admin/settings'

  useEffect(() => {
    async function checkTrial() {
      try {
        const endDateStr = await getSetting<string>('trialEndDate')
        const alertDaysStr = await getSetting<string>('trialAlertDays')

        if (!endDateStr) return // Trial not configured

        const endDate = new Date(endDateStr)
        const alertThreshold = alertDaysStr ? parseInt(alertDaysStr, 10) : 5
        const now = new Date()

        // Calculate difference in days (ignoring time of day)
        const msPerDay = 1000 * 60 * 60 * 24
        const diffMs = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffMs / msPerDay)

        setDaysLeft(diffDays)

        if (diffDays <= 0) {
          setIsExpired(true)
          setIsOpen(true)
        } else if (diffDays <= alertThreshold) {
          // Only show warning if they haven't dismissed it this session, 
          // or you could just show it once per login. For now we show it.
          const hasDismissed = sessionStorage.getItem('trialAlertDismissed') === 'true'
          if (!hasDismissed) {
            setIsOpen(true)
          }
        }
      } catch (err) {
        console.error("Failed to check trial settings", err)
      }
    }

    if (!isAdminSettings && user?.role !== 'superadmin') {
      checkTrial()
    }
  }, [isAdminSettings, pathname, user?.role])

  if (user?.role === 'superadmin') return null

  return (
    <>
      {/* <div className="fixed bottom-4 right-4 z-[100]">
        <Button
          variant="outline"
          size="sm"
          className="bg-background shadow-md opacity-50 hover:opacity-100"
          onClick={() => {
            if (isExpired) {
              setIsOpen(false)
              setIsExpired(false)
              setDaysLeft(5)
            } else {
              setIsOpen(true)
              setIsExpired(true)
              setDaysLeft(0)
            }
          }}
        >
          Toggle Expired State
        </Button>
      </div> */}
      {isOpen && daysLeft !== null && (
        <Dialog open={isOpen} onOpenChange={(open) => {
          // Prevent closing if expired
          if (isExpired) return
          setIsOpen(open)
          if (!open) {
            sessionStorage.setItem('trialAlertDismissed', 'true')
          }
        }}>
          <DialogContent className={isExpired ? "border-destructive sm:max-w-md [&>button]:hidden" : "sm:max-w-md"}>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <AlertCircle 
                  className={isExpired ? "text-destructive h-6 w-6 cursor-pointer" : "text-amber-500 h-6 w-6"}
                  onClick={() => {
                    if (isExpired) {
                      const newCount = clickCount + 1
                      setClickCount(newCount)
                      if (newCount >= 5) {
                        setIsOpen(false)
                        setIsExpired(false)
                        router.push('/sign-in')
                      }
                    }
                  }}
                />
                <DialogTitle className={isExpired ? "text-destructive" : ""}>
                  {isExpired ? 'Trial Expired' : 'Trial Ending Soon'}
                </DialogTitle>
              </div>
              <DialogDescription className="pt-3 text-base">
                {isExpired ? (
                  <span>
                    Your application trial period has ended. Please contact your administrator or upgrade your plan to continue using the application.
                  </span>
                ) : (
                  <span>
                    Your application trial period will end in <strong className="text-foreground">{daysLeft}</strong> {daysLeft === 1 ? 'day' : 'days'}.
                    Please ensure you have made arrangements to continue usage.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end mt-4">
              {isExpired ? (
                <Button variant="destructive" onClick={() => window.location.href = 'mailto:s.manojmurali@outlook.com'}>
                  Contact Admin
                </Button>
              ) : (
                <Button variant="outline" onClick={() => {
                  setIsOpen(false)
                  sessionStorage.setItem('trialAlertDismissed', 'true')
                }}>
                  Dismiss
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
