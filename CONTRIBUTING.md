# Contributing to Manga Scraper API

Thank you for your interest in contributing to the Manga Scraper API! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Screenshots if applicable

### Suggesting Features

Feature suggestions are welcome! Please:

- Check if the feature has already been requested
- Provide clear use cases
- Explain why it would be valuable
- Consider implementation complexity

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/manga-scraper-api.git
   cd manga-scraper-api
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the code style (see below)
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   npm run lint
   npm run format
   npm run build
   npm run dev
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commit messages:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes
   - `refactor:` - Code refactoring
   - `test:` - Test changes
   - `chore:` - Build/tooling changes

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description
   - Link related issues
   - Include screenshots if relevant

## Code Style

### TypeScript

- Use TypeScript strict mode
- Define proper interfaces and types
- Avoid `any` type when possible
- Use meaningful variable and function names

### Formatting

- Run `npm run format` before committing
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons

### Comments

- Write clear, concise comments
- Document complex logic
- Use JSDoc for public APIs

### File Organization

```
src/
├── scrapers/      # Scraper implementations
├── routes/        # API route handlers
├── utils/         # Utility functions
├── types/         # TypeScript types
└── config/        # Configuration
```

## Adding a New Source

To add support for a new manga source:

1. **Create scraper class**
   ```typescript
   // src/scrapers/newsource.ts
   import { BaseScraper } from './base.js';
   
   export class NewSourceScraper extends BaseScraper {
     constructor(baseUrl: string) {
       super(baseUrl, 'newsource');
     }
     
     // Implement required methods
     async search(query: string, page?: number) { }
     async getInfo(id: string) { }
     async getChapter(id: string) { }
     // ... etc
   }
   ```

2. **Create routes**
   ```typescript
   // src/routes/newsource.ts
   import { Hono } from 'hono';
   import { NewSourceScraper } from '../scrapers/newsource.js';
   
   const app = new Hono();
   const scraper = new NewSourceScraper(SOURCES.newsource);
   
   // Define routes
   app.get('/search', asyncHandler(async (c) => { }));
   
   export default app;
   ```

3. **Update constants**
   ```typescript
   // src/config/constants.ts
   export const SOURCES = {
     // ... existing sources
     newsource: 'https://newsource.com',
   };
   
   export const SOURCE_INFO = {
     // ... existing sources
     newsource: {
       name: 'New Source',
       baseUrl: SOURCES.newsource,
       isActive: true,
       features: ['search', 'info', 'chapter'],
     },
   };
   ```

4. **Mount routes**
   ```typescript
   // src/index.ts
   import newsourceRoutes from './routes/newsource.js';
   
   app.route('/api/v1/newsource', newsourceRoutes);
   ```

5. **Update documentation**
   - Add source to README.md
   - Update API documentation

## Testing

### Manual Testing

```bash
npm run dev
```

Test endpoints with curl or Postman:
```bash
curl "http://localhost:3000/api/v1/mangareader/search?q=naruto"
```

### Automated Testing (Future)

```bash
npm test
```

## Documentation

- Update README.md for major changes
- Add JSDoc comments for public APIs
- Update OpenAPI specification if adding endpoints

## Review Process

1. Maintainers review all pull requests
2. At least one approval required
3. All checks must pass
4. Code must follow style guidelines
5. Documentation must be updated

## Questions?

- Open an issue for questions
- Join discussions in issues/PRs
- Check existing documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
