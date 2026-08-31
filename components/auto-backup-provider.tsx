'use client'

import { useEffect } from 'react'
import { getMobiles } from '@/lib/repository/mobiles'
import { getBrands } from '@/lib/repository/brands'
import { getAllCompatibility } from '@/lib/repository/compatibility'
import { getAccessories } from '@/lib/repository/accessories'
import { getAllSettings } from '@/lib/repository/settings'
import { downloadJson } from '@/lib/download-utils'

async function exportLiveSnapshot() {
  const [brands, mobiles, compatibility, accessories, settings] = await Promise.all([
    getBrands(),
    getMobiles(),
    getAllCompatibility(),
    getAccessories(),
    getAllSettings(),
  ])
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    source: 'Local Storage',
    brands,
    mobiles,
    compatibility,
    accessories,
    settings,
  }
}

export function AutoBackupProvider() {
  useEffect(() => {
    const checkTime = async () => {
      const now = new Date();
      const target = new Date();
      target.setHours(22, 0, 0, 0); // 10:00 PM

      if (now > target) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();

      // Auto-trigger if we hit the time (within the 1-minute interval)
      if (diff <= 60000 && diff > 0) {
        // To prevent multiple triggers within the same minute, we can check a lock in localStorage
        const lastBackupStr = localStorage.getItem('lastAutoBackup');
        const todayStr = new Date().toLocaleDateString();

        if (lastBackupStr !== todayStr) {
          localStorage.setItem('lastAutoBackup', todayStr);

          try {
            const snapshot = await exportLiveSnapshot();
            const now = new Date()

            const date = now.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })

            const time = now.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
            const name = `Full Backup ${date} ${time}`
            downloadJson(snapshot, `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`);
          } catch (error) {
            console.error('Auto backup failed', error);
          }
        }
      }
    };

    // Check every minute instead of every second to be lighter on performance
    const intervalId = setInterval(checkTime, 60000);
    // Initial check
    checkTime();

    return () => clearInterval(intervalId);
  }, []);

  return null;
}
