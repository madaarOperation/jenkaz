# Jenkaz

Jenkaz is a custom GitHub Action that triggers Jenkins CD jobs from GitHub CI workflows.

## Project Objective

- Build a GitHub custom action to trigger Jenkins deployment jobs from GitHub Actions workflows.

## Project Structure

```text
.
├── action.yml
├── dist
│   ├── index.d.ts
│   ├── index.d.ts.map
│   ├── index.js
│   └── package.json
├── package.json
├── package-lock.json
├── Readme.md
├── src
│   └── index.ts
└── tsconfig.json
```

## Requirements

- Node.js
- GitHub Actions
- Jenkins server with accessible job endpoints

## Installation

Clone the repository:

```bash
git clone git@github.com:madaarOperation/jenkaz.git
cd jenkaz
```

Install dependencies:

```bash
npm install
```

## Build

Compile the project:

```bash
npm run build
```

## Usage

Example GitHub Actions workflow:

```yaml
name: Trigger Jenkins Job

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Jenkins
        uses: madaarOperation/jenkaz@main
        with:
          jenkins_url: ${{ secrets.JENKINS_URL }}
          jenkins-job: my-job
          jenkins-user: ${{ secrets.JENKINS_USER }}
          jenkins-token: ${{ secrets.JENKINS_TOKEN }}
```

## Development

Source files are located in:

```text
src/
```

Compiled output is generated in:

```text
dist/
```

## Future Feature :

- [ ] Support VPN Configuration

## License

MIT

---
