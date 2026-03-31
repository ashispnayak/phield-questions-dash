import { useEffect, useState } from "react";

const SAMPLE_GAME_ID = "3f17c641-77d5-4f22-a4bd-c2773c3de704";
const BASE_URL = "https://tableplay-319702317581.asia-south1.run.app/v1";

// ─── EXTRACTED QUESTION FORM ───────────────────────────────────────────────
const QuestionForm = ({ form, setForm, onSave, onCancel }) => (
  <>
    {/* NEW: Question Type Selector */}
    <select
      className="input"
      style={{ fontWeight: "bold", color: "#60a5fa" }}
      value={form.questionType}
      onChange={(e) => setForm({ ...form, questionType: e.target.value })}
    >
      <option value="PREDICTION">Prediction (Over)</option>
      <option value="TRIVIA">Trivia (Timeout)</option>
    </select>

    <input
      className="input"
      placeholder="Question"
      value={form.question}
      onChange={(e) => setForm({ ...form, question: e.target.value })}
    />

    {[1, 2, 3, 4].map((num) => (
      <input
        key={num}
        className="input"
        placeholder={`Option ${num}`}
        value={form[`option${num}`] || ""}
        onChange={(e) =>
          setForm({ ...form, [`option${num}`]: e.target.value })
        }
      />
    ))}

    <div className="correct-option-row">
      <p className="correct-option-label">Correct Option:</p>
      <div className="radio-group">
        {[1, 2, 3, 4].map((num) => (
          <label key={num} className="radio-label">
            <input
              type="radio"
              checked={form.correctOption === num}
              onChange={() => setForm({ ...form, correctOption: num })}
            />
            {num}
          </label>
        ))}
        <button 
          className="btn-danger" 
          style={{marginLeft: "10px", padding: "2px 6px", fontSize: "12px"}}
          onClick={() => setForm({ ...form, correctOption: null })}
        >
          Clear
        </button>
      </div>
    </div>

    <select
      className="input"
      value={form.over || ""}
      onChange={(e) => setForm({ ...form, over: Number(e.target.value) })}
    >
      <option value="">Select Over</option>
      {[...Array(20)].map((_, i) => (
        <option key={i} value={i + 1}>
          Over {i + 1}
        </option>
      ))}
    </select>

    <select
      className="input"
      value={form.innings || ""}
      onChange={(e) => setForm({ ...form, innings: Number(e.target.value) })}
    >
      <option value="">Select Innings</option>
      <option value={1}>1st Innings</option>
      <option value={2}>2nd Innings</option>
    </select>

    <div className="btn-row">
      <button className="btn-success" onClick={onSave}>
        Save
      </button>
      <button className="btn-secondary" onClick={onCancel}>
        Cancel
      </button>
    </div>
  </>
);

