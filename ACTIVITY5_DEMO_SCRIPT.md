# Activity 5 Demo Script

Use this exact flow when recording your Activity 5 video.

## Start the system

1. Open a terminal in `C:\Users\Nash\OneDrive\Documents\EDP ACT\backend`
2. Run `node server.js`
3. Open another terminal in `C:\Users\Nash\OneDrive\Documents\EDP ACT\frontend`
4. Run `npm run dev`
5. Open `http://127.0.0.1:5173`

## Demo credentials

- Email: `admin@lumina.com`
- Password: `password`

## Recording flow

1. Show the login page.
2. Log in using the admin account.
3. Open `Users`.
4. Click `Add User`.
5. Create a sample account:
   - Full Name: `Demo User`
   - Email: `demo.user@lumina.com`
   - Role: `Sales Manager`
   - Status: `Active`
   - Password: `secret123`
6. Show that the account appears in the account list.
7. Use the search box to find `Demo User`.
8. Edit the account and change the role or full name.
9. Set the account to `Inactive`.
10. Set the account back to `Active`.
11. Log out.
12. On the login screen, click `Forgot password?`
13. Enter `demo.user@lumina.com`
14. Show the generated recovery code on screen.
15. Reset the password using the recovery code and a new password such as `secret456`.
16. Log in using the updated password.
17. Open `Settings & About` and briefly show the current session details.

## Features covered

- User Authentication
- Password Recovery
- User Management
  - Add Account
  - Update Account Profile
  - Active Account
  - Inactive Account
  - Account List / Search
