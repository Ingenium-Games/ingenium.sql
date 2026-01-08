# Contributing to ingenium.sql

Thank you for your interest in contributing to ingenium.sql! We welcome contributions from the community and appreciate your help in making this resource better.

## 📋 Table of Contents

- [How to Report Bugs](#how-to-report-bugs)
- [How to Suggest Features](#how-to-suggest-features)
- [How to Contribute Code](#how-to-contribute-code)
- [Pull Request Process](#pull-request-process)
- [Code Standards](#code-standards)
- [Community Guidelines](#community-guidelines)

## 🐛 How to Report Bugs

**Before reporting a bug:**
1. Check the [Installation Guide](INSTALLATION.md) and troubleshooting section
2. Search [existing issues](https://github.com/Ingenium-Games/ingenium.sql/issues) to avoid duplicates
3. Try to reproduce the issue with a fresh installation

**When reporting a bug:**
- **ALWAYS use the [Bug Report template](https://github.com/Ingenium-Games/ingenium.sql/issues/new/choose)**
- Provide complete information (version numbers, error logs, configuration)
- Include steps to reproduce the issue
- Be as specific as possible
- Remove sensitive information (passwords, IPs) from your report

**Issues that don't follow the template will be closed without review.**

## 💡 How to Suggest Features

We welcome feature suggestions! Here's how to propose a new feature:

1. **Check existing issues** to see if it's already been suggested
2. **Open a new issue** with the title: `[Feature Request]: Your idea`
3. **Describe the feature**:
   - What problem does it solve?
   - How would it work?
   - Are there any alternatives?
   - Would it break existing functionality?
4. **Be open to discussion** - we may suggest modifications or alternatives

Feature requests that align with the project goals and don't add excessive complexity are more likely to be implemented.

## 💻 How to Contribute Code

We appreciate code contributions! Here's the process:

### Getting Started

1. **Fork the repository**
   - Click the "Fork" button on GitHub
   - Clone your fork locally: `git clone https://github.com/YOUR-USERNAME/ingenium.sql.git`

2. **Create a branch**
   - Use a descriptive name: `git checkout -b feature/your-feature-name`
   - Or for bugs: `git checkout -b fix/bug-description`

3. **Set up your environment**
   - Run `npm install` to install dependencies
   - Make sure you have Node.js 16+ installed
   - Test the resource on a local FiveM server

### Making Changes

1. **Keep changes focused**
   - One feature or bug fix per pull request
   - Don't mix unrelated changes

2. **Write clean code**
   - Follow existing code style
   - Add comments for complex logic
   - Keep functions small and focused

3. **Test your changes**
   - Test on a local FiveM server
   - Verify existing functionality still works
   - Test edge cases and error conditions

4. **Update documentation**
   - Update README.md if you change the API
   - Update INSTALLATION.md if you change installation steps
   - Add code comments for complex features

## 🔄 Pull Request Process

1. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```
   - Use clear, descriptive commit messages
   - Reference issue numbers: "Fixes #123" or "Relates to #456"

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template completely

4. **PR Description should include:**
   - What changes were made and why
   - Issue number if fixing a bug
   - Testing steps you performed
   - Any breaking changes or migration notes
   - Screenshots if applicable (for UI changes)

5. **Wait for review**
   - Maintainers will review your PR
   - Be responsive to feedback and questions
   - Make requested changes in new commits
   - Don't force-push unless specifically asked

6. **After approval**
   - Your PR will be merged by a maintainer
   - You can delete your branch
   - Celebrate! 🎉

## 📝 Code Standards

### JavaScript/Node.js

- Use **ES6+ syntax** (const/let, arrow functions, async/await)
- **No unnecessary dependencies** - keep the package lean
- **Error handling** - all async operations should handle errors
- **Comments** - explain WHY, not just WHAT
- **Formatting** - consistent indentation (2 spaces)

### Lua

- Follow **FiveM Lua conventions**
- Use **PascalCase** for exported functions
- Use **camelCase** for local functions
- **Comments** for exported functions explaining parameters

### Documentation

- Use clear, beginner-friendly language
- Provide examples for new features
- Keep README.md up to date
- Include code comments for complex logic

## 🤝 Community Guidelines

- **Be respectful** - treat others with kindness and respect
- **Be patient** - maintainers are volunteers with limited time
- **Be constructive** - provide helpful feedback and suggestions
- **Be understanding** - not everyone has the same skill level
- **No harassment** - inappropriate behavior will not be tolerated

### What We Look For

**Good contributions:**
- ✅ Solve real problems users are experiencing
- ✅ Improve performance or reliability
- ✅ Make the resource easier to use
- ✅ Improve documentation
- ✅ Fix bugs with tests to prevent regression

**What we generally don't accept:**
- ❌ Breaking changes without strong justification
- ❌ Features that add excessive complexity
- ❌ Code that duplicates existing functionality
- ❌ Changes that break compatibility with FiveM
- ❌ Unrelated refactoring in feature PRs

## 🎯 Development Priorities

Current focus areas (as of latest release):
1. **Stability** - fixing bugs and improving reliability
2. **Performance** - optimizing query execution
3. **Documentation** - making it easier for beginners
4. **Compatibility** - ensuring it works across different setups

## 📞 Questions?

If you have questions about contributing:
- Check existing [Discussions](https://github.com/Ingenium-Games/ingenium.sql/discussions)
- Read the [README.md](README.md) and [INSTALLATION.md](INSTALLATION.md)
- Open a new Discussion (not an issue) for general questions

## 📜 License

By contributing to ingenium.sql, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to ingenium.sql! Your efforts help make this resource better for everyone. 🚀
