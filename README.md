# Genetic Signal Generator

A React-based application for generating and optimizing trading signals using genetic algorithms.

## Prerequisites

- Node.js 18+ installed on your system
- Git (optional, for cloning)

## Setup Instructions

1. Clone or download this repository to your local machine:
```bash
git clone <repository-url>
# or download and extract the ZIP file
```

2. Navigate to the project directory:
```bash
cd genetic-signal-generator
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## CSV Data Format

The application expects CSV files with the following columns:
- DateTime (YYYY-MM-DD HH:mm:ss format)
- Open
- High
- Low
- Close
- Volume

Example:
```csv
DateTime,Open,High,Low,Close,Volume
2023-01-01 09:30:00,100.00,101.50,99.50,101.00,1000
2023-01-01 09:31:00,101.00,102.00,100.80,101.75,1200
```

## Features

- Upload and manage OHLCV data files
- Configure multiple signal groups with various technical indicators
- Optimize signal parameters using genetic algorithms
- Backtest strategies with detailed performance metrics
- Walk-forward analysis and Monte Carlo simulations
- Save and load configurations
- Export results to CSV

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.