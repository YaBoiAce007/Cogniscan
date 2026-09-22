import { useEffect, useMemo, useState } from "react";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const educationOptions = ["none", "high school", "bachelor's", "higher"];

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "Something went wrong.");
  return data;
}

function Header() {
  return (
    <header className="site-header">
      <div className="brand">COGNISCAN</div>
      <div className="brand-subtitle">Cognitive Screening</div>
    </header>
  );
}

function Button({ children, ...props }) {
  return <button className="primary-btn" {...props}>{children}</button>;
}

function BackButton({ onClick }) {
  return <button className="back-btn" onClick={onClick}>← Back</button>;
}

function Home({ onStart }) {
  return (
    <main className="home">
      <section className="hero-card">
        <div className="hero-mark">C</div>
        <h1>COGNISCAN</h1>
        <p className="hero-subtitle">Cognitive Screening & Risk Estimation</p>
        <p className="hero-text">
          A short guided screening designed to assess memory, attention,
          orientation, everyday functioning, and related observations.
        </p>
        <Button onClick={onStart}>Start Screening</Button>
      </section>
    </main>
  );
}

function Intake({ onBack, onComplete }) {
  const [form, setForm] = useState({
    age: "",
    education: "",
    country: "India",
    state: "",
    district: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal",
  ];

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!form.age || Number(form.age) <= 0 || !form.education ||
        !form.country || !form.state || !form.district) {
      setError("Please complete all fields.");
      return;
    }

    setLoading(true);
    try {
      const test = await post("/start-test", {
        ...form,
        age: Number(form.age),
      });
      onComplete(test);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <BackButton onClick={onBack} />
      <section className="form-card">
        <StepHeader step="1" title="Patient Details" subtitle="Enter the details before beginning the screening." />
        <form onSubmit={submit}>
          <div className="field-grid">
            <label>
              Age
              <input
                type="number"
                min="1"
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
              />
            </label>

            <label>
              Education level
              <select
                value={form.education}
                onChange={e => setForm({ ...form, education: e.target.value })}
              >
                <option value="">Select education</option>
                {educationOptions.map(x => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </label>

            <label>
              Country
              <select
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
              >
                {["India", "Bangladesh", "Nepal", "Bhutan", "Myanmar", "Sri Lanka", "Pakistan", "China"]
                  .map(x => <option key={x}>{x}</option>)}
              </select>
            </label>

            <label>
              State
              <select
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value, district: "" })}
              >
                <option value="">Select state</option>
                {states.map(x => <option key={x}>{x}</option>)}
              </select>
            </label>

            <label className="full">
              District / Town
              <input
                value={form.district}
                onChange={e => setForm({ ...form, district: e.target.value })}
                placeholder="Enter district or town"
              />
            </label>
          </div>

          {error && <ErrorBox>{error}</ErrorBox>}
          <Button disabled={loading}>{loading ? "Preparing screening..." : "Begin Test"}</Button>
        </form>
      </section>
    </main>
  );
}

