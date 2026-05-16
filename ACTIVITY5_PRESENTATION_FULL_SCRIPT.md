# Activity 5 Full Presentation Script

Use this as your complete speaking script while recording or presenting Activity 5.

## Title / Opening

"Good day everyone. I am presenting my Activity 5 project, which is the Lumina Hub Distribution Management System.

This system is designed to manage inventory, sales, users, and system monitoring through a modern interface connected to a MySQL database.

For Activity 5, the main focus of my improvements is user authentication, password recovery, and user account management. I will also briefly show how these features connect to the overall system."

## Before Recording

Make sure these are already running:

1. Backend server in `C:\Users\Nash\OneDrive\Documents\EDP ACT\backend` using `node server.js`
2. Frontend in `C:\Users\Nash\OneDrive\Documents\EDP ACT\frontend` using `npm run dev`
3. Browser opened to `http://127.0.0.1:5173`

## Introduction While Showing Login Page

"This is the login page of my system. It is called Lumina, and it serves as the entry point for authorized users.

The system now supports secure login using user accounts stored in the database. Instead of directly entering the system, users must authenticate using their email and password.

For this demo, I will use the default administrator account."

## Login Demo

On screen:

1. Enter `admin@lumina.com`
2. Enter `password`
3. Click `Sign In`

Say:

"I am now logging in using the administrator account.

After submitting the credentials, the system validates the login through the backend and checks the user record from the database.

If the credentials are correct and the account is active, access is granted."

## After Login / Dashboard

"Now we are inside the system dashboard.

This dashboard gives a quick overview of business activity such as total revenue, active orders, low-stock items, and recent activity logs.

Although the dashboard is part of the overall system, the main feature I will focus on for Activity 5 is the new user management and authentication workflow."

## Go To Users Page

On screen:

1. Click `Users`

Say:

"I will now open the Users page.

This module allows the administrator to manage accounts, including creating users, editing profiles, changing roles, activating accounts, and deactivating accounts.

This is one of the major additions for Activity 5."

## Show User Management Overview

"Here we can see the list of user accounts together with their role, status, and last login information.

At the top, the system also displays account summaries such as total accounts, active accounts, inactive accounts, and administrator accounts.

This makes user monitoring more organized and easier for administrators."

## Add User Demo

On screen:

1. Click `Add User`
2. Fill in:
   - Full Name: `Demo User`
   - Email: `demo.user@lumina.com`
   - Role: `Sales Manager`
   - Status: `Active`
   - Password: `secret123`
3. Click `Create Account`

Say:

"I will now create a sample user account.

Here I can enter the full name, email address, user role, account status, and password.

The role controls the level of access of the user, while the status determines whether the account can log in or not.

Once I click Create Account, the data is sent to the backend and stored in the database.

The password is not stored as plain text. It is processed securely before saving."

## Confirm User Was Added

"As we can see, the new account has now been added to the user list successfully.

This demonstrates that account creation is fully connected to the backend and database."

## Search Demo

On screen:

1. Use the search box
2. Search for `Demo User`

Say:

"Next, I will use the search feature to quickly locate the user that I just created.

This is useful for administrators when managing many records because they can search by name, email, or account code."

## Edit User Demo

On screen:

1. Click the edit button for `Demo User`
2. Change either:
   - Full Name to `Demo User Updated`
   - or Role to `Inventory Clerk`
3. Click `Save Changes`

Say:

"I will now update the user profile.

This shows that an existing account can be modified without recreating it.

The administrator can update the user’s personal details, email, role, and even assign a new password if needed.

After saving, the updated information is reflected immediately in the account list."

## Deactivate User Demo

On screen:

1. Click the deactivate button for that user
2. Confirm the action

Say:

"Now I will set this account to inactive.

Inactive accounts are not allowed to log in. This is useful if a user should temporarily or permanently lose access without deleting the account record.

This demonstrates account lifecycle control, which is another important part of Activity 5."

## Reactivate User Demo

On screen:

1. Click the activate button
2. Confirm the action

Say:

"I will now activate the account again.

This confirms that the administrator can restore system access at any time simply by changing the account status."

## Log Out

On screen:

1. Click `Log Out`

Say:

"Next, I will log out from the administrator account.

After logging out, the session ends and the system returns to the login screen."

## Forgot Password Demo

On screen:

1. Click `Forgot password?`

Say:

"Another important feature added in Activity 5 is password recovery.

This allows a user who forgot their password to request a recovery code and reset their account securely."

## Request Recovery Code

On screen:

1. Enter `demo.user@lumina.com`
2. Click `Generate Recovery Code`

Say:

"I will now enter the email address of the sample account and request a recovery code.

The system generates a time-limited code through the backend. In this demo setup, the code is displayed on screen so the reset flow can be tested without using an external email service."

## Show Recovery Code

"The recovery code is now displayed on the screen.

This proves that the system is able to verify the account and generate a secure temporary code for password reset."

## Reset Password Demo

On screen:

1. Keep or enter the shown recovery code
2. Enter a new password, for example `secret456`
3. Click `Reset Password`

Say:

"I will now use the generated recovery code to reset the password.

After submitting this form, the system validates the recovery code, checks whether it is still valid, and then replaces the old password with the new secure password in the database."

## Log In With Updated Password

On screen:

1. Return to login
2. Enter `demo.user@lumina.com`
3. Enter `secret456`
4. Click `Sign In`

Say:

"Now I will log in using the same account but with the updated password.

This confirms that the password reset process works correctly and that the new password is already active."

## Show Settings & About

On screen:

1. Open `Settings & About`

Say:

"Finally, I will open the Settings and About page.

This page shows the current authenticated session information, including the active user’s name, role, and email.

It also explains the key architectural features of the system, including secure authentication, password recovery, backend-controlled transactions, and database-driven business logic."

## Short Technical Explanation

"To summarize the technical side of Activity 5, the system now includes:

First, database-backed user authentication.

Second, user account creation, editing, activation, and deactivation.

Third, password recovery using a time-limited verification code.

And fourth, secure backend handling of sensitive account operations instead of relying only on the frontend."

## Closing

"In conclusion, Activity 5 improves the Lumina Hub system by adding essential security and account management features.

The system now supports controlled access through login, proper account administration, and password recovery, which makes it more realistic, more secure, and more suitable for actual business use.

That concludes my presentation for Activity 5. Thank you."

## Quick Demo Credentials

- Admin email: `admin@lumina.com`
- Admin password: `password`
- Sample user email: `demo.user@lumina.com`
- Initial sample password: `secret123`
- Reset sample password: `secret456`
