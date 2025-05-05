# TypeScript Configuration

This document explains our project's TypeScript configuration structure, which uses multiple configuration files for different parts of the codebase.

## Configuration Files Overview

Our project contains four TypeScript configuration files, each serving a specific purpose:

1. **`tsconfig.json`** (Root)
   - Main entry point for TypeScript configuration
   - References other configuration files using TypeScript project references
   - Contains shared settings like path aliases

2. **`tsconfig.app.json`**
   - Configures TypeScript for the React application code
   - Targets browser environment
   - Includes just the `src` directory 

3. **`tsconfig.node.json`**
   - Configures TypeScript for build configuration files
   - Targets Node.js environment
   - Includes only specific build files like `vite.config.ts`

4. **`supabase/functions/tsconfig.json`**
   - Configures TypeScript for Supabase Edge Functions
   - Specifically tailored for the Deno runtime environment
   - Includes types for Supabase JS client

## Configuration Details

### Root Configuration (`tsconfig.json`)

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noImplicitAny": false,
    "noUnusedParameters": false,
    "skipLibCheck": true,
    "allowJs": true,
    "noUnusedLocals": false,
    "strictNullChecks": false
  }
}
```

This configuration acts as the main entry point and uses TypeScript project references to organize multiple configurations. It also defines shared settings like path aliases.

### App Configuration (`tsconfig.app.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitAny": false,
    "noFallthroughCasesInSwitch": false,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

This file configures TypeScript for our React application code, targeting ES2020 and including DOM libraries. It uses "bundler" module resolution for Vite compatibility and includes only files in the `src` directory.

### Node Configuration (`tsconfig.node.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}
```

This file is specifically for build scripts and configuration files that run in Node.js. It targets newer ECMAScript features and has stricter type checking.

### Edge Functions Configuration (`supabase/functions/tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["esnext", "dom", "dom.iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "types": ["@supabase/supabase-js"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

This configuration is specifically for Supabase Edge Functions, which run in a Deno environment rather than Node.js. It uses Node.js module resolution and includes types for Supabase JS client.

## When Each File Is Used

- **Editor Integration**: Your IDE primarily uses the root `tsconfig.json` for features like IntelliSense and error highlighting
- **React Application**: When building the React application, Vite uses `tsconfig.app.json`
- **Build Configuration**: When the TypeScript compiler processes `vite.config.ts`, it uses `tsconfig.node.json`
- **Edge Functions**: When working with Supabase Edge Functions, the separate `supabase/functions/tsconfig.json` is used

## Benefits of This Approach

1. **Separation of Concerns**: Different parts of the application have different requirements and run in different environments
2. **Build Optimization**: TypeScript project references allow for incremental compilation, which can improve build times
3. **Environment-Specific Settings**: We can optimize compiler options for each target environment (browser, Node.js, Deno)
4. **Cleaner Configuration**: Breaking up the configuration makes each file simpler and easier to understand

## Current Type Checking Status

Currently, the project uses relatively loose type checking with `strict: false` in most configurations. This might be a transitional approach to allow for easier development during the initial phase. We may want to consider enabling stricter type checking in the future for better type safety.

## Maintaining These Files

When updating TypeScript or related dependencies:
1. Update all configuration files consistently
2. Ensure path aliases remain synchronized between all files
3. Test the build process to verify changes don't break compilation
4. Consider gradually increasing type strictness as the codebase matures

## Future Considerations

As the project evolves, we might want to consider:
1. Enabling stricter type checking (setting `strict: true`)
2. Adding more specific compiler options for better error catching
3. Adding ESLint TypeScript integration for enhanced linting
4. Adding automated type checking to the CI/CD pipeline 