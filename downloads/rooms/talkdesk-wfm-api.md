# Talkdesk schedule and forecast imports

Study notes. Not vendor documentation and not legal advice.

- The Schedule Event Import API uploads agent schedule events into Talkdesk WFM with CSV files.
- Use cases named there include shifts, time off, breaks, and meetings.
- It also names an HRIS or other workforce tool as a typical source.
- The Forecast Import API uploads forecast data with CSV files.
- Forecast use cases include overriding a system-generated forecast for queues and time intervals.

Sketch a pipeline: HRIS CSV, schedule import, Talkdesk WFM. A second pipeline: forecast CSV, forecast import, queues and intervals. Label both as Talkdesk, and both as CSV.

