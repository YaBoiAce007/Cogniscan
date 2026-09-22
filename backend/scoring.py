"""
Scores the submitted answers against the stored answer key, builds the
model features and returns the predicted probability.
"""
from typing import Optional
import joblib
import pandas as pd
from pydantic import BaseModel, Field
from test_builder import SESSIONS

MODEL = joblib.load("../ml/model/model.pkl")

# Must match the encoding used when I trained the model
EDUCATION_CODE = {"none": 0, "high school": 1, "bachelor's": 2, "higher": 3}


# request schemas (what the frontend sends back)
class MMSESegmentIn(BaseModel):
    registration: str
    serial_subtraction: list[Optional[int]]  # None for a skipped answer
    serial_addition: list[Optional[int]]
    spell_backwards: str
    delayed_recall: str


class TrailIn(BaseModel):
    taps: list[str]        # every letter tapped, in order, wrong taps included


class SequencingIn(BaseModel):
    order: list[str]       # step ids in the order the patient put them


class FunctionalSegmentIn(BaseModel):
    trail_making: TrailIn
    sequencing: SequencingIn


class SymptomsIn(BaseModel):
    forgetfulness: list[bool] = Field(min_length=3, max_length=3)
    confusion: list[bool] = Field(min_length=3, max_length=3)
    personality_changes: list[bool] = Field(min_length=3, max_length=3)
    behavioral_problems: list[bool] = Field(min_length=3, max_length=3)


class SleepIn(BaseModel):
    hours: float
    wakeups: int
    rested: bool


class CaretakerIn(BaseModel):
    symptoms: SymptomsIn
    head_injury: bool
    family_history: bool
    adl: list[bool] = Field(min_length=5, max_length=5)  # True = can do it alone
    sleep: SleepIn


class AnswersIn(BaseModel):
    session_id: str
    mmse: list[MMSESegmentIn] = Field(min_length=2, max_length=2)
    orientation: dict[str, str]                # question id -> chosen option text
    functional_assessment: list[FunctionalSegmentIn] = Field(min_length=2, max_length=2)
    caretaker: CaretakerIn


class SessionNotFound(Exception):
    pass

# scoring
def score_mmse(segments, key):
    marks = 0
    for s, k in zip(segments, key):
        marks += s.registration.strip().lower() == k["registration_word"]
        marks += s.serial_subtraction == k["serial_subtraction"]
        marks += s.serial_addition == k["serial_addition"]
        marks += s.spell_backwards.strip().lower() == k["spell_backwards"]
        marks += s.delayed_recall.strip().lower() == k["registration_word"]
    return marks / 10 * 30


def score_disorientation(answers, key):
    correct = sum(answers.get(q, "").strip() == a for q, a in key.items())
    return 0 if correct >= 4 else 1


def trail_passed(trail, expected):
    return [t.upper() for t in trail.taps] == expected

def score_functional(segments, key):
    marks = 0
    for s, k in zip(segments, key):
        marks += trail_passed(s.trail_making, k["trail_making"])
        marks += s.sequencing.order == k["sequencing"]
    return marks / 4 * 10


def symptom(answers):
    return int(sum(answers) >= 2)


def sleep_quality(s):
    h = s.hours
    if 7 <= h <= 9:
        hours_loss = 0
    elif 6 <= h < 7 or 9 < h <= 10:
        hours_loss = 1
    elif 5 <= h < 6:
        hours_loss = 2
    else:
        hours_loss = 3
    wake_loss = 0 if s.wakeups <= 1 else 1 if s.wakeups <= 3 else 2
    return 10 - hours_loss - wake_loss - (0 if s.rested else 1)


# main
def build_features(a, sess):
    c = a.caretaker
    return {  # same order as the training columns
        "Age": sess["intake"]["age"],
        "EducationLevel": EDUCATION_CODE[sess["intake"]["education"]],
        "FamilyHistoryAlzheimers": int(c.family_history),
        "HeadInjury": int(c.head_injury),
        "SleepQuality": sleep_quality(c.sleep),
        "MMSE": score_mmse(a.mmse, sess["mmse"]),
        "FunctionalAssessment": score_functional(a.functional_assessment, sess["functional"]),
        "ADL": sum(c.adl) * 2,
        "BehavioralProblems": symptom(c.symptoms.behavioral_problems),
        "PersonalityChanges": symptom(c.symptoms.personality_changes),
        "Confusion": symptom(c.symptoms.confusion),
        "Disorientation": score_disorientation(a.orientation, sess["orientation"]),
        "Forgetfulness": symptom(c.symptoms.forgetfulness),
    }


def predict_risk(features):
    X = pd.DataFrame([features])
    if hasattr(MODEL, "feature_names_in_"):
        X = X[list(MODEL.feature_names_in_)] # feature_names_in_ is an attribute scikit-learn models store automatically when you train them on a pandas DataFrame. It remembers the column names and their order from training.
    proba = MODEL.predict_proba(X)[0]
    print(proba)
    print(list(MODEL.classes_))
    return float(proba[list(MODEL.classes_).index(1)])  # probability of class 1


def score_test(a: AnswersIn):
    sess = SESSIONS.get(a.session_id)
    if sess is None:
        raise SessionNotFound()
    features = build_features(a, sess)
    risk_probability = predict_risk(features)
    return {"features": features, "risk_percentage": round(risk_probability*100, 2)}
