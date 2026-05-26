# Self-Service Password Reset (Forgot Password)

To ensure the highest standard of account security, Traxxia provides a secure, self-service password recovery flow. Users can reset their passwords at any time without requiring manual support from a Company Admin or Super Admin.
 

## Key Security Features
*   **Secure OTP Verification**: Access is protected using a temporary 6-digit One-Time Password (OTP).
*   **Time-bound Validity**: Each generated OTP is strictly valid for **5 minutes** from the moment of request.
*   **Multi-step Lockout**: The password reset input fields remain securely locked until the OTP is successfully verified by our identity system.
*   **System Auditing**: All password reset attempts and updates are recorded in the security logs for compliance.
 

## Password Reset Workflow

Follow these steps to recover your account:

### Step 1 — Request OTP
1.  Navigate to the Traxxia **Login Page** (`/login`).
2.  Click the **Forgot Password?** link located below the login credentials field.
3.  Enter your **Registered Email Address**.
4.  Click **Send OTP**. The system will generate and email a unique 6-digit verification code.

> [!NOTE]
> Ensure you enter the exact email address used during your registration. If you do not see the email within 1 minute, check your spam or junk folder.
 

### Step 2 — Verify OTP
1.  Open the inbox of your registered email and look for a message from **info@traxxia.ai**.
2.  Locate the secure **6-digit OTP** contained in the email.
3.  Return to the Traxxia verification form and enter the code. 
    *   *Tip: You can paste the code directly, or type it in—the inputs will auto-focus to the next digit block.*
4.  Click **Verify OTP**. Upon verification, the password reset section will be unlocked.
 

### Step 3 — Reset Password
1.  Enter your new desired password in the **New Password** field.
2.  Re-enter the password in the **Confirm New Password** field to verify accuracy.
3.  Click **Reset Password**.
4.  Upon success, the system will display a success message and automatically redirect you back to the **Login Page** so you can log in with your new credentials.

> [!IMPORTANT] Choose a strong, unique password that is at least 8 characters long and contains a mix of letters, numbers, and symbols to maximize your account security.
