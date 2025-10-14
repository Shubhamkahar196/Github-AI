# GitHub AI

An AI-powered GitHub repository enhancement platform that provides intelligent code analysis, meeting transcription, and Q&A capabilities for developers.

## 🚀 Features

- **AI-Powered Code Analysis**: Ask questions about your codebase and get intelligent answers with file references
- **Meeting Transcription**: Upload meeting recordings and get AI-generated summaries with chapters
- **GitHub Integration**: Seamlessly connect your GitHub repositories for enhanced analysis
- **Real-time Streaming**: Get responses streamed in real-time for better user experience
- **Credit System**: Pay-as-you-go model with Razorpay integration
- **Modern UI**: Built with Next.js, Tailwind CSS, and Radix UI components

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: tRPC, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Clerk
- **AI Services**:
  - Google Gemini for embeddings and chat
  - AssemblyAI for meeting transcription
- **Payment**: Razorpay
- **Styling**: Tailwind CSS, Radix UI
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- GitHub account (for repository integration)
- API keys for:
  - Google Gemini
  - AssemblyAI
  - Clerk
  - Razorpay

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shubhamkahar196/Github-AI
   cd github-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:
   ```env
   DATABASE_URL="postgresql://..."
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   GEMINI_API_KEY=...
   ASSEMBLYAI_API_KEY=...
   RAZORPAY_KEY_ID=...
   RAZORPAY_KEY_SECRET=...
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000] in your browser**

## 📖 Usage

### Linking a Repository
1. Navigate to the Create page
2. Enter your GitHub repository URL
3. Optionally provide a GitHub token for private repositories
4. The system will analyze your codebase and create embeddings

### Asking Questions
1. Go to your project dashboard
2. Use the "Ask GitHub AI" feature
3. Get AI-powered answers with file references

### Meeting Analysis
1. Upload your meeting recording
2. Get AI-generated transcription and summaries
3. View chapter-wise breakdown of the meeting

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbo
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format:check` - Check code formatting
- `npm run format:write` - Format code
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:studio` - Open Prisma Studio
- `npm run db:push` - Push schema changes to database

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── (protected)/        # Protected routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
├── lib/                   # Utility libraries
│   ├── assembly.ts        # AssemblyAI integration
│   ├── gemini.ts          # Google Gemini integration
│   ├── github.ts          # GitHub API integration
│   └── utils.ts           # General utilities
├── server/                # tRPC server setup
│   └── api/               # API routers
└── types/                 # TypeScript type definitions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [tRPC](https://trpc.io/) - End-to-end typesafe APIs
- [Prisma](https://prisma.io/) - Database ORM
- [Clerk](https://clerk.com/) - Authentication
- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [AssemblyAI](https://assemblyai.com/) - Speech-to-text
- [Razorpay](https://razorpay.com/) - Payment processing

## 📞 Support

For support, email shubhamkahar196@gmail.com 

---

**Live Demo**: https://github-ai-eight.vercel.app/
