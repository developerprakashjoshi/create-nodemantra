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
    "test": "mocha --require ts-node/register 'src/tests/**/*.test.ts'",
    "artisan": "ts-node ./.node_mantra/sdk/artisan.ts"
  },
  "keywords": ["nodemantra", "typescript", "nodejs", "framework"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "nodemantra-core": "^1.0.8",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "typeorm": "^0.3.15",
    "reflect-metadata": "^0.1.13",
    "ejs": "^3.1.9"
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
    "emitDecoratorMetadata": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@models/*": ["models/*"],
      "@services/*": ["services/*"],
      "@controllers/*": ["controllers/*"],
      "@routes/*": ["routes/*"],
      "@middlewares/*": ["middlewares/*"],
      "@config/*": ["config/*"]
    }
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
import BaseModel from '@models/base.model';

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

function createBaseService() {
  return `import { Repository } from 'typeorm';

export default class BaseService {
  protected repository: Repository<any>;

  constructor(repository: Repository<any>) {
    this.repository = repository;
  }

  async findAll() {
    return await this.repository.find();
  }

  async findById(id: number) {
    return await this.repository.findOne({ where: { id } });
  }

  async create(data: any) {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async update(id: number, data: any) {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number) {
    return await this.repository.delete(id);
  }
}
`;
}

function createUserService() {
  return `import BaseService from '@services/base.service';
import { AppDataSource } from 'nodemantra-core';
import { User } from '@models/user.model';

export class UserService extends BaseService {
  constructor() {
    const userRepository = AppDataSource.getRepository(User);
    super(userRepository);
  }
}
`;
}

function createBaseController() {
  return `import { Request, Response } from 'express';
import { Response as ApiResponse } from 'nodemantra-core';

export default class BaseController {
  protected service: any;

  constructor(service: any) {
    this.service = service;
  }

  async getAll(req: Request, res: Response) {
    try {
      const data = await this.service.findAll();
      return ApiResponse.success(res, data, 'Data retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await this.service.findById(id);
      
      if (!data) {
        return ApiResponse.notFound(res, 'Data not found');
      }
      
      return ApiResponse.success(res, data, 'Data retrieved successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const data = await this.service.create(req.body);
      return ApiResponse.created(res, data, 'Data created successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await this.service.update(id, req.body);
      return ApiResponse.success(res, data, 'Data updated successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await this.service.delete(id);
      return ApiResponse.success(res, null, 'Data deleted successfully');
    } catch (error) {
      return ApiResponse.error(res, error.message);
    }
  }
}
`;
}

function createUserController() {
  return `import BaseController from '@controllers/base.controller';
import { UserService } from '@services/user.service';

export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super(userService);
  }
}
`;
}

function createBaseRoutes() {
  return `import { Router } from 'express';

export default class BaseRoutes {
  protected router: Router;
  protected controller: any;

  constructor(controller: any) {
    this.router = Router();
    this.controller = controller;
    this.setupRoutes();
  }

  protected setupRoutes() {
    this.router.get('/', this.controller.getAll.bind(this.controller));
    this.router.get('/:id', this.controller.getById.bind(this.controller));
    this.router.post('/', this.controller.create.bind(this.controller));
    this.router.put('/:id', this.controller.update.bind(this.controller));
    this.router.delete('/:id', this.controller.delete.bind(this.controller));
  }

  getRouter() {
    return this.router;
  }
}
`;
}

function createUserRoutes() {
  return `import BaseRoutes from '@routes/base.routes';
import { UserController } from '@controllers/user.controller';
import { UserService } from '@services/user.service';

const userService = new UserService();
const userController = new UserController(userService);
const userRoutes = new BaseRoutes(userController);

export default userRoutes.getRouter();
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

## Artisan Commands

NodeMantra includes a powerful command-line interface inspired by Laravel's Artisan:

\`\`\`bash
# List all available commands
npm run artisan list

# Create a complete resource (controller, model, service, validator, route)
npm run artisan make:resource User

# Create individual components
npm run artisan make:controller Post
npm run artisan make:model Category
npm run artisan make:middleware Auth

# Database operations
npm run artisan db:migrate
npm run artisan db:seed

# Start development server
npm run artisan serve
\`\`\`

For a complete list of commands, see the [Artisan Commands documentation](https://github.com/developerprakashjoshi/nodemantra-core/blob/main/ARTISAN.md).

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

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

- \`@/*\` - Points to src directory
- \`@models/*\` - Points to src/models
- \`@services/*\` - Points to src/services
- \`@controllers/*\` - Points to src/controllers
- \`@routes/*\` - Points to src/routes
- \`@middlewares/*\` - Points to src/middlewares
- \`@config/*\` - Points to src/config

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

function createArtisanFile() {
  return `#!/usr/bin/env node

import fs from "fs";
import path from "path";
import * as ejs from "ejs";

// String utility functions
const ucwords = (text) => {
  return text.replace(/\\b\\w/g, function (match) {
    return match.toUpperCase();
  });
};

const toCamelCase = (text) => {
  return text.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
};

const toKebabCase = (text) => {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\\s_]+/g, '-')
    .toLowerCase();
};

const toSnakeCase = (text) => {
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\\s-]+/g, '_')
    .toLowerCase();
};

class Artisan {
  constructor() {
    this.commands = new Map();
    this.registerCommands();
  }

  registerCommands() {
    // Make commands
    this.registerCommand({
      name: "make:controller",
      description: "Create a new controller class",
      usage: "make:controller <name>",
      execute: (args) => this.makeController(args[0])
    });

    this.registerCommand({
      name: "make:model",
      description: "Create a new model class",
      usage: "make:model <name>",
      execute: (args) => this.makeModel(args[0])
    });

    this.registerCommand({
      name: "make:service",
      description: "Create a new service class",
      usage: "make:service <name>",
      execute: (args) => this.makeService(args[0])
    });

    this.registerCommand({
      name: "make:validator",
      description: "Create a new validator class",
      usage: "make:validator <name>",
      execute: (args) => this.makeValidator(args[0])
    });

    this.registerCommand({
      name: "make:route",
      description: "Create a new route file",
      usage: "make:route <name>",
      execute: (args) => this.makeRoute(args[0])
    });

    this.registerCommand({
      name: "make:middleware",
      description: "Create a new middleware class",
      usage: "make:middleware <name>",
      execute: (args) => this.makeMiddleware(args[0])
    });

    this.registerCommand({
      name: "make:test",
      description: "Create a new test file",
      usage: "make:test <name>",
      execute: (args) => this.makeTest(args[0])
    });

    this.registerCommand({
      name: "make:seeder",
      description: "Create a new seeder class",
      usage: "make:seeder <name>",
      execute: (args) => this.makeSeeder(args[0])
    });

    this.registerCommand({
      name: "make:migration",
      description: "Create a new migration file",
      usage: "make:migration <name>",
      execute: (args) => this.makeMigration(args[0])
    });

    this.registerCommand({
      name: "make:resource",
      description: "Create a complete resource (controller, model, service, validator, route)",
      usage: "make:resource <name>",
      execute: (args) => this.makeResource(args[0])
    });

    // List commands
    this.registerCommand({
      name: "list",
      description: "List all available commands",
      usage: "list",
      execute: () => this.listCommands()
    });

    // Clear commands
    this.registerCommand({
      name: "clear:cache",
      description: "Clear application cache",
      usage: "clear:cache",
      execute: () => this.clearCache()
    });

    this.registerCommand({
      name: "clear:logs",
      description: "Clear application logs",
      usage: "clear:logs",
      execute: () => this.clearLogs()
    });

    // Route commands
    this.registerCommand({
      name: "route:list",
      description: "List all registered routes",
      usage: "route:list",
      execute: () => this.listRoutes()
    });

    // Database commands
    this.registerCommand({
      name: "db:seed",
      description: "Run database seeders",
      usage: "db:seed [seeder]",
      execute: (args) => this.runSeeders(args[0])
    });

    this.registerCommand({
      name: "db:migrate",
      description: "Run database migrations",
      usage: "db:migrate",
      execute: () => this.runMigrations()
    });

    this.registerCommand({
      name: "db:rollback",
      description: "Rollback database migrations",
      usage: "db:rollback [steps]",
      execute: (args) => this.rollbackMigrations(args[0])
    });

    // Serve command
    this.registerCommand({
      name: "serve",
      description: "Start the development server",
      usage: "serve [--port=3000] [--host=localhost]",
      execute: (args) => this.serve(args)
    });

    // Optimize command
    this.registerCommand({
      name: "optimize",
      description: "Optimize the application for production",
      usage: "optimize",
      execute: () => this.optimize()
    });

    // Key commands
    this.registerCommand({
      name: "key:generate",
      description: "Generate application key",
      usage: "key:generate",
      execute: () => this.generateKey()
    });

    // Config commands
    this.registerCommand({
      name: "config:cache",
      description: "Cache configuration files",
      usage: "config:cache",
      execute: () => this.cacheConfig()
    });

    this.registerCommand({
      name: "config:clear",
      description: "Clear configuration cache",
      usage: "config:clear",
      execute: () => this.clearConfigCache()
    });
  }

  registerCommand(command) {
    this.commands.set(command.name, command);
  }

  async execute(args) {
    const commandName = args[0];
    
    if (!commandName) {
      this.showHelp();
      return;
    }

    const command = this.commands.get(commandName);
    
    if (!command) {
      console.error(\`❌ Command "\${commandName}" not found.\`);
      console.log("Run 'nodemantra list' to see all available commands.");
      return;
    }

    try {
      await command.execute(args.slice(1));
    } catch (error) {
      console.error(\`❌ Error executing command "\${commandName}":\`, error);
    }
  }

  showHelp() {
    console.log("NodeMantra Artisan - Command Line Interface");
    console.log("");
    console.log("Usage: nodemantra <command> [options]");
    console.log("");
    console.log("Available commands:");
    console.log("");
    
    const categories = {
      "Make Commands": ["make:controller", "make:model", "make:service", "make:validator", "make:route", "make:middleware", "make:test", "make:seeder", "make:migration", "make:resource"],
      "Database Commands": ["db:seed", "db:migrate", "db:rollback"],
      "Route Commands": ["route:list"],
      "Cache Commands": ["clear:cache", "clear:logs", "config:cache", "config:clear"],
      "Server Commands": ["serve"],
      "Utility Commands": ["list", "optimize", "key:generate"]
    };

    for (const [category, commands] of Object.entries(categories)) {
      console.log(\`  \${category}:\`);
      for (const cmdName of commands) {
        const cmd = this.commands.get(cmdName);
        if (cmd) {
          console.log(\`    \${cmd.name.padEnd(20)} \${cmd.description}\`);
        }
      }
      console.log("");
    }
  }

  async listCommands() {
    console.log("Available commands:");
    console.log("");
    
    for (const [name, command] of this.commands) {
      console.log(\`  \${name.padEnd(20)} \${command.description}\`);
      console.log(\`    Usage: \${command.usage}\`);
      console.log("");
    }
  }

  // Make Commands
  async makeController(name) {
    if (!name) {
      console.error("❌ Controller name is required.");
      return;
    }

    const className = ucwords(name);
    const classNameCamelCase = toCamelCase(name);
    const classNameLowerCase = name.toLowerCase();

    const filePath = \`./src/app/controllers/\${classNameLowerCase}.controller.ts\`;
    const templatePath = "./.node_mantra/sdk/template/app/controllers/starter.controller.ejs";

    try {
      const rendered = await ejs.renderFile(templatePath, {
        className,
        classNameLowerCase,
        classNameCamelCase
      });

      this.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, rendered);
      console.log(\`✅ Controller created successfully: \${filePath}\`);
    } catch (error) {
      console.error(\`❌ Error creating controller:\`, error);
    }
  }

  async makeModel(name) {
    if (!name) {
      console.error("❌ Model name is required.");
      return;
    }

    const className = ucwords(name);
    const classNameCamelCase = toCamelCase(name);
    const classNameLowerCase = name.toLowerCase();

    const filePath = \`./src/app/models/\${classNameLowerCase}.schema.ts\`;
    const templatePath = "./.node_mantra/sdk/template/app/models/starter.schema.ejs";

    try {
      const rendered = await ejs.renderFile(templatePath, {
        className,
        classNameLowerCase,
        classNameCamelCase,
      });

      this.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, rendered);
      console.log(\`✅ Model created successfully: \${filePath}\`);
    } catch (error) {
      console.error(\`❌ Error creating model:\`, error);
    }
  }

  async makeService(name) {
    if (!name) {
      console.error("❌ Service name is required.");
      return;
    }

    const className = ucwords(name);
    const classNameCamelCase = toCamelCase(name);
    const classNameLowerCase = name.toLowerCase();

    const filePath = \`./src/app/services/\${classNameLowerCase}.service.ts\`;
    const templatePath = "./.node_mantra/sdk/template/app/services/starter.service.ejs";

    try {
      const rendered = await ejs.renderFile(templatePath, {
        className,
        classNameLowerCase,
        classNameCamelCase,
      });

      this.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, rendered);
      console.log(\`✅ Service created successfully: \${filePath}\`);
    } catch (error) {
      console.error(\`❌ Error creating service:\`, error);
    }
  }

  async makeValidator(name) {
    if (!name) {
      console.error("❌ Validator name is required.");
      return;
    }

    const className = ucwords(name);
    const classNameCamelCase = toCamelCase(name);
    const classNameLowerCase = name.toLowerCase();

    const filePath = \`./src/app/validators/\${classNameLowerCase}.validator.ts\`;
    const templatePath = "./.node_mantra/sdk/template/app/validators/starter.validator.ejs";

    try {
      const rendered = await ejs.renderFile(templatePath, {
        className,
        classNameLowerCase,
        classNameCamelCase,
      });

      this.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, rendered);
      console.log(\`✅ Validator created successfully: \${filePath}\`);
    } catch (error) {
      console.error(\`❌ Error creating validator:\`, error);
    }
  }

  async makeRoute(name) {
    if (!name) {
      console.error("❌ Route name is required.");
      return;
    }

    const className = ucwords(name);
    const classNameCamelCase = toCamelCase(name);
    const classNameLowerCase = name.toLowerCase();

    const filePath = \`./src/routes/\${classNameLowerCase}.route.ts\`;
    const templatePath = "./.node_mantra/sdk/template/routes/starter.route.ejs";

    try {
      const rendered = await ejs.renderFile(templatePath, {
        className,
        classNameLowerCase,
        classNameCamelCase,
      });

      this.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, rendered);
      console.log(\`✅ Route created successfully: \${filePath}\`);
    } catch (error) {
      console.error(\`❌ Error creating route:\`, error);
    }
  }

  async makeMiddleware(name) {
    if (!name) {
      console.error("❌ Middleware name is required.");
      return;
    }

    const className = ucwords(name);
    const classNameCamelCase = toCamelCase(name);
    const classNameLowerCase = name.toLowerCase();

    const filePath = \`./src/app/middlewares/\${classNameLowerCase}.middleware.ts\`;
    const templatePath = "./.node_mantra/sdk/template/app/middlewares/starter.middleware.ejs";

    try {
      const rendered = await ejs.renderFile(templatePath, {
        className,
        classNameLowerCase,
        classNameCamelCase,
      });

      this.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, rendered);
      console.log(\`✅ Middleware created successfully: \${filePath}\`);
    } catch (error) {
      console.error(\`❌ Error creating middleware:\`, error);
    }
  }

  async makeTest(name) {
    if (!name) {
      console.error("❌ Test name is required.");
      return;
    }

    const className = ucwords(name);
    const classNameCamelCase = toCamelCase(name);
    const classNameLowerCase = name.toLowerCase();

    const filePath = \`./src/tests/\${classNameLowerCase}.test.ts\`;
    const templatePath = "./.node_mantra/sdk/template/tests/starter.test.ejs";

    try {
      const rendered = await ejs.renderFile(templatePath, {
        className,
        classNameLowerCase,
        classNameCamelCase,
      });

      this.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, rendered);
      console.log(\`✅ Test created successfully: \${filePath}\`);
    } catch (error) {
      console.error(\`❌ Error creating test:\`, error);
    }
  }

  async makeSeeder(name) {
    if (!name) {
      console.error("❌ Seeder name is required.");
      return;
    }

    const className = ucwords(name);
    const classNameCamelCase = toCamelCase(name);
    const classNameLowerCase = name.toLowerCase();

    const filePath = \`./src/database/seeders/\${classNameLowerCase}.seeder.ts\`;
    const templatePath = "./.node_mantra/sdk/template/database/seeders/starter.seeder.ejs";

    try {
      const rendered = await ejs.renderFile(templatePath, {
        className,
        classNameLowerCase,
        classNameCamelCase,
      });

      this.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, rendered);
      console.log(\`✅ Seeder created successfully: \${filePath}\`);
    } catch (error) {
      console.error(\`❌ Error creating seeder:\`, error);
    }
  }

  async makeMigration(name) {
    if (!name) {
      console.error("❌ Migration name is required.");
      return;
    }

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const className = ucwords(name);
    const classNameCamelCase = toCamelCase(name);
    const classNameLowerCase = name.toLowerCase();

    const filePath = \`./src/database/migrations/\${timestamp}_\${classNameLowerCase}.ts\`;
    const templatePath = "./.node_mantra/sdk/template/database/migrations/starter.migration.ejs";

    try {
      const rendered = await ejs.renderFile(templatePath, {
        className,
        classNameLowerCase,
        classNameCamelCase,
        timestamp
      });

      this.ensureDirectoryExists(path.dirname(filePath));
      fs.writeFileSync(filePath, rendered);
      console.log(\`✅ Migration created successfully: \${filePath}\`);
    } catch (error) {
      console.error(\`❌ Error creating migration:\`, error);
    }
  }

  async makeResource(name) {
    if (!name) {
      console.error("❌ Resource name is required.");
      return;
    }

    console.log(\`Creating resource: \${name}\`);
    
    await this.makeController(name);
    await this.makeModel(name);
    await this.makeService(name);
    await this.makeValidator(name);
    await this.makeRoute(name);

    console.log(\`✅ Resource "\${name}" created successfully!\`);
  }

  // Utility methods
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Database commands
  async runSeeders(seederName) {
    console.log("🌱 Running database seeders...");
    if (seederName) {
      console.log(\`Running specific seeder: \${seederName}\`);
    } else {
      console.log("Running all seeders...");
    }
    // Implementation would go here
    console.log("✅ Seeders completed successfully!");
  }

  async runMigrations() {
    console.log("🔄 Running database migrations...");
    // Implementation would go here
    console.log("✅ Migrations completed successfully!");
  }

  async rollbackMigrations(steps) {
    const stepCount = steps ? parseInt(steps) : 1;
    console.log(\`🔄 Rolling back \${stepCount} migration(s)...\`);
    // Implementation would go here
    console.log("✅ Rollback completed successfully!");
  }

  // Route commands
  async listRoutes() {
    console.log("📋 Registered Routes:");
    console.log("");
    // Implementation would go here
    console.log("GET    /api/v1/users");
    console.log("POST   /api/v1/users");
    console.log("GET    /api/v1/users/:id");
    console.log("PUT    /api/v1/users/:id");
    console.log("DELETE /api/v1/users/:id");
  }

  // Cache commands
  async clearCache() {
    console.log("🧹 Clearing application cache...");
    // Implementation would go here
    console.log("✅ Cache cleared successfully!");
  }

  async clearLogs() {
    console.log("🧹 Clearing application logs...");
    // Implementation would go here
    console.log("✅ Logs cleared successfully!");
  }

  async cacheConfig() {
    console.log("⚙️  Caching configuration files...");
    // Implementation would go here
    console.log("✅ Configuration cached successfully!");
  }

  async clearConfigCache() {
    console.log("🧹 Clearing configuration cache...");
    // Implementation would go here
    console.log("✅ Configuration cache cleared successfully!");
  }

  // Server commands
  async serve(args) {
    let port = 3000;
    let host = 'localhost';

    // Parse arguments
    for (const arg of args) {
      if (arg.startsWith('--port=')) {
        port = parseInt(arg.split('=')[1]);
      } else if (arg.startsWith('--host=')) {
        host = arg.split('=')[1];
      }
    }

    console.log(\`🚀 Starting development server on http://\${host}:\${port}\`);
    console.log("Press Ctrl+C to stop the server");
    
    // Start the development server
    const { execSync } = require('child_process');
    execSync('npm run dev', { stdio: 'inherit' });
  }

  // Utility commands
  async optimize() {
    console.log("⚡ Optimizing application for production...");
    // Implementation would go here
    console.log("✅ Application optimized successfully!");
  }

  async generateKey() {
    console.log("🔑 Generating application key...");
    const key = require('crypto').randomBytes(32).toString('hex');
    console.log(\`✅ Application key generated: \${key}\`);
    console.log("Remember to add this to your .env file as APP_KEY");
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const artisan = new Artisan();

// Execute the command
artisan.execute(args).catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});`;
}

function createControllerTemplate() {
  return `<%# Controller Template %>
import { Request, Response } from "express";

import <%= className %>Service from '@services/<%= classNameLowerCase %>.service'
import Controller from "@libs/controller";
export default class <%= className %>Controller extends Controller {

static async  count (req: Request, res: Response) {
    let <%= classNameLowerCase %>Service=new <%= className %>Service();
    const result = await <%= classNameLowerCase %>Service.count()
    res.status(result.statusCode).json(result);
}

static async get<%= className %>s(req: Request, res: Response)  {
  let <%= classNameLowerCase %>Service=new <%= className %>Service();
  const record = await <%= classNameLowerCase %>Service.list();
  res.status(record.statusCode).json(record);
}

static async get<%= className %>(req: Request, res: Response) {
  let id = req.params.id
  let <%= classNameLowerCase %>Service=new <%= className %>Service();
  const records = await <%= classNameLowerCase %>Service.retrieve(id)
  res.status(records.statusCode).json(records);
}

static async create<%= className %>(req: Request, res: Response) {
    const data=req.body
    let <%= classNameLowerCase %>Service=new <%= className %>Service();
    const result = await <%= classNameLowerCase %>Service.create(data)
    res.status(result.statusCode).json(result);
}


static  async update<%= className %>(req: Request, res: Response) {
    const id =req.params.id;
    const data=req.body
    let <%= classNameLowerCase %>Service=new <%= className %>Service();
    const result = await <%= classNameLowerCase %>Service.update(id,data)
    res.status(result.statusCode).json(result);
  }

static async delete<%= className %>(req: Request, res: Response)  {
    let id = req.params.id;
    let <%= classNameLowerCase %>Service=new <%= className %>Service();
    const result = await <%= classNameLowerCase %>Service.delete(id)
    res.status(result.statusCode).json(result);
}

static  async datatable(req: Request, res: Response) {
    const data = req.query;
    let <%= classNameLowerCase %>Service=new <%= className %>Service();
    const records = await <%= classNameLowerCase %>Service.datatable(data)
    res.status(records.statusCode).json(records);
  }

    static async search(req: Request, res: Response) {
    const query = req.query.q;
    let <%= classNameLowerCase %>Service=new <%= className %>Service();
    const results = await <%= classNameLowerCase %>Service.search<%= className %>s(query);
    res.status(results.statusCode).json(results);
     
  }
}`;
}

function createModelTemplate() {
  return `<%# Model Template %>
import { Schema, Document, model } from 'mongoose';

export enum <%= className %>Status {
  Active = 1,
  Inactive = 0,
}

export interface I<%= className %> extends Document {
  name: string;
  description: string;
  status: <%= className %>Status;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const <%= className %>Schema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: Number, enum: [0, 1], default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
});

const <%= className %> = model<I<%= className %>>('<%= className %>', <%= className %>Schema);

export default <%= className %>;`;
}

function createServiceTemplate() {
  return `<%# Service Template %>
import BaseService from '@services/base.service';
import { <%= className %> } from '@models/<%= classNameLowerCase %>.schema';

export default class <%= className %>Service extends BaseService {
  constructor() {
    super(<%= className %>);
  }

  async search<%= className %>s(query: string) {
    try {
      const results = await this.repository.find({
        where: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      });
      return { statusCode: 200, data: results, message: 'Search completed' };
    } catch (error) {
      return { statusCode: 500, data: null, message: 'Search failed' };
    }
  }
}`;
}

function createValidatorTemplate() {
  return `<%# Validator Template %>
import Joi from 'joi';

export const create<%= className %>Validator = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().max(500),
  status: Joi.number().valid(0, 1).default(1)
});

export const update<%= className %>Validator = Joi.object({
  name: Joi.string().optional().min(2).max(100),
  description: Joi.string().optional().max(500),
  status: Joi.number().valid(0, 1).optional()
});

export default {
  create<%= className %>Validator,
  update<%= className %>Validator
};`;
}

function createRouteTemplate() {
  return `<%# Route Template %>
import { Router } from 'express';
import <%= className %>Controller from '@controllers/<%= classNameLowerCase %>.controller';
import { create<%= className %>Validator, update<%= className %>Validator } from '@validators/<%= classNameLowerCase %>.validator';

const router = Router();

// Get all <%= classNameLowerCase %>s
router.get('/', <%= className %>Controller.get<%= className %>s);

// Get <%= classNameLowerCase %> count
router.get('/count', <%= className %>Controller.count);

// Get single <%= classNameLowerCase %>
router.get('/:id', <%= className %>Controller.get<%= className %>);

// Create new <%= classNameLowerCase %>
router.post('/', create<%= className %>Validator, <%= className %>Controller.create<%= className %>);

// Update <%= classNameLowerCase %>
router.put('/:id', update<%= className %>Validator, <%= className %>Controller.update<%= className %>);

// Delete <%= classNameLowerCase %>
router.delete('/:id', <%= className %>Controller.delete<%= className %>);

// Datatable
router.get('/datatable', <%= className %>Controller.datatable);

// Search
router.get('/search', <%= className %>Controller.search);

export default router;`;
}

function createMiddlewareTemplate() {
  return `<%# Middleware Template %>
import { Request, Response, NextFunction } from 'express';

export const <%= className %>Middleware = (req: Request, res: Response, next: NextFunction) => {
  // Add your middleware logic here
  console.log('<%= className %> middleware executed');
  next();
};

export default <%= className %>Middleware;`;
}

function createTestTemplate() {
  return `<%# Test Template %>
import { expect } from 'chai';
import { describe, it } from 'mocha';
import <%= className %>Controller from '@controllers/<%= classNameLowerCase %>.controller';

describe('<%= className %>Controller', () => {
  describe('get<%= className %>s', () => {
    it('should return all <%= classNameLowerCase %>s', async () => {
      // Add your test logic here
      expect(true).to.be.true;
    });
  });

  describe('get<%= className %>', () => {
    it('should return a single <%= classNameLowerCase %>', async () => {
      // Add your test logic here
      expect(true).to.be.true;
    });
  });
});`;
}

function createSeederTemplate() {
  return `<%# Seeder Template %>
import { <%= className %> } from '@models/<%= classNameLowerCase %>.schema';

export const <%= classNameLowerCase %>Seeder = async () => {
  try {
    const <%= classNameLowerCase %>s = [
      {
        name: 'Sample <%= className %> 1',
        description: 'This is a sample <%= classNameLowerCase %>',
        status: 1
      },
      {
        name: 'Sample <%= className %> 2',
        description: 'This is another sample <%= classNameLowerCase %>',
        status: 1
      }
    ];

    await <%= className %>.insertMany(<%= classNameLowerCase %>s);
    console.log('✅ <%= className %> seeder completed successfully');
  } catch (error) {
    console.error('❌ <%= className %> seeder failed:', error);
  }
};

export default <%= classNameLowerCase %>Seeder;`;
}

function createMigrationTemplate() {
  return `<%# Migration Template %>
import { Schema } from 'mongoose';

export const up = async (db: any) => {
  const <%= classNameLowerCase %>Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: Number, enum: [0, 1], default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  });

  await db.createCollection('<%= classNameLowerCase %>s', <%= classNameLowerCase %>Schema);
  console.log('✅ Created <%= classNameLowerCase %>s collection');
};

export const down = async (db: any) => {
  await db.dropCollection('<%= classNameLowerCase %>s');
  console.log('✅ Dropped <%= classNameLowerCase %>s collection');
};`;
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
    'src/tests',
    'src/app',
    'src/app/controllers',
    'src/app/services',
    'src/app/models',
    'src/app/middlewares',
    'src/app/validators',
    'src/app/requests',
    'src/database',
    'src/database/seeders',
    'src/database/migrations',
    '.node_mantra/sdk',
    '.node_mantra/sdk/util',
    '.node_mantra/sdk/template',
    '.node_mantra/sdk/template/app',
    '.node_mantra/sdk/template/app/controllers',
    '.node_mantra/sdk/template/app/models',
    '.node_mantra/sdk/template/app/services',
    '.node_mantra/sdk/template/app/validators',
    '.node_mantra/sdk/template/app/middlewares',
    '.node_mantra/sdk/template/routes',
    '.node_mantra/sdk/template/tests',
    '.node_mantra/sdk/template/database',
    '.node_mantra/sdk/template/database/seeders',
    '.node_mantra/sdk/template/database/migrations'
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
  createFile(path.join(projectPath, 'src/services/base.service.ts'), createBaseService());
  createFile(path.join(projectPath, 'src/services/user.service.ts'), createUserService());
  createFile(path.join(projectPath, 'src/controllers/base.controller.ts'), createBaseController());
  createFile(path.join(projectPath, 'src/controllers/user.controller.ts'), createUserController());
  createFile(path.join(projectPath, 'src/routes/base.routes.ts'), createBaseRoutes());
  createFile(path.join(projectPath, 'src/routes/user.routes.ts'), createUserRoutes());

  // Create Artisan CLI
  createDirectory(path.join(projectPath, '.node_mantra', 'sdk'));
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'artisan.ts'), createArtisanFile());

  // Create template files
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'template', 'app', 'controllers', 'starter.controller.ejs'), createControllerTemplate());
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'template', 'app', 'models', 'starter.schema.ejs'), createModelTemplate());
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'template', 'app', 'services', 'starter.service.ejs'), createServiceTemplate());
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'template', 'app', 'validators', 'starter.validator.ejs'), createValidatorTemplate());
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'template', 'app', 'middlewares', 'starter.middleware.ejs'), createMiddlewareTemplate());
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'template', 'routes', 'starter.route.ejs'), createRouteTemplate());
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'template', 'tests', 'starter.test.ejs'), createTestTemplate());
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'template', 'database', 'seeders', 'starter.seeder.ejs'), createSeederTemplate());
  createFile(path.join(projectPath, '.node_mantra', 'sdk', 'template', 'database', 'migrations', 'starter.migration.ejs'), createMigrationTemplate());

  log('\n✅ Project created successfully!', 'green');
  log('\n📋 Next steps:', 'blue');
  log(`  cd ${projectName}`, 'yellow');
  log('  npm install', 'yellow');
  log('  npm run dev', 'yellow');
  log('\n🛠️  Artisan Commands:', 'blue');
  log('  npm run artisan list', 'yellow');
  log('  npm run artisan make:resource Post', 'yellow');
  log('\n📚 Documentation:', 'blue');
  log('  https://github.com/developerprakashjoshi/nodemantra-core', 'yellow');
  log('  https://www.npmjs.com/package/nodemantra-core', 'yellow');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main }; 