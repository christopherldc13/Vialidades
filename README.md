# 🚦 Proyecto Vialidades

A modern traffic incident reporting platform built with the MERN stack (MongoDB, Express, React, Node.js).

## ✨ Features

- **Report Incidents**: Currently supporting traffic, accidents, and hazards.
- **Offline/Demo Mode**: Try the app locally even without a backend connection!
- **Interactive Dashboard**: View reports in a modern grid layout.
- **Moderation Tools**: Approve or reject reports (Moderator role).
- **Responsive Design**: Mobile-first UI with dark/light mode aesthetics.

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vialidades.git
   cd vialidades
   ```

2. **Install Dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `server` directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. **Run the App**
   (Windows users can use the start script)
   ```powershell
   ./start-dev.ps1
   ```
   Or run manually:
   - Server: `cd server && npm start`
   - Client: `cd client && npm run dev`

## 🛠 Tech Stack

- **Frontend**: React, Vite, CSS Modules (Glassmorphism design)
- **Backend**: Node.js, Express
- **Database**: MongoDB Atlas
- **Authentication**: JWT & Bcrypt

## 📝 License

This project is licensed under the MIT License.
