
# AetherBot

<p align="center">
  A production-ready, well-optimized full-stack AI platform built on <b>Next.js</b> and powered by the <b>Google Gemini API</b>. It features full multimodal capabilities, live data visualization with auto-switching charts, interactive code playgrounds with live execution, and a smooth, theme-aware chat workspace.
</p>

<img width="1920" height="1081" alt="Screenshot from 2026-05-23 13-13-32" src="https://github.com/user-attachments/assets/9cd5b975-3432-4740-bab4-bf6711d8b438" />

## Live Demo 🚀
Check out the live demo of the application [here](https://aether-bot.vercel.app/).

---

## ◈ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **AI Model:** Google Gemini API
- **Database:** MongoDB & Mongoose
- **Authentication:** NextAuth.js v4, bcrypt, UUID
- **Media Storage:** Cloudinary
- **Email Delivery:** Nodemailer
- **State Management:** Zustand (Global State)
- **Styling:** CSS Modules & Custom Variables (Dark/Light mode support)

---

## ✦ Key Features

### Chat & AI
* **Text Streaming:** Real-time, character-by-character response generation with a native typing cursor.
* **Document Analysis:** Direct doc (image/pdf) uploads for context-aware queries utilizing Gemini Vision.
* **Text-to-Speech:** Built-in audio playback for generated model responses.

<p align="center">
  <img src="https://github.com/user-attachments/assets/5d07fee0-f282-404e-a115-7e08d26efc11" width="49%" alt="Chat & AI Showcase 1" />
  <img src="https://github.com/user-attachments/assets/27e58f60-f9b4-4c7e-b7fb-73215d53d5bc" width="49%" alt="Chat & AI Showcase 2" />
</p>

### Code & Execution
* **Interactive Sandboxes:** Live UI component rendering directly inside chat bubbles via Sandpack.
* **In-Chat Compilation:** Live code execution and output testing for multiple programming languages using JDoodle.

<p align="center">
    <img src="https://github.com/user-attachments/assets/f664fee6-7333-479d-8be9-c26a92b23302" width="49%" alt="Code Execution Showcase 1" />
    <img src="https://github.com/user-attachments/assets/919036ee-98e7-4cd3-8bec-e8ac81db2147" width="49%" alt="Code Execution Showcase 2" />
</p>

### Data Visualization
* **Recharts Integration:** Renders interactive SVG charts directly in the chat.
* **Auto-Formatting:** Parses JSON output from the model to automatically choose between Line Charts (for trends) and Bar Charts (for categories).
* **Native Theming:** Uses CSS variables to instantly adapt chart colors to the active light or dark mode without needing a JS theme provider.

<img width="1920" height="1084" alt="Screenshot from 2026-05-23 13-48-10" src="https://github.com/user-attachments/assets/4079a1ff-e855-483b-95ed-ed50d23a651b" />

### Workspace & Tools
* **Secure Authentication:** Multi-provider login support (Credentials, GitHub, Discord) powered by NextAuth.js.
* **Share & Export:** Generate shareable conversation links via the Clipboard API or download full threads as `.md` files.
* **Native Dark Mode:** Fully optimized light and dark modes with seamless, runtime-free CSS variable swapping.

<img width="1920" height="1084" alt="image" src="https://github.com/user-attachments/assets/7d57271b-2a0f-43eb-a2c7-74ea8cc7fec2" />

---

## ⚙ Technical Fixes & Optimizations

Here are the specific engineering bottlenecks solved in this codebase:

### Abortable Stream Lifecycle & Safe Termination
Managing long-running ReadableStreams in React often leads to memory leaks or orphaned network requests if a user navigates away or wants to stop the generation. AetherBot implements a strict `AbortController` pattern tied to a comprehensive `isGenerating` state lock. This allows users to safely sever the active TCP connection mid-generation, instantly freeing up browser memory and gracefully resetting the complex UI state without corrupting the global chat history array.

### React-Bypassing Streaming Engine
Standard global state managers (like Zustand) choke when handling high-frequency LLM token streams, forcing the entire chat tree to re-render on every chunk. To solve this, streaming is handled by a custom, vanilla TypeScript `StreamingService`. It uses a publish-subscribe pattern and a `requestAnimationFrame` loop to pipe text directly into the active message component, completely bypassing the React lifecycle. It also features a dynamic speed calculator that adjusts the typing rate based on the buffer size, ensuring smooth, organic text rendering.

### Gemini API Failover & Resilience
LLM APIs can be unpredictable due to rate limits or temporary endpoint timeouts. The backend incorporates an `executeWithFailover` wrapper around the Gemini utility. This architecture automatically intercepts API failures, manages intelligent retry logic, and routes to fallback models if necessary, ensuring the chat experience remains stable and uninterrupted even during API instability.

---

## ↳ Installation & Setup

Follow these steps to get a local instance of AetherBot running on your machine:

### Prerequisites
- **Node.js** (v18.x or later)
- **Package Manager** (`npm` or `yarn`)
- **MongoDB** (Local instance or MongoDB Atlas cluster URI)
- **Google Gemini API Key**

### 1. Clone the Repository
```bash
git clone https://github.com/krazio-01/AetherBot.git
cd AetherBot

```

### 2. Install Dependencies

```bash
npm install
# or
yarn install

```

### 3. Configure Environment Variables

Duplicate the `.env.copy` template to create your local `.env` file:

```bash
cp .env.copy .env

```

Open the `.env` file and securely populate all the required keys.

### 4. Running the App

Start the development server:

```bash
npm run dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser to start chatting.

---

## ↳ Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions are **greatly appreciated**.

---

## ↳ Contact

**Krazio** — [md.krazio@gmail.com]()
