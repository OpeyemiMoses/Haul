# Contributing to Haul

Thank you for your interest in contributing to Haul! We welcome contributions from developers, designers, and web3 enthusiasts of all backgrounds.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. **Fork the Repository:** Create your own fork of [OpeyemiMoses/Haul](https://github.com/OpeyemiMoses/Haul).
2. **Clone your fork locally:**
   ```bash
   git clone https://github.com/<your-username>/Haul.git
   cd Haul
   ```
3. **Install Dependencies:**
   ```bash
   # In frontend/
   cd frontend && npm install

   # In contracts/
   cd ../contracts && npm install
   ```

## Development Workflow

1. Create a feature branch with a descriptive name:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. Make your modifications following our code style and architecture patterns.
3. Test thoroughly:
   - For contracts: `cd contracts && npx hardhat test`
   - For frontend: `cd frontend && npm run build` to verify clean bundle compilation.
4. Commit your changes using conventional commit messages:
   - `feat: add merchant invoice export`
   - `fix: resolve escrow PIN timing check`
   - `docs: update deployment instructions`
5. Push your branch to GitHub and submit a Pull Request.

## Pull Request Guidelines

- Provide a clear title and description of your changes.
- Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md).
- Link any related issues (e.g., `Closes #12`).
- Ensure no sensitive environment secrets or private keys are committed.
- Keep PRs focused on a single feature or bug fix to expedite review.

## Reporting Issues

- Search existing issues before creating a new one to avoid duplicates.
- Use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) or [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md).
- Provide reproducible steps, environment details, and screenshots if applicable.

Thank you for helping build the future of onchain consumer commerce!
