"""
For da future me :)

Builds the test JSON for the frontend (MMSE, orientation, functional
assessment, caretaker). Scoring is NOT done here.

Every builder returns (public, key):
  public -> sent to the frontend
  key    -> correct answers, stays on the server (for scoring later)
"""
import calendar
import copy
import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from itertools import combinations
from pathlib import Path

# data
POOL = json.loads(Path(__file__).with_name("content.json").read_text(encoding="utf-8"))

IST = timezone(timedelta(hours=5, minutes=30))
EDUCATION_LEVELS = {"none", "high school", "bachelor's", "higher"}

MONTHS = list(calendar.month_name)[1:]
WEEKDAYS = list(calendar.day_name)

COUNTRIES = ["India", "Bangladesh", "Nepal", "Bhutan", "Myanmar",
             "Sri Lanka", "Pakistan", "China"]

STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal",
]

# Could add more states here if I scale this project later. Wrong district options come from the same state first.
DISTRICTS = {
    "Meghalaya": [
        "East Khasi Hills", "West Khasi Hills", "South West Khasi Hills",
        "Eastern West Khasi Hills", "Ri-Bhoi", "East Jaintia Hills",
        "West Jaintia Hills", "East Garo Hills", "North Garo Hills",
        "South Garo Hills", "West Garo Hills", "South West Garo Hills",
    ],
}

# In-memory store: session_id -> answer key. Replace with Redis/DB later.
SESSIONS = {}


# helpers
def shuffled(items):
    """Shuffled copy that is never identical to the input (if len > 1)."""
    out = list(items)
    while out == list(items) and len(out) > 1:
        random.shuffle(out)
    return out


def make_options(correct, wrong_pool, n_wrong=3):
    pool = list({w for w in wrong_pool if w != correct})
    if len(pool) < n_wrong:
        raise ValueError(f"Not enough wrong options for '{correct}'. Add more data.")
    options = random.sample(pool, n_wrong) + [correct]
    random.shuffle(options)
    return options


def date_options(correct, days_in_month):
    """4 dates (1 correct + 3 wrong), all at least 3 days apart."""
    for _ in range(100):
        chosen = [correct]
        candidates = list(range(1, days_in_month + 1))
        random.shuffle(candidates)
        for d in candidates:
            if all(abs(d - c) >= 3 for c in chosen):
                chosen.append(d)
            if len(chosen) == 4:
                options = [str(x) for x in chosen]
                random.shuffle(options)
                return options
    raise RuntimeError("Could not build date options")


