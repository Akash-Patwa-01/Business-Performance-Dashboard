# Business Performance Dashboard

A lightweight internal Business Performance Dashboard built as an AI-assisted technical assignment.

## Live application

Add the final Vercel URL here after deployment:

`https://YOUR-PROJECT.vercel.app`

## What the application does

The dashboard allows a team member to:

- Sign in to the application.
- Create a new account and verify the email with a 6-digit OTP.
- Use the demo admin login without email verification.
- Reset a user password through email OTP verification.
- Upload CSV performance data.
- Automatically calculate:
  - Total Leads
  - Total Calls
  - Website Visits
  - Revenue
  - Conversion Rate
- Upload a previous-period CSV and compare it with the current period.
- View percentage changes between periods.
- View a performance visualization.
- Receive 3–5 rule-based Performance Insights.
- See clear validation errors for invalid uploads, missing values, missing columns, and invalid numbers.
- Use the dashboard on desktop and mobile.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Supabase Auth for user authentication/email verification
- Papa Parse for CSV parsing
- Chart.js for visualization
- Vercel for deployment
- GitHub for source control

The dashboard processes uploaded CSV data in the browser. No performance CSV is required to be uploaded to a custom application server.

## CSV format

The application expects these columns:

`Date, Leads, Calls, Visits, Revenue, Conversions`

Example:

```csv
Date,Leads,Calls,Visits,Revenue,Conversions
2026-08-01,35,52,700,20000,7
2026-08-02,40,58,760,22000,8
2026-08-03,45,64,820,25000,10
```

### Conversion rate

Conversion Rate is calculated as:

`Total Conversions / Total Leads × 100`

## Sample files

- `sample-current-period.csv` — current-period data
- `sample-previous-period.csv` — previous-period data

The two files can be uploaded together to demonstrate the comparison feature.

Additional files are included for error-handling demonstrations:

- `test-missing-column.csv`
- `test-invalid-number.csv`
- `test-missing-value.csv`

## Demo admin

The application includes a demo admin path that does not require email verification.

Use the admin credentials configured in the application for the demonstration environment.

**Important:** These credentials are intentionally for demonstration only. A production application should never hard-code administrator credentials in frontend JavaScript.

## Authentication flow

### Admin

```text
Admin email + password
        ↓
Authentication
        ↓
Dashboard
```

The demo admin does not require email OTP verification.

### New user

```text
Create account
      ↓
Email + password
      ↓
6-digit email OTP
      ↓
Verify email
      ↓
Authenticated session
      ↓
Dashboard
```

### Forgot password

```text
Forgot password
      ↓
Enter email
      ↓
Email OTP
      ↓
Verify OTP
      ↓
Set new password
      ↓
Login
```

Authentication is handled by Supabase rather than by storing real user passwords in browser storage.

## Validation and error handling

The application handles:

1. Empty upload
2. Non-CSV files
3. Missing required columns
4. Missing values
5. Invalid numerical values
6. CSVs with no valid data rows

Invalid rows can be reported/skipped according to the application's validation behavior.

## Performance Insights

The Performance Insights section uses deterministic business rules instead of a paid AI API.

Examples of generated observations include:

- Lead growth compared with the previous period.
- Lead growth combined with conversion-rate decline.
- Revenue growth compared with lead growth.
- Website traffic and call trends.
- Conversion efficiency.

This satisfies the assignment's requirement that insights may be rule-based.

## AI-assisted development

AI tools were used as development assistants, primarily for:

- Initial UI and application structure
- CSV parsing and validation ideas
- Dashboard calculation logic
- Authentication implementation guidance
- Responsive design suggestions
- Debugging JavaScript issues
- Generating test cases
- Reviewing edge cases
- Improving error messages and user experience

### Human review and changes

AI-generated code was not accepted blindly. The implementation was reviewed and modified to:

- Match the exact CSV requirements.
- Add required-column validation.
- Handle missing and invalid numerical data.
- Improve authentication flow.
- Separate admin and new-user verification behavior.
- Add password recovery through OTP.
- Improve the comparison/visualization experience.
- Test valid and invalid CSV scenarios.
- Keep the implementation appropriate for a static frontend deployment.

## Known limitations

This is an assignment/demo application, not a production authentication system.

For a production deployment I would additionally consider:

- Server-side authorization and role enforcement.
- Proper backend protection for administrator privileges.
- Rate limiting for authentication and OTP requests.
- Production email infrastructure.
- Stronger audit logging.
- Centralized monitoring and error reporting.
- Automated unit/integration tests.
- More granular permissions.

## Local setup

Because this is a static frontend, the simplest local workflow is to serve the project with a local HTTP server.

For example:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

If Supabase authentication is enabled, configure the project's authentication settings and email templates before testing signup and password recovery.

## Deployment

The project can be deployed through GitHub + Vercel:

```text
Local code
   ↓
GitHub repository
   ↓
Vercel
   ↓
Production URL
```

Every push to the connected production branch can trigger a new Vercel deployment.

## Testing checklist

### Authentication

- [ ] Admin can log in without email OTP.
- [ ] New user can create an account.
- [ ] New user receives email OTP.
- [ ] Incorrect OTP is rejected.
- [ ] Correct OTP verifies the email.
- [ ] Verified user can access the dashboard.
- [ ] Forgot-password OTP is sent.
- [ ] Correct recovery OTP allows password reset.
- [ ] Logout returns to login.

### CSV

- [ ] Valid current-period CSV uploads successfully.
- [ ] Valid previous-period CSV uploads successfully.
- [ ] Metrics are calculated correctly.
- [ ] Conversion rate is correct.
- [ ] Comparison percentages are correct.
- [ ] Chart renders.
- [ ] Performance Insights render.
- [ ] Empty CSV is rejected.
- [ ] Missing-column CSV is rejected.
- [ ] Invalid-number CSV is handled.
- [ ] Missing-value CSV is handled.
- [ ] Mobile layout works.

## Suggested 3–5 minute demo

1. Show the login page.
2. Log in as the admin.
3. Show the dashboard.
4. Upload `sample-current-period.csv`.
5. Show the five metrics.
6. Upload `sample-previous-period.csv`.
7. Show the comparison and chart.
8. Show Performance Insights.
9. Demonstrate one invalid CSV such as `test-missing-column.csv`.
10. Briefly show the new-user email OTP flow if configured.
11. Explain how AI was used and what was manually reviewed/fixed.
12. Show the GitHub repository and deployed Vercel URL.
