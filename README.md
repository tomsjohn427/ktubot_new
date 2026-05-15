# 🤖 KTUBot — AI-Powered Academic Assistant for KTU Students

> A Retrieval-Augmented Generation (RAG) chatbot that answers academic questions **strictly from uploaded study notes**, tailored for APJ Abdul Kalam Technological University (KTU) students.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [API Reference](#-api-reference)
- [Data Models](#-data-models)
- [How RAG Works](#-how-rag-works)
- [User Roles](#-user-roles)
- [Frontend Pages](#-frontend-pages)
- [Marks Mode (Exam Feature)](#-marks-mode-exam-feature)
- [Admin Workflow](#-admin-workflow)
- [Student Workflow](#-student-workflow)
- [Known Limitations](#-known-limitations)
- [Contributing](#-contributing)

---

## 🧠 Overview

KTUBot is a full-stack web application that allows KTU students to interact with their subject notes through a conversational AI interface. Instead of hallucinating answers from general knowledge, the bot uses **Retrieval-Augmented Generation (RAG)** — it only answers questions using content found in the PDF notes uploaded by admins.

The system uses **Ollama** running locally to power both embeddings (`nomic-embed-text`) and chat completions (`llama3.2:3b`), making it fully self-hostable with **no external AI API costs**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **RAG Answering** | Answers questions strictly from uploaded PDF notes using semantic search |
| 📄 **PDF Upload & Processing** | Admins upload PDFs per module; text is extracted, chunked, and embedded |
| 🎓 **Marks Mode** | Generate exam-ready answers for 3-mark, 7-mark, or 14-mark questions |
| 🏫 **Department & Semester Filtering** | Students only see subjects and notes relevant to their profile |
| 🖼️ **Auto Diagram Fetching** | Automatically searches Wikimedia Commons for educational diagrams when relevant |
| 📐 **LaTeX Math Rendering** | Formulas are rendered beautifully using KaTeX via remark-math/rehype-katex |
| 🔐 **JWT Authentication** | Secure login system with student and admin roles |
| 💬 **Chat History** | Persistent multi-turn conversations stored per subject per user |
| 📊 **Admin Dashboard** | Manage subjects, notes, and users from a dedicated admin panel |
| ⚡ **Upload Progress Tracking** | Real-time embedding progress tracking via in-memory job map |
| 🚫 **Strict Grounding** | Bot refuses to answer questions not covered by the uploaded notes |

---

## 🛠️ Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| Express | ^4.18.2 | HTTP server & routing |
| Mongoose | ^8.1.3 | MongoDB ODM |
| Ollama (local) | latest | LLM inference + embeddings |
| pdf-parse | ^1.1.1 | PDF text extraction |
| Multer | ^1.4.5-lts.1 | PDF file upload handling |
| bcryptjs | ^2.4.3 | Password hashing |
| jsonwebtoken | ^9.0.2 | JWT authentication |
| axios | ^1.14.0 | HTTP client (for Ollama & Wikimedia) |
| duck-duck-scrape | ^2.2.7 | Web search (utility) |
| uuid | ^9.0.0 | Job ID generation |
| dotenv | ^16.4.1 | Environment variable management |
| nodemon | ^3.0.3 | Dev server auto-restart |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | ^18.2.0 | UI framework |
| Vite | ^5.1.4 | Build tool & dev server |
| React Router DOM | ^6.22.0 | Client-side routing |
| Axios | ^1.6.7 | API requests |
| react-markdown | ^10.1.0 | Render markdown in chat |
| remark-gfm | ^4.0.1 | GitHub Flavored Markdown |
| remark-math | ^6.0.0 | Parse LaTeX math in markdown |
| rehype-katex | ^7.0.1 | Render LaTeX math via KaTeX |

### Infrastructure
| Tool | Purpose |
|---|---|
| MongoDB | Primary database |
| Ollama | Local AI model server |
| `llama3.2:3b` | Chat completion model |
| `nomic-embed-text` | Text embedding model |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                        │
│  (Vite + React Router + react-markdown + KaTeX)          │
└─────────────────────┬───────────────────────────────────┘
                       │ REST API (Axios)
┌─────────────────────▼───────────────────────────────────┐
│                   Express Backend                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  /auth   │  │ /notes   │  │ /chats   │  │ /admin  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │                  RAG Pipeline (rag.js)              │  │
│  │  PDF → Extract Text → Chunk → Embed → Store       │  │
│  │  Query → Embed → Cosine Similarity → Top-K Chunks │  │
│  └────────────────────────────────────────────────────┘  │
└──────────┬────────────────────────┬────────────────────┘
            │                        │
┌───────────▼────────┐   ┌──────────▼──────────────────┐
│     MongoDB         │   │     Ollama (localhost:11434) │
│  Users, Subjects,   │   │  llama3.2:3b (chat)         │
│  Notes, Chats       │   │  nomic-embed-text (embed)   │
└────────────────────┘   └─────────────────────────────┘
```

---

## 📁 Project Structure

```
PROJECT_FINAL/
├── backend/
│   ├── server.js                 # Express app entry point
│   ├── package.json
│   ├── .env.example              # Environment variable template
│   ├── middleware/
│   │   └── auth.js               # JWT auth middleware + adminOnly guard
│   ├── models/
│   │   ├── User.js               # User schema (student/admin, dept, semester)
│   │   ├── Note.js               # Note schema (PDF chunks + embeddings)
│   │   ├── Subject.js            # Subject schema (name, code, dept, semester)
│   │   └── Chat.js               # Chat schema (message history per user/subject)
│   ├── routes/
│   │   ├── auth.js               # Register, login, profile
│   │   ├── subjects.js           # CRUD for subjects
│   │   ├── notes.js              # PDF upload & note management
│   │   ├── chats.js              # Chat sessions & RAG message handling
│   │   └── admin.js              # Admin-only routes
│   ├── utils/
│   │   ├── rag.js                # Core RAG pipeline (extract, chunk, embed, retrieve)
│   │   └── imageSearch.js        # Wikimedia Commons diagram fetcher
│   └── uploads/                  # Stored PDF files (auto-created)
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx               # Router, auth guards, layout
        ├── index.css             # Global styles
        ├── context/
        │   └── AuthContext.jsx   # Global auth state (React Context)
        ├── components/
        │   ├── BottomNav.jsx     # Mobile-style bottom navigation
        │   └── PdfUploadWithProgress.jsx  # Upload UI with real-time progress
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── HomePage.jsx      # Subject listing for students
            ├── SubjectsPage.jsx  # Browse/filter subjects
            ├── ChatPage.jsx      # Main chat interface (RAG)
            ├── ChatsPage.jsx     # Chat history list
            ├── ProfilePage.jsx   # Edit profile, password, semester/dept
            ├── AdminDashboard.jsx
            └── AdminPage.jsx     # Manage subjects, notes, users
```

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB** (local instance or MongoDB Atlas)
- **Ollama** — [Install here](https://ollama.com/download)

### Ollama Models Required

After installing Ollama, pull the two required models:

```bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Verify Ollama is running:
```bash
ollama serve
# Should start on http://localhost:11434
```

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ktubot.git
cd ktubot
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy the example env file and fill in your values:
```bash
cp .env.example .env
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
# Server
PORT=5000

# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/ktubot

# JWT signing secret — change this to a long random string in production
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# OpenAI API Key (currently unused — embeddings are via Ollama locally)
OPENAI_API_KEY=your_openai_api_key_here

# Google Custom Search (optional, for web search features)
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_CX=your_google_cx_id
```

> ⚠️ **Important**: Never commit your real `.env` file to version control. The `.env.example` file is safe to commit.

---

## ▶️ Running the Application

### Start Ollama (required before running backend)

```bash
ollama serve
```

### Start the Backend

```bash
cd backend
npm run dev      # Development (nodemon, auto-restarts on changes)
# OR
npm start        # Production
```

The backend will start on `http://localhost:5000`.

### Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`.

### Build Frontend for Production

```bash
cd frontend
npm run build
npm run preview   # Preview the production build locally
```

---

## 📡 API Reference

All API routes are prefixed with `/api`.

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | None | Create a new student account |
| `POST` | `/login` | None | Login and receive JWT token |
| `GET` | `/me` | JWT | Get current user info |
| `PUT` | `/profile` | JWT | Update email, semester, department, password |

**Register Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secret123",
  "semester": 4,
  "department": "CSE"
}
```

**Login Request Body:**
```json
{
  "username": "john_doe",
  "password": "secret123"
}
```

**Login Response:**
```json
{
  "token": "<jwt_token>",
  "user": { "username": "john_doe", "role": "student", "semester": 4, "department": "CSE" }
}
```

> All protected endpoints require the `Authorization: Bearer <token>` header.

---

### Subjects — `/api/subjects`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | JWT | Get all subjects (filtered by student's dept+semester) |
| `POST` | `/` | Admin | Create a new subject |
| `PUT` | `/:id` | Admin | Update a subject |
| `DELETE` | `/:id` | Admin | Delete a subject |

---

### Notes — `/api/notes`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/upload` | Admin | Upload a PDF for a subject module |
| `GET` | `/subject/:subjectId` | JWT | Get all notes for a subject |
| `GET` | `/` | Admin | Get all notes (with dept/semester/subject filters) |
| `DELETE` | `/:id` | Admin | Delete a note and its file |

**Upload PDF (multipart/form-data):**
```
pdf          — the PDF file (max 50MB)
subjectId    — MongoDB ObjectId of the subject
moduleNumber — integer (1–10)
moduleName   — string (optional, e.g. "Module 1: Data Structures")
jobId        — UUID for tracking embedding progress
```

---

### Chats — `/api/chats`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | JWT | Get all chat sessions for current user |
| `GET` | `/subject/:subjectId` | JWT | Get the most recent chat for a subject |
| `POST` | `/new` | JWT | Create a new blank chat session |
| `POST` | `/message` | JWT | Send a message and receive a RAG-powered reply |
| `DELETE` | `/:id` | JWT | Delete a chat session |

**Send Message Request Body:**
```json
{
  "subjectId": "<subject_objectid>",
  "message": "Explain the concept of pipelining",
  "chatId": "<chat_objectid>",
  "marksMode": "7"
}
```

`marksMode` options: `"general"` | `"3"` | `"7"` | `"14"`

**Send Message Response:**
```json
{
  "chatId": "<chat_objectid>",
  "reply": "Pipelining is a technique where...",
  "messages": [...],
  "title": "Explain the concept of pipelining"
}
```

---

### Admin — `/api/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | Admin | List all users |
| `PUT` | `/users/:id/role` | Admin | Change a user's role |
| `DELETE` | `/users/:id` | Admin | Delete a user |

---

### Health Check

```
GET /api/health
→ { "status": "ok" }
```

---

## 🗄️ Data Models

### User
```js
{
  username:   String (unique),
  email:      String (unique),
  password:   String (bcrypt hashed),
  role:       "student" | "admin",
  semester:   Number (1–8),
  department: "CSE" | "ECE" | "EEE" | "ME" | "CE" | "IT" | ""
}
```

### Subject
```js
{
  name:       String,
  code:       String,
  semester:   Number,
  department: String
}
```

### Note
```js
{
  subjectId:    ObjectId → Subject,
  moduleNumber: Number (1–10),
  moduleName:   String,
  department:   String,
  semester:     Number,
  fileName:     String (stored file name),
  originalName: String,
  rawText:      String (full PDF text),
  chunks: [{
    text:      String,
    embedding: [Number],  // nomic-embed-text vector
    index:     Number
  }],
  uploadedBy:   ObjectId → User,
  processed:    Boolean
}
```

### Chat
```js
{
  userId:    ObjectId → User,
  subjectId: ObjectId → Subject,
  title:     String (auto-set from first message),
  messages: [{
    role:    "user" | "assistant",
    content: String
  }]
}
```

---

## 🔬 How RAG Works

KTUBot uses a full local RAG pipeline — no external AI API needed:

### 1. PDF Ingestion (Admin uploads a PDF)
```
PDF File → pdf-parse → raw text
         → chunkText() → 400-word chunks (40-word overlap)
         → Ollama (nomic-embed-text) → vector embeddings
         → Stored in MongoDB Note.chunks[]
```

### 2. Query Processing (Student sends a question)
```
User Question → Ollama (nomic-embed-text) → query embedding
              → cosineSimilarity() vs all stored chunk embeddings
              → Top 5 most relevant chunks selected
              ─── fallback: keyword search if embeddings unavailable ───
```

### 3. Answer Generation
```
System Prompt (STRICT: only use provided context)
+ Top-K chunks as "NOTES CONTEXT"
+ Conversation history (last 10 messages)
+ User question (+ marks format instruction if applicable)
→ Ollama llama3.2:3b → response text
→ [SEARCH_IMAGE: concept] tags → Wikimedia diagram URLs injected
→ Final markdown response sent to frontend
```

### 4. Strict Grounding
The system prompt explicitly instructs the model:
- **Do NOT use pre-trained knowledge** for academic questions
- If the topic is not in the notes, respond: *"❌ I'm sorry, but this topic is not covered in the provided study materials"*

---

## 👥 User Roles

### Student
- Register with username, email, password, semester (1–8), and department
- Can only view subjects matching their department and semester
- Can chat with the bot for any of their subjects
- Can view and manage their own chat history
- Can update profile (email, department, semester, password)

### Admin
- Created manually (set `role: "admin"` in MongoDB or via the admin API)
- Can create, edit, and delete subjects across all departments and semesters
- Can upload PDFs for any subject module
- Can view and delete any notes
- Can manage all users and their roles
- Has access to the Admin Dashboard and Admin Management pages

---

## 🖥️ Frontend Pages

| Route | Page | Access |
|---|---|---|
| `/login` | Login Page | Public |
| `/register` | Register Page | Public |
| `/home` | Home — subject grid | Students |
| `/subjects` | Browse all subjects | All users |
| `/chat/:subjectId` | Chat interface (RAG) | All users |
| `/chat/:subjectId/:chatId` | Specific chat session | All users |
| `/chats` | Chat history list | All users |
| `/profile` | User profile editor | All users |
| `/admin` | Admin Dashboard | Admins only |
| `/admin/manage` | Admin Management Panel | Admins only |

---

## 🎯 Marks Mode (Exam Feature)

Students can select an answer format tailored for KTU exam marks:

| Mode | Output Format |
|---|---|
| **General** | Conversational explanation |
| **3 Marks** | 3–4 concise key points, ~60–80 words, numbered list |
| **7 Marks** | 6–8 detailed points with sub-details, ~150–200 words |
| **14 Marks** | Full exam answer with intro, 10+ points, diagrams, comparisons, conclusion — 350–400+ words |

This is implemented by appending a `[FORMAT: ...]` instruction to the user's question before sending it to the LLM, while keeping the RAG context strictly note-based.

---

## 🔑 Admin Workflow

1. **Login** with an admin account
2. **Create subjects**: Go to Admin → Manage → Subjects → Add Subject (fill in name, code, department, semester)
3. **Upload notes**: Select a subject → Upload PDF → Choose module number → Upload
4. Wait for embedding to complete (tracked via upload progress bar)
5. Notes are now ready for student queries

---

## 🎓 Student Workflow

1. **Register** with your KTU details (semester and department are important)
2. **Login** — you'll be redirected to your Home page
3. Your Home page shows subjects relevant to **your semester and department only**
4. **Click a subject** to open a chat session
5. **Ask questions** — the bot answers from uploaded notes only
6. Use **Marks Mode** to get exam-style formatted answers (3 / 7 / 14 marks)
7. View your **chat history** under the Chats tab

---

## ⚠️ Known Limitations

- **Ollama must be running locally** — the backend calls `http://localhost:11434`. If Ollama is down, AI responses will fail.
- **Embedding is slow for large PDFs** — the `nomic-embed-text` model embeds one chunk at a time. A 100-page PDF may take several minutes.
- **No cloud LLM fallback** — the app is fully local by design. If you need cloud inference, replace the Ollama `axios.post` calls in `routes/chats.js` and `utils/rag.js` with OpenAI SDK calls (the `OPENAI_API_KEY` env var is already wired).
- **In-memory job tracking** — upload progress (`uploadJobs` Map in `rag.js`) is lost on server restart. Long uploads may not report progress if the server restarts mid-way.
- **Single file format** — only PDF uploads are supported.
- **No real-time streaming** — chat responses are returned in full after completion (no token-by-token streaming).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please make sure to test your changes with both student and admin roles before submitting.

---

## 📄 License

This project is for educational and academic use. See [LICENSE](LICENSE) for details.

---

<p align="center">Built for KTU students 🎓 | Powered by Ollama + llama3.2 + nomic-embed-text</p>