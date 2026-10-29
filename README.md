# DrPH Field Attachment Progress Dashboard

This is a GitHub Pages-ready progress dashboard for UKM Doctor of Public Health Field Attachment Training I & II (FK8815/FK8825).

## What it tracks
- 8 public health service areas
- Minimum 5 activities per service area
- Minimum 4 supervisor discussion hours per service area
- 7 SSR-PHM competency domains
- L1 / L2 / L3 competency exposure
- Evidence status
- Reflection completion
- Priority gaps

## Important
This dashboard is a progress-monitoring aid only. It does not replace the official UKM logbook, activities compilation, supervisor comments, signatures, official stamps or formal assessment requirements.

## Files
- `index.html` – dashboard page
- `style.css` – layout and styling
- `script.js` – dashboard calculations and filters
- `logbook.csv` – the only file you normally need to update

## How to update your data
Open `logbook.csv` and add one row per mapped competency.

If one activity demonstrates 3 competencies, use 3 rows with the same Date + ServiceArea + Activity.  
The dashboard de-duplicates activity counts automatically.

### CSV columns
- Date
- ServiceArea
- Activity
- Indicator
- Evidence
- Domain
- Competency
- Level
- Role
- DiscussionHours
- Reflection
- Status

### Allowed status values
- Completed
- Ongoing
- Planned

### Reflection
Use `Yes` or `No`.

### Domain
Use 1–7.

### Level
Use L1, L2 or L3.

## GitHub Pages setup
1. Create a new repository, e.g. `drph-field-logbook`.
2. Upload all files in this folder to the repository root.
3. Go to **Settings > Pages**.
4. Under Build and deployment choose **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save.
7. Share the generated GitHub Pages link with your academic and field supervisors.

## Confidentiality
Do not upload:
- patient identifiers
- respondent identifiers
- IC / passport numbers
- phone numbers
- confidential PKD documents
- internal restricted reports
- identifiable clinical information

Use generic evidence descriptions such as `Programme report available` rather than uploading sensitive evidence directly.

## Suggested supervisor use
### Academic supervisor
Focus on competency coverage, L1-L3 levels, reflections and gaps.

### Field supervisor
Focus on activities completed, role, evidence, discussion hours and areas requiring further field exposure.
