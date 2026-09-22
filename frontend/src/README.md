# COGNISCAN frontend

React/Vite frontend matching the supplied FastAPI backend.

## Files
- `App.jsx`
- `styles.css`

## Setup
Put both files in your React app's `src/` directory and make sure `main.jsx` imports `App.jsx` normally.

Optional `.env`:
`VITE_API_URL=http://localhost:8000`

The frontend calls:
- `POST /start-test`
- `POST /submit-test`
