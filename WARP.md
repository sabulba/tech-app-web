# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development
```bash
npm start
# or
ng serve
```
Starts the dev server at `http://localhost:4200/` with auto-reload on file changes.

### Build
```bash
npm run build
# or
ng build
```
Builds for production with optimization and output hashing. Build artifacts are stored in `dist/`.

Build budgets (configured in `angular.json`):
- Initial bundle: 500kB warning, 1MB error
- Component styles: 4kB warning, 8kB error

For development build with watch mode:
```bash
npm run watch
```

### Testing
```bash
npm test
# or
ng test
```
Runs unit tests using **Vitest** (not Karma/Jasmine). Test files follow the `*.spec.ts` pattern.

### Code Generation
```bash
ng generate component component-name
```
Generates new components with SCSS styling (configured default). For other schematics:
```bash
ng generate --help
```

## Architecture

### Angular 21 Patterns
This project uses **Angular 21** with the following modern patterns:

- **Standalone components**: No NgModules. All components are standalone and declare their imports directly.
- **Signal-based reactivity**: Use `signal()`, `computed()`, and effects instead of traditional observables where appropriate.
- **Application bootstrap**: Uses `bootstrapApplication()` in `src/main.ts` instead of NgModule bootstrapping.

### Project Structure
```
src/
├── main.ts              # Application entry point, bootstraps the app
├── app/
│   ├── app.ts           # Root component (standalone)
│   ├── app.config.ts    # Application configuration (providers, router)
│   └── app.routes.ts    # Route definitions
```

### Component Configuration
- **Selector prefix**: `app` (configured in `angular.json`)
- **Default styling**: SCSS
- **Template**: Separate HTML files (e.g., `component.html`)

### TypeScript Configuration
Strict mode is enabled with the following compiler options:
- `strict: true`
- `noImplicitOverride: true`
- `noPropertyAccessFromIndexSignature: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

Angular compiler options also enforce:
- `strictInjectionParameters`
- `strictInputAccessModifiers`
- `strictTemplates`

### Code Style
Prettier is configured with:
- Print width: 100 characters
- Single quotes: enabled
- Angular HTML parser for `.html` files

### Package Management
- Package manager: **npm 11.6.2** (specified in `package.json`)
- Use `npm` for all package operations (not yarn or pnpm)
