import { useEffect, useState } from "react";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("prediction");
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [gameId, setGameId] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const [form, setForm] = useState({
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    over: "",
    innings: "",
    correctOption: null
  });

  // ✅ FETCH QUESTIONS
  const fetchQuestions = async (type, id = "") => {
    try {
      const gid = id || "3f17c641-77d5-4f22-a4bd-c2773c3de704";

      const res = await fetch(
        `https://tableplay-319702317581.asia-south1.run.app/v1/questions/?gameId=${gid}&questionType=${type}`
      );

      const result = await res.json();
      const data = result.data || result;

      const formatted = data.map((q) => ({
        question: q.question,
        option1: q.option1 || "",
        option2: q.option2 || "",
        option3: q.option3 || "",
        option4: q.option4 || "",
        correctOption: Number(q.correctOption),
        over: Number(q.overNumber),
        innings: Number(q.innings)
      }));

      setQuestions(formatted);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch questions");
    }
  };

  useEffect(() => {
    if (screen === "sample") {
      fetchQuestions(mode);
    }
  }, [mode, screen]);

  // 🔍 SEARCH
  const filteredQuestions = questions.filter((q) => {
    const text = search.toLowerCase();
    return (
      q.question?.toLowerCase().includes(text) ||
      q.option1?.toLowerCase().includes(text) ||
      q.option2?.toLowerCase().includes(text) ||
      q.option3?.toLowerCase().includes(text) ||
      q.option4?.toLowerCase().includes(text)
    );
  });

  const handleAdd = () => {
    setEditingIndex("new");
    setForm({
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      over: "",
      innings: "",
      correctOption: null
    });
  };

  const handleEdit = (q, index) => {
    setEditingIndex(index);
    setForm({
      ...q,
      correctOption: Number(q.correctOption),
      over: Number(q.over),
      innings: Number(q.innings)
    });
  };

  const handleSave = () => {
    if (!form.question.trim()) return alert("Question required");

    if (!form.correctOption) return alert("Select correct option");

    if (!form.over) return alert("Select over");

    if (!form.innings) return alert("Select innings");

    const updated =
      editingIndex === "new"
        ? [{ ...form, id: Date.now() }, ...questions]
        : questions.map((q, i) => (i === editingIndex ? form : q));

    setQuestions(updated);
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    if (!window.confirm("Delete this question?")) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // 🟢 HOME
  if (screen === "home") {
    return (
      <div className="app-container">
        <div className="header">
          <h1 className="logo-text">phield</h1>
          <p className="subtitle">Choose Mode</p>
        </div>

        <div className="card">
          <button
            className="btn-success"
            onClick={() => setScreen("sample")}
          >
            📦 Sample Questions
          </button>
        </div>

        <div className="card">
          <button
            className="btn-primary"
            onClick={() => setScreen("match")}
          >
            🎮 Match-wise Questions
          </button>
        </div>
      </div>
    );
  }

  // 🟡 MATCH SETUP
  if (screen === "match" && !gameId) {
    return (
      <div className="app-container">
        <div className="header">
          <h1 className="logo-text">Select Match</h1>
        </div>

        <input
          className="input"
          placeholder="Enter Game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
        />

        <button
          className="btn-success"
          onClick={() => {
            if (!gameId) return alert("Enter Game ID");
            fetchQuestions(mode, gameId);
          }}
        >
          Load Match
        </button>
      </div>
    );
  }

  // 🟢 MAIN
  return (
    <div className="app-container">
      <div className="header">
        <h1 className="logo-text">phield</h1>

        <button className="btn-success" onClick={handleAdd}>
          + Add Question
        </button>

        <button
          className="btn-secondary"
          onClick={() => {
            setScreen("home");
            setGameId("");
          }}
        >
          ⬅ Back
        </button>
      </div>

      {/* SEARCH */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* TOGGLE */}
      <div className="toggle">
        <button
          className={`btn-primary ${mode === "prediction" ? "active" : ""}`}
          onClick={() => setMode("prediction")}
        >
          🎯 Over
        </button>

        <button
          className={`btn-primary ${mode === "trivia" ? "active" : ""}`}
          onClick={() => setMode("trivia")}
        >
          🧠 Timeout
        </button>
      </div>

      {/* QUESTIONS */}
      {filteredQuestions.map((q, index) => {
        const isEditing = editingIndex === index;

        return (
          <div key={index} className="card">
            {isEditing ? (
              <>
                <input
                  className="input"
                  value={form.question}
                  onChange={(e) =>
                    setForm({ ...form, question: e.target.value })
                  }
                />

                {[1, 2, 3, 4].map((num) => (
                  <input
                    key={num}
                    className="input"
                    placeholder={`option${num}`}
                    value={form[`option${num}`] || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [`option${num}`]: e.target.value
                      })
                    }
                  />
                ))}

                {/* ✅ CORRECT OPTION */}
                <div style={{ marginBottom: 10 }}>
                  <p>Select Correct Option:</p>
                  {[1, 2, 3, 4].map((num) => (
                    <label key={num} style={{ marginRight: 10 }}>
                      <input
                        type="radio"
                        value={num}
                        checked={form.correctOption === num}
                        onChange={() =>
                          setForm({ ...form, correctOption: num })
                        }
                      />
                      {` ${num}`}
                    </label>
                  ))}
                </div>

                {/* OVER */}
                <select
                  className="input"
                  value={form.over || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      over: Number(e.target.value)
                    })
                  }
                >
                  <option value="">Select Over</option>
                  {[...Array(20)].map((_, i) => (
                    <option key={i} value={i + 1}>
                      Over {i + 1}
                    </option>
                  ))}
                </select>

                {/* INNINGS */}
                <select
                  className="input"
                  value={form.innings || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      innings: Number(e.target.value)
                    })
                  }
                >
                  <option value="">Select Innings</option>
                  <option value={1}>1st Innings</option>
                  <option value={2}>2nd Innings</option>
                </select>

                <div className="btn-row">
                  <button className="btn-success" onClick={handleSave}>
                    Save
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setEditingIndex(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="question">{q.question}</h2>

                <div className="options">
                  {[q.option1, q.option2, q.option3, q.option4]
                    .filter(Boolean)
                    .map((opt, i) => (
                      <div key={i}>
                        • {opt}{" "}
                        {q.correctOption === i + 1 ? "✅" : ""}
                      </div>
                    ))}
                </div>

                <p style={{ marginTop: 10 }}>
                  Innings: {q.innings || "-"} | Over: {q.over || "-"}
                </p>

                <div className="btn-row center">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(q, index)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}