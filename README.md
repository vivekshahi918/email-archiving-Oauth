<p align="center">
  <a href="https://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
  </a>
</p>

<h2 align="center">📧 Email Archiver with Gmail OAuth + PostgreSQL</h2>

<p align="center">
  A full-stack NestJS project that uses Google OAuth2 to archive Gmail messages and attachments into PostgreSQL and optionally Google Drive.
</p>

---


## 🖼️ Screenshots

### 🔐 After Authentication
![After Authentication](screenshots/after-authentication.png)

### 🗃️ Entity in My Database
![Entity in My Database](screenshots/entity-in-db.png)

### 📥 Fetching Emails
![Fetching Emails](screenshots/fetching-emails.png)

### 🔗 Generated URL
![Generated URL](screenshots/generated-url.png)

### ☁️ Google Cloud Setup
![Google Cloud](screenshots/google-cloud.png)

### 🚀 Starting the App
![Starting App](screenshots/starting-app.png)

### 📊 Table in Database
![Table in Database](screenshots/table-in-database.png)

---

## 📌 Features

- 🔐 Google OAuth 2.0 integration
- 📩 Fetch emails via Gmail API
- 💾 Store email metadata into PostgreSQL
- 📎 Save attachments to Google Drive
- 📤 Schedule email fetching via node-cron
- 🌐 Deployment-ready with Railway or other PostgreSQL hosting

---

## 🚀 Tech Stack

- **Backend:** NestJS (TypeScript)
- **OAuth & APIs:** Google Gmail API, Google Drive API
- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Deployment:** Railway
- **Auth Strategy:** OAuth2 with `client_secret.json`

---


## ⚙️ Setup Instructions

1. Clone and Install Dependencies
    ```bash
    git clone https://github.com/vivekshahi918/email-archiving-Oauth.git
    ```
    ```bash
    cd email-archiver
    ```
    ```bash  
    npm install
    ```

3. Configure Environment Variables  
   Create a .env file at the root:

    `DATABASE_URL=postgresql://postgres:@/`  
    `GOOGLE_CLIENT_SECRET_PATH=src/config/client_secret.json`  

    Example Railway connection:  
    .env
    
    `DATABASE_URL=postgresql://postgres:yourpassword@yamanote.proxy.rlwy.net:18496/railway`

4. Add Google OAuth Credentials  
   Go to Google Cloud Console
    
    - Enable Gmail API and Drive API  
    - Set up OAuth consent screen  
    - Create OAuth Client ID for Web  
    - Add redirect URI: `http://localhost:3000/auth/google/callback ` 
    - Download client_secret_*.json  
    - Rename it to client_secret.json and place it at:  
      `src/config/client_secret.json`

5. Start the Development Server
    ```bash
    npm run start:dev
    ```  
    Visit: `http://localhost:3000`  
    Google login will initiate the OAuth flow.

## 🧪 Test Email Fetching

- Log in with your Google Account  
- System fetches last 50 emails from inbox  
- Email data stored in PostgreSQL  
- Attachments uploaded to your Google Drive

## 📦 Build for Production

  ```bash
  npm run build  
  npm run start:prod
  ```

## 🛠️ Future Improvements

- Add search and filters to frontend  
- Store emails in batches  
- Add pagination to email list view  
- Secure OAuth tokens via encryption

## 👨‍💻 Author

Vivek Shahi
Email: shahivivek503@gmail.com  
GitHub: https://github.com/vivekshahi918