function StepHeader({ step, title, subtitle }) {
  return (
    <div className="step-header">
      <span className="step-number">{step}</span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function ErrorBox({ children }) {
  return <div className="error-box">{children}</div>;
}

function Progress({ current, total }) {
  return (
    <div className="progress-wrap">
      <div className="progress-label">Section {current} of {total}</div>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

function TestShell({ title, subtitle, children, onBack, progress }) {
  return (
    <main className="page">
      <div className="test-top">
        <BackButton onClick={onBack} />
        {progress}
      </div>
      <section className="test-card">
        <h2>{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
        {children}
      </section>
    </main>
  );
}

function MMSE({ data, onDone, onBack }) {
  const [segment, setSegment] = useState(0);
  const [phase, setPhase] = useState("registration");
  const [registration, setRegistration] = useState("");
  const [subtraction, setSubtraction] = useState([]);
  const [addition, setAddition] = useState([]);
  const [spell, setSpell] = useState("");
  const [recall, setRecall] = useState("");
  const [subIndex, setSubIndex] = useState(0);
  const [addIndex, setAddIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  const current = data.segments[segment];
  const sub = current.attention.serial_subtraction;
  const add = current.attention.serial_addition;

  function resetSegment() {
    setRegistration("");
    setSubtraction([]);
    setAddition([]);
    setSpell("");
    setRecall("");
    setSubIndex(0);
    setAddIndex(0);
    setPhase("registration");
  }

  function nextSegment(result) {
    const updated = [...answers, result];
    if (segment === data.segments.length - 1) {
      onDone(updated);
    } else {
      setAnswers(updated);
      setSegment(segment + 1);
      resetSegment();
    }
  }

  function finishSegment() {
    nextSegment({
      registration,
      serial_subtraction: subtraction.map(Number),
      serial_addition: addition.map(Number),
      spell_backwards: spell,
      delayed_recall: recall,
    });
  }

  function submitNumber(value, type) {
    if (type === "sub") {
      const next = [...subtraction, Number(value)];
      setSubtraction(next);
      if (next.length >= sub.times) setPhase("addition");
      else setSubIndex(subIndex + 1);
    } else {
      const next = [...addition, Number(value)];
      setAddition(next);
      if (next.length >= add.times) setPhase("spell");
      else setAddIndex(addIndex + 1);
    }
  }

  function NumberTask({ type }) {
    const config = type === "sub" ? sub : add;
    const values = type === "sub" ? subtraction : addition;
    const index = values.length;
    const operation = type === "sub" ? "−" : "+";

    return (
      <div>
        <div className="task-prompt">
          Start with <strong>{config.number}</strong>. {operation === "−" ? "Subtract" : "Add"}{" "}
          <strong>{config[type === "sub" ? "subtract" : "add"]}</strong> each time.
        </div>
        <p className="task-count">Answer {index + 1} of {config.times}</p>
        <input
          className="big-input"
          type="number"
          autoFocus
          onKeyDown={e => {
            if (e.key === "Enter" && e.currentTarget.value !== "") {
              submitNumber(e.currentTarget.value, type);
              e.currentTarget.value = "";
            }
          }}
          placeholder="Type answer and press Enter"
        />
        {values.length > 0 && <div className="answer-history">{values.join("  →  ")}</div>}
      </div>
    );
  }

  return (
    <TestShell
      title={`Memory & Attention — Segment ${segment + 1}`}
      subtitle="Take your time and answer each task as accurately as you can."
      onBack={onBack}
      progress={<Progress current={2} total={5} />}
    >
      {phase === "registration" && (
        <div className="task-center">
          <p>Remember this word:</p>
          <div className="memory-word">{current.registration_word}</div>
          <Button onClick={() => setPhase("subtraction")}>I’m Ready</Button>
        </div>
      )}

      {phase === "subtraction" && <NumberTask type="sub" />}

      {phase === "addition" && <NumberTask type="add" />}

      {phase === "spell" && (
        <div>
          <div className="task-prompt">
            Type <strong>{current.attention.spell_backwards.word}</strong> backwards.
          </div>
          <input
            className="big-input"
            autoFocus
            value={spell}
            onChange={e => setSpell(e.target.value)}
            onKeyDown={e => e.key === "Enter" && spell.trim() && setPhase("recall")}
            placeholder="Type the word backwards"
          />
          <Button onClick={() => spell.trim() && setPhase("recall")}>Continue</Button>
        </div>
      )}

      {phase === "recall" && (
        <div>
          <div className="task-prompt">What was the word you were asked to remember?</div>
          <input
            className="big-input"
            autoFocus
            value={recall}
            onChange={e => setRecall(e.target.value)}
            onKeyDown={e => e.key === "Enter" && finishSegment()}
            placeholder="Type the word"
          />
          <Button onClick={finishSegment}>Finish Segment</Button>
        </div>
      )}
    </TestShell>
  );
}

function Orientation({ questions, onDone, onBack }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = questions[index];

  function choose(option) {
    const next = { ...answers, [q.id]: option };
    if (index === questions.length - 1) onDone(next);
    else {
      setAnswers(next);
      setIndex(index + 1);
    }
  }

  return (
    <TestShell
      title="Orientation"
      subtitle="Select the answer you believe is correct."
      onBack={onBack}
      progress={<Progress current={3} total={5} />}
    >
      <div className="question-count">Question {index + 1} of {questions.length}</div>
      <h3 className="question">{q.question}</h3>
      <div className="option-list">
        {q.options.map(option => (
          <button key={option} className="option-btn" onClick={() => choose(option)}>
            {option}
          </button>
        ))}
      </div>
    </TestShell>
  );
}

function Functional({ data, onDone, onBack }) {
  const [segment, setSegment] = useState(0);
  const [task, setTask] = useState("trail");
  const [trailTaps, setTrailTaps] = useState([]);
  const [order, setOrder] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [seconds, setSeconds] = useState(0);

  const current = data.segments[segment];

  useEffect(() => {
    if (task !== "trail") return;
    const limit = current.trail_making.letters.length * 8;
    setSeconds(limit);
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [segment, task, current.trail_making.letters.length]);

  function tap(letter) {
    if (trailTaps.length < current.trail_making.letters.length) {
      setTrailTaps([...trailTaps, letter]);
    }
  }

  function submitTrail() {
    setTask("sequence");
  }

  function submitSequence() {
    const result = {
      trail_making: { taps: trailTaps },
      sequencing: { order },
    };
    const next = [...answers, result];
    if (segment === data.segments.length - 1) onDone(next);
    else {
      setAnswers(next);
      setSegment(segment + 1);
      setTrailTaps([]);
      setOrder([]);
      setTask("trail");
    }
  }

  const steps = current.sequencing.steps;

  return (
    <TestShell
      title={`Functional Assessment — Segment ${segment + 1}`}
      subtitle="Complete the short interactive tasks."
      onBack={onBack}
      progress={<Progress current={4} total={5} />}
    >
      {task === "trail" && (
        <div>
          <div className="timer">Time remaining: {seconds}s</div>
          <p className="task-prompt">Tap the letters in alphabetical order.</p>
          <div className="letter-grid">
            {current.trail_making.letters.map(letter => (
              <button
                key={letter}
                className={`letter-btn ${trailTaps.includes(letter) ? "selected" : ""}`}
                onClick={() => tap(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
          <p className="tap-sequence">{trailTaps.join(" → ") || "No letters selected yet"}</p>
          <Button onClick={submitTrail}>Continue</Button>
        </div>
      )}

      {task === "sequence" && (
        <div>
          <p className="task-prompt">
            Put the steps of <strong>{current.sequencing.activity_title}</strong> in the correct order.
          </p>
          <div className="sequence-list">
            {steps.map(step => {
              const selected = order.includes(step.id);
              return (
                <button
                  key={step.id}
                  className={`sequence-item ${selected ? "selected" : ""}`}
                  onClick={() =>
                    setOrder(selected ? order.filter(id => id !== step.id) : [...order, step.id])
                  }
                >
                  <span>{selected ? order.indexOf(step.id) + 1 : "○"}</span>
                  {step.text}
                </button>
              );
            })}
          </div>
          <Button
            disabled={order.length !== steps.length}
            onClick={submitSequence}
          >
            {segment === data.segments.length - 1 ? "Finish Functional Assessment" : "Next Segment"}
          </Button>
        </div>
      )}
    </TestShell>
  );
}

function Caretaker({ data, onDone, onBack }) {
  const [symptoms, setSymptoms] = useState({
    forgetfulness: Array(3).fill(null),
    confusion: Array(3).fill(null),
    personality_changes: Array(3).fill(null),
    behavioral_problems: Array(3).fill(null),
  });
  const [headInjury, setHeadInjury] = useState(null);
  const [familyHistory, setFamilyHistory] = useState(null);
  const [adl, setAdl] = useState(Array(5).fill(null));
  const [hours, setHours] = useState("");
  const [wakeups, setWakeups] = useState("");
  const [rested, setRested] = useState(null);
  const [error, setError] = useState("");

  const symptomLabels = {
    forgetfulness: "Forgetfulness",
    confusion: "Confusion",
    personality_changes: "Personality Changes",
    behavioral_problems: "Behavioral Problems",
  };

  const complete =
    Object.values(symptoms).every(arr => arr.every(v => v !== null)) &&
    headInjury !== null && familyHistory !== null &&
    adl.every(v => v !== null) &&
    hours !== "" && wakeups !== "" && rested !== null;

  function setSymptom(type, index, value) {
    setSymptoms(s => ({
      ...s,
      [type]: s[type].map((v, i) => i === index ? value : v),
    }));
  }

  function submit(e) {
    e.preventDefault();
    if (!complete) {
      setError("Please answer every question.");
      return;
    }
    onDone({
      symptoms,
      head_injury: headInjury,
      family_history: familyHistory,
      adl,
      sleep: {
        hours: Number(hours),
        wakeups: Number(wakeups),
        rested,
      },
    });
  }

  return (
    <TestShell
      title="Caretaker Questionnaire"
      subtitle="Answer based on the person's usual recent behavior and abilities."
      onBack={onBack}
      progress={<Progress current={5} total={5} />}
    >
      <form onSubmit={submit}>
        {Object.entries(data.symptoms).map(([type, questions]) => (
          <QuestionGroup
            key={type}
            title={symptomLabels[type]}
            questions={questions}
            values={symptoms[type]}
            onChange={(i, v) => setSymptom(type, i, v)}
          />
        ))}

        <YesNoQuestion
          title={data.head_injury}
          value={headInjury}
          onChange={setHeadInjury}
        />
        <YesNoQuestion
          title={data.family_history}
          value={familyHistory}
          onChange={setFamilyHistory}
        />

        <h3 className="group-title">Daily Activities</h3>
        <p className="group-help">Can they do each activity without help?</p>
        {data.adl.map((item, i) => (
          <YesNoQuestion
            key={item.activity}
            title={item.question}
            value={adl[i]}
            onChange={v => setAdl(a => a.map((x, j) => j === i ? v : x))}
          />
        ))}

        <h3 className="group-title">Sleep</h3>
        <div className="sleep-grid">
          <label>
            {data.sleep.hours}
            <input type="number" min="0" max="24" step="0.5" value={hours} onChange={e => setHours(e.target.value)} />
          </label>
          <label>
            {data.sleep.wakeups}
            <input type="number" min="0" value={wakeups} onChange={e => setWakeups(e.target.value)} />
          </label>
        </div>
        <YesNoQuestion title={data.sleep.rested} value={rested} onChange={setRested} />

        {error && <ErrorBox>{error}</ErrorBox>}
        <Button disabled={!complete}>Submit Screening</Button>
      </form>
    </TestShell>
  );
}

function QuestionGroup({ title, questions, values, onChange }) {
  return (
    <div className="question-group">
      <h3 className="group-title">{title}</h3>
      {questions.map((q, i) => (
        <YesNoQuestion key={q} title={q} value={values[i]} onChange={v => onChange(i, v)} />
      ))}
    </div>
  );
}

function YesNoQuestion({ title, value, onChange }) {
  return (
    <div className="yesno-row">
      <span>{title}</span>
      <div className="yesno">
        <button
          type="button"
          className={value === true ? "active" : ""}
          onClick={() => onChange(true)}
        >Yes</button>
        <button
          type="button"
          className={value === false ? "active" : ""}
          onClick={() => onChange(false)}
        >No</button>
      </div>
    </div>
  );
}

function Result({ result, onRestart }) {
  const risk = Number(result.risk_percentage);
  const label = risk < 30 ? "Lower estimated risk" : risk < 60 ? "Moderate estimated risk" : "Higher estimated risk";

  return (
    <main className="page result-page">
      <section className="result-card">
        <div className="result-icon">✓</div>
        <p className="result-kicker">Screening Complete</p>
        <h1>Estimated Risk</h1>
        <div className="risk-number">{risk.toFixed(2)}<span>%</span></div>
        <h2>{label}</h2>
        <p>
          This percentage is the model's estimated risk based on the information
          and screening responses provided. It is a screening result, not a diagnosis.
        </p>
        <Button onClick={onRestart}>Start New Screening</Button>
      </section>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [test, setTest] = useState(null);
  const [mmse, setMmse] = useState(null);
  const [orientation, setOrientation] = useState(null);
  const [functional, setFunctional] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function start() {
    setError("");
    setScreen("intake");
  }

  function restart() {
    setTest(null);
    setMmse(null);
    setOrientation(null);
    setFunctional(null);
    setResult(null);
    setError("");
    setScreen("home");
  }

  async function submitCaretaker(caretaker) {
    try {
      setError("");
      const response = await post("/submit-test", {
        session_id: test.session_id,
        mmse,
        orientation,
        functional_assessment: functional,
        caretaker,
      });
      setResult(response);
      setScreen("result");
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && screen !== "result") {
    return (
      <div className="app">
        <Header />
        <main className="page">
          <ErrorBox>{error}</ErrorBox>
          <Button onClick={restart}>Return Home</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      {screen === "home" && <Home onStart={start} />}

      {screen === "intake" && (
        <Intake
          onBack={() => setScreen("home")}
          onComplete={t => {
            setTest(t);
            setScreen("mmse");
          }}
        />
      )}

      {screen === "mmse" && (
        <MMSE
          data={test.mmse}
          onBack={() => setScreen("intake")}
          onDone={a => {
            setMmse(a);
            setScreen("orientation");
          }}
        />
      )}

      {screen === "orientation" && (
        <Orientation
          questions={test.orientation}
          onBack={() => setScreen("mmse")}
          onDone={a => {
            setOrientation(a);
            setScreen("functional");
          }}
        />
      )}

      {screen === "functional" && (
        <Functional
          data={test.functional_assessment}
          onBack={() => setScreen("orientation")}
          onDone={a => {
            setFunctional(a);
            setScreen("caretaker");
          }}
        />
      )}

      {screen === "caretaker" && (
        <Caretaker
          data={test.caretaker}
          onBack={() => setScreen("functional")}
          onDone={submitCaretaker}
        />
      )}

      {screen === "result" && <Result result={result} onRestart={restart} />}
    </div>
  );
}
