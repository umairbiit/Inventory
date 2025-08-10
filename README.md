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

![Reset Password View](https://github.com/TalhaHunter10/MERN-Auth-Boilerplate/blob/main/Sample%20Views/forgot%20password.png?raw=true)

## FAQ

1. **How to login as Admin once we have created it using postman ?**
   -Whenever you login using the admin credentials, the system opens the admin dashboard as there is no normal view for the admin.

2. **What is the Auto Workshop Management System?**

   - It’s a web application designed to help automobile workshops manage their operations, including appointments, inventory, financial tracking, and customer support.

3. **Who can use this system?**

   - The system is designed for both workshop managers and customers. Workshop managers can use it for managing operations, while customers can use it for booking appointments and getting support.

4. **How do I book an appointment?**

   - Simply create an account, navigate to the 'Book Appointment' section, provide your car details and problem description, and submit the request.

5. **Can I edit or cancel an appointment after booking?**

   - Yes, you can edit or cancel your appointment from your dashboard, provided the appointment status is still pending.

6. **How is my data secured?**

   - We use JWT (JSON Web Token) for secure user authentication, and all sensitive information, like passwords, is encrypted using bcrypt.

7. **How do I reset my password if I forget it?**

   - Click on the ‘Forgot Password’ link on the login page. You’ll receive an email with instructions to reset your password.

8. **Where do I get the OpenAI API key?**
   - To get an OpenAI API key, follow these steps:
     1. Go to [OpenAI's platform website](https://platform.openai.com/).
     2. Log in with your OpenAI account, or sign up if you don't have one.
     3. Navigate to the **API Keys** section in your account settings.
     4. Click on **Create new secret key**, then copy and save it in a secure place.

**Important:** Keep your API key private. Do not expose it in your code or public repositories.