export default function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("prediction"); 
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [gameId, setGameId] = useState("");
  
  const [editingId, setEditingId] = useState(null); 
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  const [addToMatchId, setAddToMatchId] = useState(null);
  const [addToMatchGameId, setAddToMatchGameId] = useState("");
  const [addToMatchLoading, setAddToMatchLoading] = useState(false);

  const [form, setForm] = useState({
    id: null,
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    over: "",
    innings: "",
    correctOption: null,
    questionType: "PREDICTION", // New state field
  });

  // ─── FETCH GAMES ──────────────────────────────────────────────────────────
  const fetchGames = async () => {
    try {
      const res = await fetch(`${BASE_URL}/games/`);
      const result = await res.json();
      const data = result.data || result;
      setGames(
        data
          .filter((g) => g.id !== SAMPLE_GAME_ID)
          .map((g) => ({ id: g.id, name: g.name }))
      );
    } catch (err) {
      console.error("fetchGames error:", err);
    }
  };

  // ─── FETCH QUESTIONS ──────────────────────────────────────────────────────
  const fetchQuestions = async (type, id = "") => {
    setLoading(true);
    try {
      const gid = id || SAMPLE_GAME_ID;
      const res = await fetch(
        `${BASE_URL}/questions/?gameId=${gid}&questionType=${type}`
      );
      const result = await res.json();
      const data = result.data || result;

      setQuestions(
        data.map((q) => ({
          id: q.id,
          question: q.question,
          option1: q.option1 || "",
          option2: q.option2 || "",
          option3: q.option3 || "",
          option4: q.option4 || "",
          correctOption: q.correctOption ? Number(q.correctOption) : null,
          over: Number(q.overNumber),
          innings: Number(q.innings),
          // Store the actual type from the DB so it maps correctly when editing
          questionType: q.questionType?.toUpperCase() || "PREDICTION", 
        }))
      );
    } catch (err) {
      console.error("fetchQuestions error:", err);
      alert("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  };

  // FIX: Fetch games once on initial load so they are always ready for "Add to match"
  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (screen === "sample") {
      fetchQuestions(mode);
    }
    if (screen === "match" && gameId) {
      fetchQuestions(mode, gameId);
    }
  }, [mode, screen, gameId]);

  // ─── SEARCH ───────────────────────────────────────────────────────────────
  const filteredQuestions = questions.filter((q) => {
    const text = search.toLowerCase();
    return (
      (q.question || "").toLowerCase().includes(text) ||
      (q.option1 || "").toLowerCase().includes(text) ||
      (q.option2 || "").toLowerCase().includes(text) ||
      (q.option3 || "").toLowerCase().includes(text) ||
      (q.option4 || "").toLowerCase().includes(text)
    );
  });

  // ─── ADD ──────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setEditingId("new");
    setForm({
      id: null,
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: "",
      over: "",
      innings: "",
      correctOption: null,
      // Default to the current tab you are looking at
      questionType: mode.toUpperCase(), 
    });
  };

  // ─── EDIT ─────────────────────────────────────────────────────────────────
  const handleEdit = (q) => {
    setEditingId(q.id); 
    setForm({ ...q });
  };

  // ─── SAVE (POST / PUT) ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.question.trim()) return alert("Question is required");
    if (!form.over) return alert("Please select an over");
    if (!form.innings) return alert("Please select innings");

    const finalCorrectOption = form.correctOption ? form.correctOption : null;

    try {
      if (editingId === "new") {
        // POST API: Using exactly the schema you provided
        const res = await fetch(`${BASE_URL}/questions/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: form.question, // Updated to "question" per your schema
            overNumber: form.over,
            options: [form.option1, form.option2, form.option3, form.option4].filter(Boolean),
            gameId: gameId || SAMPLE_GAME_ID,
            innings: form.innings,
            questionType: form.questionType, // Sends the value selected in the dropdown
            correctOption: finalCorrectOption,
          }),
        });
        if (!res.ok) throw new Error("POST failed");
      } else {
        // PUT API
        const res = await fetch(`${BASE_URL}/questions/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: form.question,
            option1: form.option1,
            option2: form.option2,
            option3: form.option3,
            option4: form.option4,
            overNumber: form.over,
            gameId: gameId || SAMPLE_GAME_ID,
            innings: form.innings,
            questionType: form.questionType, // Sends the value selected in the dropdown
            correctOption: finalCorrectOption,
          }),
        });
        if (!res.ok) throw new Error("PUT failed");
      }

      await fetchQuestions(mode, gameId);
      setEditingId(null);
    } catch (err) {
      console.error("handleSave error:", err);
      alert("Failed to save question");
    }
  };

  // ─── DELETE ───────────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    if (!window.confirm("Delete this question?")) return;
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // ─── ADD TO MATCH ─────────────────────────────────────────────────────────
  const handleAddToMatch = async (q) => {
    if (!addToMatchGameId) return alert("Please select a match");
    setAddToMatchLoading(true);
    
    const finalCorrectOption = q.correctOption ? q.correctOption : null;

    try {
      const res = await fetch(`${BASE_URL}/questions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question, // Updated to "question" per your schema
          overNumber: q.over,
          options: [q.option1, q.option2, q.option3, q.option4].filter(Boolean),
          gameId: addToMatchGameId,
          innings: q.innings,
          questionType: q.questionType, // Preserves the original type 
          correctOption: finalCorrectOption,
        }),
      });
      if (!res.ok) throw new Error("POST failed");
      alert("Question added to match!");
      setAddToMatchId(null);
      setAddToMatchGameId("");
    } catch (err) {
      console.error("handleAddToMatch error:", err);
      alert("Failed to add question to match");
    } finally {
      setAddToMatchLoading(false);
    }
  };

  // ─── HOME ─────────────────────────────────────────────────────────────────
  if (screen === "home") {
    return (
      <div className="app-container">
        <div className="header">
          <h1 className="logo-text">phield</h1>
          <p className="subtitle">Question Management</p>
        </div>

        <div className="card">
          <p className="card-label">Sample Questions</p>
          <p className="card-desc">Browse and manage the default question bank</p>
          <button className="btn-success full-width" onClick={() => setScreen("sample")}>
            📦 Sample Questions
          </button>
        </div>

        <div className="card">
          <p className="card-label">Match Questions</p>
          <p className="card-desc">Select a live match and manage its questions</p>
          <button
            className="btn-primary full-width"
            onClick={() => {
              setGameId("");
              setScreen("match");
            }}
          >
            🎮 Match-wise Questions
          </button>
        </div>
      </div>
    );
  }

  // ─── MATCH — game picker ───────────────────────────────────────────────────
  if (screen === "match" && !gameId) {
    return (
      <div className="app-container">
        <div className="header">
          <h1 className="logo-text">Select Match</h1>
          <button
            className="btn-secondary"
            onClick={() => setScreen("home")}
          >
            ⬅ Back
          </button>
        </div>

        {games.length === 0 ? (
          <div className="card">
            <p style={{ color: "#94a3b8", textAlign: "center" }}>
              Loading matches…
            </p>
          </div>
        ) : (
          <div className="game-list">
            {games.map((g) => (
              <button
                key={g.id}
                className="game-item"
                onClick={() => setGameId(g.id)}
              >
                <span className="game-name">{g.name}</span>
                <span className="game-arrow">→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── MAIN VIEW ────────────────────────────────────────────────────────────
  const isSample = screen === "sample";
  const currentGameName = games.find((g) => g.id === gameId)?.name || "";

  return (
    <div className="app-container">
      <div className="header">
        <div>
          <h1 className="logo-text">phield</h1>
          {!isSample && currentGameName && (
            <p className="subtitle">{currentGameName}</p>
          )}
        </div>

        <div className="header-actions">
          <button className="btn-success" onClick={handleAdd}>
            + Add Question
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setScreen("home");
              setGameId("");
              setEditingId(null);
              setQuestions([]);
            }}
          >
            ⬅ Back
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* MODE TOGGLE */}
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

      {/* ADD FORM */}
      {editingId === "new" && (
        <div className="card">
          <p className="section-title">New Question</p>
          <QuestionForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="card" style={{ textAlign: "center", color: "#94a3b8" }}>
          Loading questions…
        </div>
      )}

      {/* QUESTIONS LIST */}
      {!loading && filteredQuestions.length === 0 && editingId !== "new" && (
        <div className="card" style={{ textAlign: "center", color: "#94a3b8" }}>
          No questions found.
        </div>
      )}

      {filteredQuestions.map((q) => {
        const isEditing = editingId === q.id;
        const isAddingToMatch = addToMatchId === q.id;

        return (
          <div key={q.id} className="card">
            {isEditing ? (
              <>
                <p className="section-title">Edit Question</p>
                <QuestionForm
                  form={form}
                  setForm={setForm}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                />
              </>
            ) : (
              <>
                <h2 className="question">{q.question}</h2>

                <div className="options">
                  {[q.option1, q.option2, q.option3, q.option4]
                    .filter(Boolean)
                    .map((opt, i) => (
                      <div
                        key={i}
                        className={`option-item ${
                          q.correctOption === i + 1 ? "correct" : ""
                        }`}
                      >
                        <span className="option-bullet">{i + 1}.</span> {opt}
                        {q.correctOption === i + 1 && (
                          <span className="correct-badge">✅</span>
                        )}
                      </div>
                    ))}
                </div>

                <p className="meta">
                  Innings: {q.innings || "—"} &nbsp;|&nbsp; Over:{" "}
                  {q.over || "—"}
                </p>

                <div className="btn-row center">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(q)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(q.id)}
                  >
                    Delete
                  </button>

                  {/* Add to Match */}
                  {isSample && (
                    <button
                      className="btn-add-match"
                      onClick={() => {
                        setAddToMatchId(isAddingToMatch ? null : q.id);
                        setAddToMatchGameId("");
                      }}
                    >
                      {isAddingToMatch ? "✕ Cancel" : "➕ Add to Match"}
                    </button>
                  )}
                </div>

                {/* Add-to-match dropdown */}
                {isSample && isAddingToMatch && (
                  <div className="add-to-match-panel">
                    <p className="add-to-match-label">Select a match:</p>

                    {games.length === 0 ? (
                      <p style={{ color: "#94a3b8", fontSize: 13 }}>
                        Loading matches…
                      </p>
                    ) : (
                      <select
                        className="input"
                        value={addToMatchGameId}
                        onChange={(e) => setAddToMatchGameId(e.target.value)}
                      >
                        <option value="">— choose match —</option>
                        {games.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      className="btn-success"
                      disabled={!addToMatchGameId || addToMatchLoading}
                      onClick={() => handleAddToMatch(q)}
                      style={{ marginTop: 8 }}
                    >
                      {addToMatchLoading ? "Adding…" : "Confirm Add"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}