# Ambika Trucking Logger

## Summary

A web application designed for Ambika Trucking to log checkpoint transactions, manage driver accounts, and configure application settings. It features distinct roles for drivers and a master administrator, with a focus on tracking weights, calculating bills based on a configurable sand rate, and providing basic user management.

## Features & Functionality

### User Roles

- **Driver:** Can log new transactions, view their own transaction history, print receipts, and manage their own profile (name, contact, password, username). Cannot see other drivers' transactions or manage users/settings.
- **Master:** Has administrative privileges. Can view _all_ transactions, export all transactions to CSV, manage the sand rate setting, add/delete driver accounts, reset driver passwords, and change driver usernames. Cannot log new transactions.

### Authentication

- User registration (for drivers only; the username "master" is disallowed for registration).
- Secure login using username and password (hashed using bcrypt).
- Session management using `express-session` with SQLite store (`connect-sqlite3`).
- Logout functionality.
- Persistent login/logout success notifications displayed on the relevant page (dashboard/login) using `sessionStorage`.

### Transaction Logging (Drivers)

- Form to enter Truck Number, Driver Name (pre-filled with user's full name or username), Initial Weight, Final Weight.
- Automatic calculation of Sand Weight and Bill Amount based on the configured Sand Rate.
- Generation and printing of transaction receipts via the browser's print dialog.
- Viewing list of own past transactions.

### Transaction Management (Master)

- Viewing a list of _all_ transactions logged by all drivers.
- Filtering of the transaction list by selecting a field (Transaction ID, Truck No., Driver Name) and entering a value.
- Exporting all transaction data to a CSV file (`ambika_trucking_transactions.csv`).

### Settings Management (Master)

- Viewing and updating the Sand Rate (INR/Tonne) used for bill calculations.

### User Profile Management (Self-Service)

- Updating own Full Name and Contact Number.
- Changing own password (requires current password verification).
- Changing own username (requires current password verification).

### User Administration (Master)

- Viewing a list of all driver accounts.
- Filtering of the user list by selecting a field (Username, Full Name, Contact) and entering a value.
- Adding new driver accounts (username, password, optional name/contact).
- Deleting driver accounts (prevented if the driver has existing transactions).
- Resetting a driver's password via an input modal.
- Changing a driver's username via an input modal.

## Architecture

- **Backend:** Node.js application using the Express.js framework to provide a RESTful API.
- **Database:** SQLite is used for persistent data storage (`database.db`), including user accounts, transactions, settings, and session data. The database schema is initialized automatically on first run if the file doesn't exist.
- **Frontend:** Static HTML, CSS, and Vanilla JavaScript files served from the `public` directory. Client-side logic uses ES Modules (`public/js/`) for structure and interacts with the backend API via `fetch`.
- **Project Structure:**
  - `server.js`: Main application entry point, sets up Express server and middleware.
  - `src/`: Contains backend source code.
    - `controllers/`: Handles request logic for different features (auth, transactions, settings, users).
    - `routes/`: Defines API endpoints and links them to controllers.
    - `db/`: Database connection and initialization logic (`database.js`).
    - `middleware/`: Authentication checks (`auth.js` -> `requireLogin`, `requireMaster`).
  - `public/`: Contains frontend assets.
    - `index.html`: Login/Registration page.
    - `dashboard.html`: Main application interface after login.
    - `style.css`: Stylesheets.
    - `js/`: Frontend JavaScript modules (`app.js`, `api.js`, `ui.js`, `auth.js`, `transactions.js`, `settings.js`, `users.js`).
  - `database.db`: SQLite database file (created automatically).
  - `.gitignore`: Specifies intentionally untracked files for Git (e.g., `node_modules`, `database.db`).
  - `package.json`: Defines project metadata and dependencies.
  - `README.md`: This file.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** SQLite (`sqlite3` package)
- **Authentication:** `bcrypt` (password hashing), `express-session`, `connect-sqlite3` (session store)
- **Frontend:** HTML, CSS, Vanilla JavaScript (ES Modules)

## Setup and Installation Guide

Follow these steps to set up and run the project locally:

1.  **Prerequisites:**

    - Node.js (which includes npm) installed on your system. (Check with `node -v` and `npm -v`).
    - Git installed on your system. (Check with `git --version`).

2.  **Clone the Repository:** Open your terminal or command prompt and clone the project repository from GitHub.

    ```bash
    git clone <repository_url> # Replace <repository_url> with the actual URL from GitHub
    ```

3.  **Navigate to Project Directory:** Change into the newly cloned project folder.

    ```bash
    cd ambika-trucking-logger
    ```

4.  **Install Dependencies:** Install the required Node.js packages defined in `package.json`.

    ```bash
    npm install
    ```

5.  **Run the Application:** Start the Node.js server. The database file (`database.db`) will be created automatically in the project root if it doesn't exist, along with the necessary tables.

    ```bash
    npm start
    ```

    You should see output indicating the server is running, typically `Server running at http://localhost:3000` and `Database initialized successfully.`.

6.  **Access the Application:** Open your web browser and navigate to `http://localhost:3000`.

7.  **Master User:**
    - The application has special privileges for a user with the username `master`.
    - Registration for the username "master" is disabled.
    - **To use the master account:** You will need to manually add the 'master' user to the `database.db` file using a tool like DB Browser for SQLite, or temporarily modify the registration code (`src/controllers/authController.js` and `src/controllers/userController.js` in the `addUser` function) to allow registering 'master', run the app, register, and then revert the code changes. Remember to use `bcrypt` to hash the password if adding manually.

## Contribution Guidelines

To contribute to this project, please follow these guidelines to maintain code quality and history:

1.  **Main Branch Protection:**

    - The `main` branch is considered the stable branch. **NEVER** commit directly to `main`. All changes should come through Pull Requests.

2.  **Branching Strategy:**

    - Always create a new branch for any new feature, bug fix, or refactoring task.
    - Base your new branch on the latest version of the `main` branch.
    - Use a descriptive branch name prefixed with `feature/`, `fix/`, or `refactor/`. Examples: `feature/add-transaction-editing`, `fix/user-filter-case-sensitivity`, `refactor/api-error-handling`.

    ```bash
    # Make sure your local main is up-to-date
    git checkout main
    git pull origin main

    # Create and switch to your new branch
    git checkout -b feature/your-descriptive-name
    ```

3.  **Development Workflow:**

    - Make your code changes on your feature branch.
    - Commit your changes frequently with clear, concise, and descriptive commit messages. Explain _what_ the change does and _why_.

    ```bash
    git add . # Stage changes
    git commit -m "feat: Add sorting to transactions table"
    # or
    git commit -m "fix: Correct calculation for negative sand weight"
    ```

4.  **Pushing Changes:** Push your local feature branch to the remote repository (GitHub).

    ```bash
    # The first time you push a new branch:
    git push -u origin feature/your-descriptive-name
    # Subsequent pushes on the same branch:
    git push
    ```

5.  **Creating a Pull Request (PR):**

    - Once your feature/fix is complete and pushed, go to the repository on GitHub.
    - Create a Pull Request (PR) from your feature branch targeting the `main` branch.
    - Write a clear title and description for your PR, explaining the changes and referencing any related issues.

6.  **Code Review:**

    - Assign reviewers to your PR (if applicable).
    - Respond to any feedback or comments from the reviewers and push further commits to your branch if necessary. The PR will update automatically.

7.  **Merging:**
    - Once the PR is approved and any required checks pass, it can be merged into the `main` branch (usually by a project maintainer via the GitHub interface).
    - Delete your feature branch after the PR is merged.

## Future Scope

Potential areas for future development and improvement include:

- **Enhanced Data Tables:** Implement server-side or client-side sorting, pagination, and more advanced filtering options (e.g., date ranges) for transaction and user lists.
- **Transaction Editing:** Allow authorized users (master or drivers within a time limit) to edit existing transaction records.
- **Reporting:** Add a simple dashboard section for the master user with key metrics and reports (e.g., daily/weekly totals, activity per driver).
- **Truck Management:** Create a dedicated section to manage truck details (number, owner, etc.), allowing selection during log entry instead of free text.
- **Improved UI/UX:** Fully replace remaining `prompt`/`confirm` with modals, implement a more robust notification system, improve visual design and responsiveness.
- **Audit Log:** Implement logging for critical actions like user creation/deletion, password resets, rate changes, and potential transaction edits.
- **Security Hardening:** Move sensitive configurations like the session secret to environment variables (`.env` file), implement stricter password complexity rules, ensure HTTPS deployment in production.
- **Testing:** Add automated tests (unit, integration, end-to-end) to ensure code quality and prevent regressions.
