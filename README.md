# SalonBook - Smart Salon Management System

SalonBook is a modern, full-stack salon management application built with Next.js 15, TypeScript, and Firebase. It features a comprehensive admin dashboard and an intelligent AI chatbot to assist store owners with daily tasks.

## 🚀 Key Features

*   **Admin Dashboard**: Manage Bookings, Employees, Clients, and Salons (Multi-branch support).
*   **AI Admin Chatbot**:
    *   **Natural Language Actions**: Add employees, check revenue, reassign appointments, and cancel bookings using simple chat commands.
    *   **Multi-Model Support**: Powered by Cohere (primary), with fallbacks to Google Gemini and Groq (Llama 3).
    *   **Smart Context**: Handles multi-turn conversations (e.g., gathering missing employee details before saving).
*   **Real-time Data**: Powered by Firebase Firestore for instant updates across the UI.
*   **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile devices.
*   **Modern UI**: Clean, aesthetic interface with "Pink/Rose" branding.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage)
*   **AI Integration**:
    *   [Cohere API](https://cohere.com/) (Command R)
    *   [Google Gemini API](https://ai.google.dev/)
    *   [Groq API](https://groq.com/)
*   **Styling**: CSS Modules / Global CSS with responsive design.
*   **Charts**: Recharts

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/salon-booking.git
    cd salon-booking/frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the `frontend` directory and add your keys:

    ```env
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

    # AI API Keys (For Chatbot)
    COHERE_API_KEY=your_cohere_key
    GEMINI_API_KEY=your_gemini_key
    GROQ_API_KEY=your_groq_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 Chatbot Capabilities

The admin chatbot (bottom right corner) can help you with:

*   **"Add Sarah as a Senior Stylist"** -> *(Will ask for phone/email if missing)*
*   **"How much revenue regarding today?"**
*   **"Assign booking #12345 to Mike"**
*   **"Cancel booking #67890"**
*   **"Reassign appointments for John today"**
*   **General questions**: "How do I handle difficult clients?"

## 📂 Project Structure

*   `src/app/admin`: Admin dashboard pages (Bookings, Employees, etc.)
*   `src/components/admin`: Reusable admin components (DataTable, Chatbot, Modals).
*   `src/lib`: Services (Firebase, Firestore, AI Clients).
*   `src/app/api`: Backend API routes (Chatbot endpoints).

## 🚀 Deployment

The project is optimized for deployment on [Vercel](https://vercel.com).

```bash
npm run build
npx vercel
```
