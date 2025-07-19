# **App Name**: KeuanganKu

## Core Features:

- Add Transactions: Allow users to input their income and expenses, including amount, date, category, and description.
- View Transactions: Display transactions in reverse chronological order.
- Categorical Summary: Provide a summary of total spending by category (e.g., Food, Transport, Bills).
- Filter Transactions: Filter transactions by date range and transaction type (income or expense).
- Image-Based Transaction Input: Allow users to add a transaction by uploading an image of a receipt or salary slip. An AI tool detects the transaction type (income or expense), amount, date, and category from the image, and populates the transaction details automatically, using the generative language API https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent with token : AIzaSyB2tXtabnoHjK0VHT4GG3gwydAUy2VaXa8

## Style Guidelines:

- Primary color: Soft, muted green (#A7D1AB) to evoke a sense of calm and financial well-being.
- Background color: Light, desaturated green (#E8F5E9) for a clean and airy feel.
- Accent color: Slightly darker, analogous green (#80BCA3) for interactive elements and highlights.
- Font: 'Inter', a sans-serif typeface, will be used throughout the application for both headers and body text.
- Use minimalist, line-based icons in a style that complements the typography, in muted green tones.
- Use a clean and well-spaced layout with Tailwind CSS, prioritizing ease of navigation.
- Subtle animations and transitions to enhance user experience, for instance, when adding or filtering transactions.