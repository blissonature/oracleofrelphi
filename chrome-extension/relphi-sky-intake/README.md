# Oracle of Relphi — Sky from Selection

Chrome Manifest V3 extension: dates and addresses can independently open the existing Sky Chart Where and When editor.

## Install
Download and unzip the extension folder (or the CI artifact). In Chrome, visit chrome://extensions, enable Developer mode, choose Load unpacked, and select the chrome-extension/relphi-sky-intake directory.

## Use
- Highlight text and click the toolbar icon or the Open highlighted Where and When context-menu action.
- Right-click highlighted text to use it specifically as a location or a date even if other fields are missing.
- Open the extension Options to enable automatic webpage links for addresses and dates independently. Both are off by default.
- Optional slash-date order: unambiguous only (default), month/day/year, or day/month/year.
- Date-only input must not borrow a prior sky's location/time. Address-only input must not borrow a prior sky's date/time.

## Safety
Recognition happens locally. Activating an item navigates to Oracle of Relphi, where the existing geocoder verifies places and the Where and When owner calculates a chart. Existing links, buttons, code, and editable content are not changed. Unusual or international addresses may require manual selection and confirmation. Existing sky data is not replaced without explicit user action.
