# Oracle of Relphi — Sky from Selection v1.1.9

Select a complete date and location in any webpage; right-click → Oracle of Relphi → **Open highlighted Where and When in Relphi**. The extension parses a calendar date, an optional local time, and the corresponding city/region independently, then opens the commit-pinned Sky Chart preview and fills Sky A. It does not replace Sky B.

Example: `October 29, 1971 at 11:00 AM in Rochester, New York` → Sky A, 1971-10-29, 11:00, Rochester, New York. An absent time is preserved as unknown.

Select two events and choose **Compare two dates** to create Sky A and Sky B. **Use selection as a Relphi location/date** opens an editor draft instead of inventing the missing date or location.

Install: unzip, go to chrome://extensions, enable Developer mode, disable/remove the older Oracle of Relphi — Sky from Selection extension, then **Load unpacked** and select this folder. Refresh the original webpage to pick up the updated right-click menu. Use the extension toolbar icon to open Sky Chart.

Source preview commit: `4f71eed51169a2369c586342e251a3d48d90ae01` (draft PR #379; unmerged).

Street address example: `December 12, 2001, 5:30 p.m. PST, 9600 Wilshire Boulevard, Beverly Hills, California 90212, U.S.A.` → 2001-12-12, 17:30, precise street address, America/Los_Angeles. Also accepts `5:30 p.m.` and `5:30 PM`. The import requires a verified street-level match rather than city-center coordinates.

Time-zone abbreviation and approximate-time example: `October 4, 1985, at approximately 8:34 p.m. E.D.T. in Massachusetts.` → `1985-10-04`, `20:34`, `EDT`, `Massachusetts`. A state alone is not a precise location; confirm a city before calculating angle-dependent placements.