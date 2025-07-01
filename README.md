# create-nodemantra

[![npm version](https://img.shields.io/npm/v/create-nodemantra.svg)](https://www.npmjs.com/package/create-nodemantra)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **NodeMantra Core project scaffolding CLI**

---

## 🚀 Quick Start

Create a new NodeMantra project in seconds:

```bash
npx create-nodemantra my-new-app
```

Or install globally:

```bash
npm install -g create-nodemantra
create-nodemantra my-new-app
```

---

## 📦 What You Get
- TypeScript + Node.js project structure
- Pre-configured scripts for development, build, and testing
- Example User model, service, controller, and routes
- Environment variable templates
- Ready-to-go with [nodemantra-core](https://github.com/developerprakashjoshi/nodemantra-core)

---

## 🛠️ Usage

1. **Create a new project:**
   ```bash
   npx create-nodemantra my-app
   # or
   create-nodemantra my-app
   ```
2. **Go to your project folder:**
   ```bash
   cd my-app
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start development server:**
   ```bash
   npm run dev
   ```

---

## 🗂️ Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Database models
├── routes/          # Route definitions
├── middlewares/     # Custom middlewares
├── config/          # Configuration files
├── tests/           # Test files
└── index.ts         # Application entry point
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and update the values:

```env
NODE_ENV=development
PORT=3000
HOST=localhost
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=nodemantra_db
JWT_SECRET_KEY=your-secret-key
```

---

## 📚 Documentation
- [NodeMantra Core Documentation](https://github.com/developerprakashjoshi/nodemantra-core)
- [NPM Package](https://www.npmjs.com/package/nodemantra-core)

---

## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📝 License

MIT © Prakash Joshi