# Meeting Assistant — Frontend

React + TypeScript + Tailwind CSS UI for the [Meeting Assistant](../README.md) FastAPI backend.

```bash
npm install
cp .env.example .env   # points at the FastAPI backend, defaults to localhost:8000
npm run dev
```

Requires the FastAPI backend running separately (`uvicorn main:app --reload` from the repo root). See the [root README](../README.md) for full setup, including the Python side.
