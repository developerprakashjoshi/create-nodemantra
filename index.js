#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`✓ Created directory: ${dirPath}`, 'green');
  }
}

function createFile(filePath, content) {
  fs.writeFileSync(filePath, content);
  log(`✓ Created file: ${filePath}`, 'green');
}

function getProjectName() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    log('❌ Please provide a project name', 'red');
    log('Usage: npx create-nodemantra <project-name>', 'yellow');
    process.exit(1);
  }
  return args[0];
}

function createPackageJson(projectName) {
  return `{
  "name": "${projectName}",
  "version": "1.0.0",
  "description": "A NodeMantra Core application",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "mocha --require ts-node/register 'src/tests/**/*.test.ts'"
  },
  "keywords": ["nodemantra", "typescript", "nodejs", "framework"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "nodemantra-core": "^1.0.2",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "typeorm": "^0.3.15",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@types/node": "^18.17.6",
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.1",
    "nodemon": "^2.0.22",
    "mocha": "^10.2.0",
    "@types/mocha": "^10.0.1"
  }
}`;
}

function createTsConfig() {
  return `{
  "compilerOptions": {
    "target": "es2016",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`;
}

function createEnvFile() {
  return `NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=nodemantra_db

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here

# Other Configuration
CORS_ORIGIN=http://localhost:3000
`;
}

function createMainIndex() {
  return `import NodeMantra from 'nodemantra-core';
import { errorHandler, notFound } from 'nodemantra-core';
import dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  try {
    // Create NodeMantra application
    const app = new NodeMantra(
      parseInt(process.env.PORT || '3000'),
      process.env.HOST || 'localhost'
    );

    // Initialize the application (this will handle database connection)
    const expressApp = await app.initialize();
    
    // Add your custom routes here
    // expressApp.use('/api/v1', yourRoutes);
    
    // Add error handling
    expressApp.use(notFound);
    expressApp.use(errorHandler);
    
    // Start the server
    app.start();
    
  } catch (error) {
    console.error('❌ Error starting application:', error);
    process.exit(1);
  }
}

bootstrap();
`;
}

function createBaseModel() {
  return `import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class BaseModel {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export default BaseModel;
`;
}

function createUserModel() {
  return `import { Entity, Column } from 'typeorm';
import BaseModel from './base.model';

@Entity('users')
export class User extends BaseModel {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
}
`;
}

function createUserService() {
  return `import { Service } from 'nodemantra-core';
import { AppDataSource } from 'nodemantra-core';
import { User } from '../models/user.model';

export class UserService extends Service {
  private userRepository = AppDataSource.getRepository(User);

  async findAll() {
    return await this.userRepository.find();
  }

  async findById(id: number) {
    return await this.userRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>) {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async update(id: number, userData: Partial<User>) {
    await this.userRepository.update(id, userData);
    return await this.findById(id);
  }

  async delete(id: number) {
    return await this.userRepository.delete(id);
  }
}
`;
}

function createUserController() {
  return `import { Controller } from 'nodemantra-core';
import { Response } from 'nodemantra-core';
import { Request, Response as ExpressResponse } from 'express';
import { UserService } from '../services/user.service';

export class UserController extends Controller {
  constructor(private userService: UserService) {
    super();
  }

  async getUsers(req: Request, res: ExpressResponse) {
    try {
      const users = await this.userService.findAll();
      return Response.success(res, users, 'Users retrieved successfully');
    } catch (error) {
      return Response.error(res, error.message);
    }
  }

  async getUser(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      const user = await this.userService.findById(id);
      
      if (!user) {
        return Response.notFound(res, 'User not found');
      }
      
      return Response.success(res, user, 'User retrieved successfully');
    } catch (error) {
      return Response.error(res, error.message);
    }
  }

  async createUser(req: Request, res: ExpressResponse) {
    try {
      const user = await this.userService.create(req.body);
      return Response.created(res, user, 'User created successfully');
    } catch (error) {
      return Response.error(res, error.message);
    }
  }

  async updateUser(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      const user = await this.userService.update(id, req.body);
      return Response.success(res, user, 'User updated successfully');
    } catch (error) {
      return Response.error(res, error.message);
    }
  }

  async deleteUser(req: Request, res: ExpressResponse) {
    try {
      const id = parseInt(req.params.id);
      await this.userService.delete(id);
      return Response.success(res, null, 'User deleted successfully');
    } catch (error) {
      return Response.error(res, error.message);
    }
  }
}
`;
}

