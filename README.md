# E-Commerce Project

A full-stack e-commerce application (React frontend + Spring Boot backend) with Firebase helpers and Stripe integration.

This repository contains two main parts:

- `backend/` — Spring Boot application (Maven) that provides REST APIs, authentication (JWT), Stripe integration and persistence (MySQL/JPA).
- `frontend/` — React application that uses Firebase for auth, hosting, and serverless functions; integrates with the backend for product/order operations.

---

## Quick summary

- Backend: Java 17, Spring Boot 3.x, Maven. Builds to an executable JAR in `backend/target/`.
- Frontend: React (create-react-app), Firebase hosting & functions in `frontend/functions/`.
- Payment: Stripe Java SDK used in backend; frontend uses Stripe JS packages.

---

## Prerequisites

- Java 17 (OpenJDK or another JDK)
- Maven (for backend)
- Node.js (16+ recommended) and npm
- Firebase CLI (if you plan to deploy the frontend to Firebase Hosting)
- MySQL (or another DB configured in `application.properties`)
- (Optional) GitHub CLI `gh` if you want to create the remote repo from the command line

---

## Project structure

Top-level important folders:

- `backend/` — Spring Boot app, `pom.xml`, `Procfile` (Heroku style), `system.properties` (Java version for some PaaS)
- `frontend/` — React app, `functions/` (Firebase Cloud Functions), `firebase.json`

Also included are other example React projects in the workspace (`React/`, `plzwork/`) but the main app is `frontend/`.

---

## Backend — build & run (locally)

1. Build with Maven (from project root):

```cmd
cd backend
mvn clean package -DskipTests
```

2. Run the jar produced in `backend/target/`:

```cmd
cd backend\target
:: Example jar name observed in the workspace; adjust if different
java -jar ecommerce-backend-0.0.1-SNAPSHOT.jar
```

Alternative for development (run from backend folder):

```cmd
mvn spring-boot:run
```

Notes:

- The backend `pom.xml` uses Java 17 and includes dependencies such as Spring Web, Spring Data JPA, Spring Security, Lombok, Stripe Java SDK and jjwt for JWT handling.
- Database connection details (JDBC URL, username, password) should be provided in `src/main/resources/application.properties` (or as environment variables when running in production).
- A `Procfile` exists for PaaS providers (e.g., Heroku): `web: java -Dserver.port=$PORT $JAVA_OPTS -jar target/*.jar`.

---

## Frontend — build & run

From the `frontend/` folder:

```cmd
cd frontend
npm install
npm start
```

To build for production:

```cmd
npm run build
```

To deploy to Firebase Hosting (if configured):

```cmd
npm run build
firebase deploy --only hosting
```

Notes specific to this frontend:

- The frontend is a React CRA app that relies on Firebase for authentication and several services (Firestore, Storage, Functions).
- The `frontend/functions/` folder contains Firebase Cloud Functions; run `npm install` inside that folder if you plan to emulate or deploy functions.
- Useful scripts from `package.json`:
  - `start` — start CRA dev server
  - `build` — create production bundle
  - `deploy` — build and then `firebase deploy --only hosting`

Environment files:

- `frontend/src/env.example` exists as an example for environment variables. Copy it to `.env` or configure your Firebase and Stripe keys using environment variables or the hosting provider's secret manager.

---

## Environment / Secrets

Common values you will need to configure before running/deploying:

- Backend: DB URL, DB user, DB password, JWT secret, STRIPE_API_KEY, any mail/sendgrid keys
- Frontend: Firebase config (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId), Stripe publishable key

Set these via your environment or a secure configuration mechanism. Avoid committing secrets to the repo.

---

## Deployment notes

- Backend: Package with `mvn package` and deploy the generated JAR to your hosting environment. The provided `Procfile` and `system.properties` suggest previous use of Heroku-like or PaaS deployment.
- Frontend: Can be hosted on Firebase Hosting (there are Firebase config and rules in the repo). Use `firebase deploy` after configuring your Firebase project.

---

## How to create a GitHub repository named "E-Commerce Project" and push (recommended)

If you have `gh` (GitHub CLI) installed and authenticated, from the project root run:

```cmd
:: initialize repo (if not already a git repo)
git init
git add .
git commit -m "Initial commit: add project"

:: create a new repo on GitHub and push main branch
gh repo create "E-Commerce Project" --public --source=. --remote=origin --push
```

If you prefer to create the remote on github.com manually, then add the remote and push:

```cmd
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/E-Commerce-Project.git
git push -u origin main
```

Replace `<your-username>` with your GitHub username. If authentication is required, follow the prompts or configure a personal access token.

---

## What I added

- `README.md` (this file) at project root — overview, setup, build and deploy instructions
- `.gitignore` — common ignores for Java/Maven and Node/React

---

## Next steps / suggestions

- Add a CI workflow (GitHub Actions) to build both backend and frontend and run basic tests.
- Add a small `README` in `backend/` and `frontend/` (frontend already contains a README) with env examples.
- Add a Dockerfile for the backend and a Docker image + small nginx static container for the frontend.
- Add unit tests and integration tests for critical backend services.

---

## Screenshots

Home page (rendered from the built React app):

![Home page screenshot](assets/screenshots/home.png)


If you'd like, I can:

- Initialize a local git repo and run the push commands for you (I will need confirmation to run terminal commands here), or
- Generate a GitHub repo via the GitHub CLI if you're authenticated and want me to run it.

Tell me which action you prefer and I will proceed.
