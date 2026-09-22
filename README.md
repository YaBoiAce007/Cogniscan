# Cogniscan

An ML-assisted cognitive screening / risk-estimation prototype that identifies patterns associated with elevated cognitive-decline risk.

Cogniscan combines a short interactive assessment (MMSE-style tasks, orientation questions, functional assessment, and caretaker-reported symptoms) with a trained machine learning model (RandomForestClassifier) to estimate a risk percentage for cognitive decline.

---

## Tech Stack

- **Backend:** Python, FastAPI, Uvicorn, scikit-learn, pandas, joblib
- **Frontend:** Node.js / npm (Vite-based dev server)
- **Model:** RandomForestClassifier (trained via `train.py`, saved as `model/model.pkl`)

---

## Prerequisites

Make sure you have the following installed before you start:

- **Git**
- **Python 3.9+** (with `venv` module available)
- **Node.js 18+** and **npm**

---

## 1. Clone the Repository

```bash
git clone https://github.com/YaBoiAce007/Cogniscan.git cogniscan
cd cogniscan
```

---

## 2. Backend Setup (FastAPI + Uvicorn)

### 2.1 Create the virtual environment

Create a virtual environment named `.cogniscan_ve`:

```bash
python -m venv .cogniscan_ve
```

### 2.2 Activate the virtual environment

**macOS / Linux:**
```bash
source .cogniscan_ve/bin/activate
```

**Windows (PowerShell):**
```powershell
.cogniscan_ve\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
.cogniscan_ve\Scripts\activate.bat
```

Once activated, your terminal prompt should be prefixed with `(.cogniscan_ve)`.

### 2.3 Install backend dependencies

```bash
pip install -r requirements.txt
```

### 2.4 Set up environment variables

Create a `.env` file in the backend directory if one doesn't already exist (the app calls `load_dotenv()` on startup):

```bash
touch .env
```

Add any required environment variables to this file as needed for your setup.

### 2.5 Run the FastAPI backend with Uvicorn

With the virtual environment still active:

```bash
cd backend
```

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- `main:app` — points to the `app` FastAPI instance inside `main.py`
- `--host 0.0.0.0` — makes the server accessible on your local network
- `--port 8000` — backend will be available at `http://localhost:8000`
- `--reload` — auto-restarts the server on code changes (development only)

You should see output confirming the server is running. Visit `http://localhost:8000` in your browser — you should see the `"Hello"` response from the root endpoint.

Interactive API docs are automatically available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 2.6 Deactivating the virtual environment

```bash
deactivate
```

---

## 3. Frontend Setup (npm + Vite)

Open a **new terminal window/tab** (keep the backend running in the other one).

### 3.1 Navigate to the frontend folder

```bash
cd frontend
```

### 3.2 Install frontend dependencies

```bash
npm install
```

### 3.3 Run the frontend dev server

```bash
npm run dev
```

By default, this will start the Vite dev server at `http://localhost:5173` (the backend's CORS settings already allow requests from `http://localhost:5173` and `http://localhost:3000`).

---

## 4. Running the Full Project

To run Cogniscan locally, you need **both servers running simultaneously**, each in its own terminal:

| Terminal | Command | URL |
|---|---|---|
| 1 — Backend | `uvicorn main:app --host 0.0.0.0 --port 8000 --reload` | http://localhost:8000 |
| 2 — Frontend | `npm run dev` | http://localhost:5173 |

Once both are running, open `http://localhost:5173` in your browser to use the Cogniscan app.

---

## 5. (Optional) Training / Retraining the Model

If you want to retrain the risk-prediction model from the dataset:

```bash
cd ml
python train.py
```

This trains a `RandomForestClassifier` on `data/cleaned_prototype_dataset_v1.csv` and saves the trained model to `model/model.pkl`, which is loaded by the backend at runtime.

To evaluate the model on the same dataset and inspect feature importances:

```bash
python test.py
```

---

## Troubleshooting

- **`ModuleNotFoundError` on backend startup** — Make sure the `.cogniscan_ve` virtual environment is activated and `pip install -r requirements.txt` completed successfully.
- **CORS errors in the browser console** — Confirm the frontend is running on `http://localhost:5173` or `http://localhost:3000`, matching the `allow_origins` list in `main.py`.
- **`model/model.pkl` not found** — Run `python train.py` first to generate the trained model file.
- **Port already in use** — Change the `--port` flag for Uvicorn, or stop whatever else is using port 8000 / 5173.

---

## Disclaimer

Cogniscan is a research/educational prototype and is **not** a diagnostic medical tool. Risk estimates produced by the model should not be used as a substitute for professional medical evaluation.