# 1. MMSE
def build_mmse():
    reg = random.sample(POOL["registration_words"], 2)
    spell = random.sample(POOL["spell_words"], 2)
    sub_n = random.sample(range(50, 101), 2) # n means number and d means difference
    sub_d = random.sample(range(2, 10), 2)
    add_n = random.sample(range(1, 51), 2)
    add_d = random.sample(range(2, 10), 2)

    public, key = [], []
    for i in range(2):
        sub_t = min(random.randint(3, 5), sub_n[i] // sub_d[i])
        add_t = random.randint(3, 5)
        public.append({
            "registration_word": reg[i],
            "attention": {
                "serial_subtraction": {"number": sub_n[i], "subtract": sub_d[i], "times": sub_t},
                "serial_addition": {"number": add_n[i], "add": add_d[i], "times": add_t},
                "spell_backwards": {"word": spell[i]},
            },
        })
        key.append({
            "registration_word": reg[i],   # also the delayed-recall answer
            "serial_subtraction": [sub_n[i] - sub_d[i] * k for k in range(1, sub_t + 1)],
            "serial_addition": [add_n[i] + add_d[i] * k for k in range(1, add_t + 1)],
            "spell_backwards": spell[i][::-1],
        })
    return public, key


# 2. Orientation
def build_orientation(loc):
    now = datetime.now(IST)
    days_in_month = calendar.monthrange(now.year, now.month)[1]

    same_state = [d for d in DISTRICTS.get(loc["state"], []) if d != loc["district"]]
    other_states = [d for s, ds in DISTRICTS.items() if s != loc["state"] for d in ds]
    district_pool = same_state if len(same_state) >= 3 else same_state + other_states

    # (id, question, correct answer, options)
    qs = [

        ("year", "What year is it?", str(now.year),
         make_options(str(now.year), [str(now.year + d) for d in (-3, -2, -1, 1, 2, 3)])),

        ("month", "Which month is it?", MONTHS[now.month - 1],
         make_options(MONTHS[now.month - 1], MONTHS)),

        ("date", "What is today's date?", str(now.day),
         date_options(now.day, days_in_month)),

        ("day", "Which day of the week is it?", WEEKDAYS[now.weekday()],
         make_options(WEEKDAYS[now.weekday()], WEEKDAYS)),

        ("country", "Which country are you in?", loc["country"],
         make_options(loc["country"], COUNTRIES)),

        ("state", "Which state are you in?", loc["state"],
         make_options(loc["state"], STATES)),

        ("district", "Which district or town are you in?", loc["district"],
         make_options(loc["district"], district_pool)),
         
    ]
    public = [{"id": i, "question": q, "options": o} for i, q, _, o in qs]
    key = {i: correct for i, _, correct, _ in qs}
    return public, key


# 3. Functional assessment
def pick_trail_sets():
    """2 letter sets with no letters in common (segment 2 uses different letters)."""
    sets = POOL["trail_making"]
    pairs = [(a, b) for a, b in combinations(sets, 2) if not set(a) & set(b)]
    a, b = random.choice(pairs) if pairs else random.sample(sets, 2)
    return random.sample([a, b], 2)


def build_functional():
    trails = pick_trail_sets()
    seqs = random.sample(POOL["sequencing"], 2)  # 2 different activities

    public, key = [], []
    for letters, seq in zip(trails, seqs):
        steps = seq["steps_in_order"]
        # random ids, NOT positions, so the frontend can't read the order from them
        ids = [uuid.uuid4().hex[:8] for _ in steps]
        items = [{"id": ids[i], "text": steps[i]} for i in range(len(steps))]
        public.append({
            "trail_making": {
                "letters": shuffled(letters),
            },
            "sequencing": {
                "activity_title": seq["activity_title"],
                "steps": shuffled(items),
            },
        })
        key.append({
            "trail_making": sorted(letters),
            "sequencing": ids,  # ids in the correct order
        })
    return public, key


# 4. Caretaker
def build_caretaker():
    return copy.deepcopy(POOL["caretaker"])  # no answer key, all Yes/No or numbers


# put it together
def create_test(intake):
    """
    intake = {"age": 72, "education": "high school",
              "country": "India", "state": "Meghalaya", "district": "East Khasi Hills"}
    """
    if intake.get("education") not in EDUCATION_LEVELS:
        raise ValueError(f"education must be one of {sorted(EDUCATION_LEVELS)}")
    if not isinstance(intake.get("age"), int) or intake["age"] <= 0:
        raise ValueError("age must be a positive integer")
    for f in ("country", "state", "district"):
        if not intake.get(f):
            raise ValueError(f"missing {f}")

    mmse_pub, mmse_key = build_mmse()
    ori_pub, ori_key = build_orientation(intake)
    fun_pub, fun_key = build_functional()

    session_id = uuid.uuid4().hex
    SESSIONS[session_id] = {
        "intake": intake,
        "mmse": mmse_key,
        "orientation": ori_key,
        "functional": fun_key,
    }
    return {
        "session_id": session_id,
        "mmse": {"segments": mmse_pub},
        "orientation": ori_pub,
        "functional_assessment": {"segments": fun_pub},
        "caretaker": build_caretaker(),
    }


if __name__ == "__main__":
    demo = create_test({"age": 70, "education": "high school",
                        "country": "India", "state": "Meghalaya",
                        "district": "East Khasi Hills"})
    print(json.dumps(demo, indent=2))
