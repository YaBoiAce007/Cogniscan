from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from test_builder import create_test, SESSIONS
from scoring import AnswersIn, score_test, SessionNotFound

load_dotenv() # It reads the .env file and loads the variables into the program's environment variables.

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # my frontend origin(s)
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# Just wanted to test out fastapi's request mapping real quick
@app.get("/")
def greet():
    return "Hello"

class Intake(BaseModel):
    age: int
    education: str
    country: str
    state: str
    district: str

@app.post("/start-test")
def start_test(intake: Intake):
    try:
        return create_test(intake.model_dump()) # .model_dump() is a Pydantic method that converts a Pydantic model object into a normal Python dictionary.
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/submit-test")
def submit_test(answers: AnswersIn):
    try:
        result = score_test(answers)
    except SessionNotFound:
        raise HTTPException(status_code=404, detail="Unknown or expired session")
    # SESSIONS.pop(answers.session_id, None) #The None means: If the key doesn't exist, just return None instead of raising an error (KeyError: key).
    return result