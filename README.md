# MERN AUTHENTICATION BOILERPLATE

A fully configured MERN stack authentication boilerplate for starting a new project without writing authentication from scratch.

### Overview

A ready-to-use authentication starter template built with the MERN stack (MongoDB, Express.js, React, Node.js) and React Context API for global state management. This boilerplate includes secure JWT-based authentication, email-utilities, and streamlined user session handling to help you kickstart your next project without reinventing the wheel.

### Technology

- **Frontend**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Ant Design](https://ant.design/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **Authentication**: [JWT (JSON Web Token)](https://jwt.io/)
- **State Management**: React Context API
- **Email Utility**: NodeMailer

## Environment Variables

To run this project, you will need to add the following environment variables to your

**server .env file**

`PORT =`

`MONGO_URI =`

`NODE_ENV=development`

`JWT_SECRET =`

`EMAIL_HOST = smtp.gmail.com`

`EMAIL_USER = <your_gmail_address>`

`EMAIL_PASS = <your_gmail_password>`

`EMAIL_SECRET = <your_email_secret>`

`FRONTEND_URL = <url:port>`

**client .env file**

`VITE_BACKEND_URL = <url:port>`

## Initializing Project

**Open separate terminals for client and server.**

Run the following command in both terminals.

```bash
  npm install
```

In case of any issue with dependencies, run :

```bash
  npm install --legacy-peer-deps
```

Now start both client using :

```bash
  npm run dev
```

and server using :

```bash
  npm start
```

If any issue arises, install or update the relevant package.

## Admin API

To create the admin account use postman to target the following api with the specific data below.

#### Get all items

Replace <url:port> below with your url and backend server port e.g localhost:8080

```http
  POST <url:port>/api/auth/register/admin
```

x-www-form-urlencoded :

| Key        | Value    |
| :--------- | :------- |
| `name`     | `string` |
| `email`    | `string` |
| `phoneno`  | `string` |
| `password` | `string` |

**Password should be greater than 6 digits**

## Features

- 🔑 **JWT Authentication** – Secure login and registration flow
- 👤 **User Context** – Easily access and manage logged-in user data anywhere in the app
- 📄 **Protected Routes** – Role-based access for users and admins
- 🔄 **Auto Login** – Keep sessions alive with token refresh support
- 🎨 **Minimal UI** – Works out of the box, easy to style with Tailwind CSS or your own setup
- 🚀 **Quick Start** – Clone, configure, and start building right away

## Sample Views

### Login Page

![Login View](https://github.com/TalhaHunter10/MERN-Auth-Boilerplate/blob/main/Sample%20Views/login.png?raw=true)

### Register Page

![Signup View](https://github.com/TalhaHunter10/MERN-Auth-Boilerplate/blob/main/Sample%20Views/register.png?raw=true)

### Forgot Password

![Forgot Password View](https://github.com/TalhaHunter10/MERN-Auth-Boilerplate/blob/main/Sample%20Views/forgot%20password.png?raw=true)

### Reset Password

![Reset Password View](https://github.com/TalhaHunter10/MERN-Auth-Boilerplate/blob/main/Sample%20Views/reset%20password.png?raw=true)

## FAQ

1. **How do I login as an admin once I’ve created it using Postman?**

   - After creating an admin user via Postman (or directly in the database), simply log in with those admin credentials. The system will automatically show the admin view instead of the normal user view.

2. **What is the MERN Authentication Boilerplate?**

   - It’s a ready-to-use starter template for MERN stack applications with built-in JWT authentication, role-based access control, and user session management.

3. **Who can use this boilerplate?**

   - Developers who want to quickly start a full-stack MERN project without setting up authentication from scratch. It supports both normal users and admin roles.

4. **How do I test the login feature?**

   - Create a user via the registration endpoint or Postman, then use the login page with those credentials to access the protected routes.

5. **Can I create multiple roles?**

   - Yes, the boilerplate is structured to support role-based access. You can easily extend it for additional roles beyond `user` and `admin`.

6. **How is data secured?**

   - User authentication is handled via JWT (JSON Web Token), and passwords are securely hashed using bcrypt.

7. **How do I reset a password?**

   - The boilerplate includes a password reset API. You can integrate it with your frontend to allow users to request a reset link via email.

8. **Where do I set environment variables?**
   - Create a `.env` file in both the `server` and `client` directories (if needed) and configure variables like `MONGO_URI`, `JWT_SECRET`, and other required settings.

**Important:** Never commit `.env` files to your repository. Keep all secrets private.
