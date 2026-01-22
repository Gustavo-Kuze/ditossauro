import { execSync } from 'child_process';

/**
 * Global teardown for Playwright e2e tests
 * Ensures all Electron processes from tests are properly cleaned up
 */
async function globalTeardown(): Promise<void> {
  console.log('Running global teardown...');

  if (process.platform === 'win32') {
    // Multiple attempts to ensure cleanup
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Find and kill only Ditossauro Electron processes (by window title)
        execSync(
          'powershell -Command "Get-Process | Where-Object {$_.MainWindowTitle -like \'*Ditossauro*\'} | Stop-Process -Force"',
          { stdio: 'ignore' }
        );
      } catch {
        // No matching processes found, ignore
      }

      try {
        // Kill by command line path containing our project
        execSync(
          'powershell -Command "Get-WmiObject Win32_Process | Where-Object {$_.CommandLine -like \'*openwispr*\' -and $_.Name -eq \'electron.exe\'} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"',
          { stdio: 'ignore' }
        );
      } catch {
        // No matching processes found, ignore
      }

      try {
        // Also try killing by the .vite path which is used in tests
        execSync(
          'powershell -Command "Get-WmiObject Win32_Process | Where-Object {$_.CommandLine -like \'*.vite*\' -and $_.Name -eq \'electron.exe\'} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"',
          { stdio: 'ignore' }
        );
      } catch {
        // No matching processes found, ignore
      }

      // Small delay between attempts
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } else {
    // Unix-like systems
    try {
      execSync('pkill -9 -f "electron.*openwispr"', { stdio: 'ignore' });
    } catch {
      // No matching processes found, ignore
    }
    try {
      execSync('pkill -9 -f "electron.*\\.vite"', { stdio: 'ignore' });
    } catch {
      // No matching processes found, ignore
    }
  }

  console.log('Global teardown complete.');

  // Force a small delay to ensure all cleanup is done
  await new Promise((resolve) => setTimeout(resolve, 500));
}

export default globalTeardown;