function createUserRoutes() {
  return `import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';

const router = Router();
const userService = new UserService();
const userController = new UserController(userService);

router.get('/users', userController.getUsers.bind(userController));
router.get('/users/:id', userController.getUser.bind(userController));
router.post('/users', userController.createUser.bind(userController));
router.put('/users/:id', userController.updateUser.bind(userController));
router.delete('/users/:id', userController.deleteUser.bind(userController));

export default router;
`;
}

function createReadme(projectName) {
  return `# ${projectName}

A NodeMantra Core application.

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Production

\`\`\`bash
npm start
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Environment Variables

Copy \`.env.example\` to \`.env\` and update the values:

\`\`\`env
NODE_ENV=development
PORT=3000
HOST=localhost
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=nodemantra_db
JWT_SECRET_KEY=your-secret-key
\`\`\`

## Project Structure

\`\`\`
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Database models
├── routes/          # Route definitions
├── middlewares/     # Custom middlewares
├── config/          # Configuration files
└── index.ts         # Application entry point
\`\`\`

## Documentation

- [NodeMantra Core Documentation](https://github.com/developerprakashjoshi/nodemantra-core)
- [NPM Package](https://www.npmjs.com/package/nodemantra-core)
`;
}

function createGitignore() {
  return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;
}

function createNodemonConfig() {
  return `{
  "watch": ["src"],
  "ext": "ts,js",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node ./src/index.ts"
}`;
}

function main() {
  const projectName = getProjectName();
  const projectPath = path.resolve(process.cwd(), projectName);

  log(`🚀 Creating NodeMantra Core project: ${projectName}`, 'blue');

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    log(`❌ Directory ${projectName} already exists`, 'red');
    process.exit(1);
  }

  // Create project directory
  createDirectory(projectPath);

  // Create project structure
  const directories = [
    'src',
    'src/controllers',
    'src/services',
    'src/models',
    'src/routes',
    'src/middlewares',
    'src/config',
    'src/tests'
  ];

  directories.forEach(dir => {
    createDirectory(path.join(projectPath, dir));
  });

  // Create files
  createFile(path.join(projectPath, 'package.json'), createPackageJson(projectName));
  createFile(path.join(projectPath, 'tsconfig.json'), createTsConfig());
  createFile(path.join(projectPath, '.env'), createEnvFile());
  createFile(path.join(projectPath, '.env.example'), createEnvFile());
  createFile(path.join(projectPath, '.gitignore'), createGitignore());
  createFile(path.join(projectPath, 'nodemon.json'), createNodemonConfig());
  createFile(path.join(projectPath, 'README.md'), createReadme(projectName));

  // Create source files
  createFile(path.join(projectPath, 'src/index.ts'), createMainIndex());
  createFile(path.join(projectPath, 'src/models/base.model.ts'), createBaseModel());
  createFile(path.join(projectPath, 'src/models/user.model.ts'), createUserModel());
  createFile(path.join(projectPath, 'src/services/user.service.ts'), createUserService());
  createFile(path.join(projectPath, 'src/controllers/user.controller.ts'), createUserController());
  createFile(path.join(projectPath, 'src/routes/user.routes.ts'), createUserRoutes());

  log('\n✅ Project created successfully!', 'green');
  log('\n📋 Next steps:', 'blue');
  log(`  cd ${projectName}`, 'yellow');
  log('  npm install', 'yellow');
  log('  npm run dev', 'yellow');
  log('\n📚 Documentation:', 'blue');
  log('  https://github.com/developerprakashjoshi/nodemantra-core', 'yellow');
  log('  https://www.npmjs.com/package/nodemantra-core', 'yellow');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main }; 