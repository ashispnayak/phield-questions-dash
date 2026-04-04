import { useEffect, useState } from "react";

const SAMPLE_GAME_ID = "3f17c641-77d5-4f22-a4bd-c2773c3de704";
const BASE_URL = "https://tableplay-319702317581.asia-south1.run.app/v1";

// ─── EXTRACTED QUESTION FORM ───────────────────────────────────────────────
const QuestionForm = ({ form, setForm, onSave, onCancel }) => (
  <div className="form-container">
    <div className="form-group row-group">
      <select
        className="input select-accent"
        value={form.questionType}
        onChange={(e) => setForm({ ...form, questionType: e.target.value })}
      >
        <option value="PREDICTION">🎯 Prediction (Over)</option>
        <option value="TRIVIA">🧠 Trivia (Timeout)</option>
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
    </div>

    <div className="form-group">
      <input
        className="input input-large"
        placeholder="What is your question?"
        value={form.question}
        onChange={(e) => setForm({ ...form, question: e.target.value })}
      />
    </div>

    <div className="options-grid">
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
    </div>

    <div className="correct-option-wrapper">
      <p className="correct-option-label">Select Correct Option:</p>
      <div className="pill-group">
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            className={`option-pill ${form.correctOption === num ? "active" : ""}`}
            onClick={() => setForm({ ...form, correctOption: num })}
          >
            Option {num}
          </button>
        ))}
        <button 
          className="btn-clear-pill" 
          onClick={() => setForm({ ...form, correctOption: null })}
        >
          Clear
        </button>
      </div>
    </div>

    <div className="btn-row form-actions">
      <button className="btn-success" onClick={onSave}>
        Save Question
      </button>
      <button className="btn-secondary" onClick={onCancel}>
        Cancel
      </button>
    </div>
  </div>
);

export default function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("prediction"); 
  const [inningsFilter, setInningsFilter] = useState("ALL"); 
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [gameId, setGameId] = useState("");
  
  const [editingId, setEditingId] = useState(null); 
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false); 

  const [addToMatchId, setAddToMatchId] = useState(null);
  const [addToMatchGameId, setAddToMatchGameId] = useState("");
  const [addToMatchLoading, setAddToMatchLoading] = useState(false);

  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [newMatchName, setNewMatchName] = useState("");
  const [newMatchSportsMonkId, setNewMatchSportsMonkId] = useState("");
  const [addingMatchLoading, setAddingMatchLoading] = useState(false);

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
    questionType: "PREDICTION",
  });

  // ─── FETCH GAMES ──────────────────────────────────────────────────────────
  const fetchGames = async () => {
    try {
      const res = await fetch(`${BASE_URL}/games/`);
      const result = await res.json();
      const data = result.data || result;
      
      setGames(
        data
          .map((g) => ({ 
            id: g.id || g.gameId || g._id, 
            name: g.name || g.gameName || g.title,
            code: g.code || g.gameCode,
            isActive: g.isActive !== false 
          }))
          .filter((g) => g.id && g.id !== SAMPLE_GAME_ID)
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
        data
          // NEW: Filter out soft-deleted questions before mapping
          .filter((q) => q.isDeleted !== true)
          .map((q) => ({
            id: q.id,
            question: q.question,
            option1: q.option1 || "",
            option2: q.option2 || "",
            option3: q.option3 || "",
            option4: q.option4 || "",
            correctOption: q.correctOption !== null ? Number(q.correctOption) + 1 : null,
            over: Number(q.overNumber),
            innings: Number(q.innings),
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

  // ─── SEARCH, FILTER & SORT ────────────────────────────────────────────────
  const filteredQuestions = questions
    .filter((q) => {
      const textMatch = 
        (q.question || "").toLowerCase().includes(search.toLowerCase()) ||
        (q.option1 || "").toLowerCase().includes(search.toLowerCase()) ||
        (q.option2 || "").toLowerCase().includes(search.toLowerCase()) ||
        (q.option3 || "").toLowerCase().includes(search.toLowerCase()) ||
        (q.option4 || "").toLowerCase().includes(search.toLowerCase());
      
      const inningsMatch = inningsFilter === "ALL" || q.innings === inningsFilter;

      return textMatch && inningsMatch;
    })
    .sort((a, b) => (a.over || 0) - (b.over || 0));

  // ─── TOGGLE MATCH STATUS ──────────────────────────────────────────────────
  const handleToggleMatchStatus = async () => {
    const currentGame = games.find((g) => g.id === gameId);
    if (!currentGame) return;

    const newStatus = !currentGame.isActive;
    setStatusLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to toggle match status");

      setGames((prevGames) => 
        prevGames.map(g => g.id === gameId ? { ...g, isActive: newStatus } : g)
      );
    } catch (err) {
      console.error("handleToggleMatchStatus error:", err);
      alert("Failed to update match status");
    } finally {
      setStatusLoading(false);
    }
  };

  // ─── ADD MATCH ────────────────────────────────────────────────────────────
  const handleAddMatch = async () => {
    if (!newMatchName.trim()) return alert("Match name is required.");
    if (!newMatchSportsMonkId.trim()) return alert("Sportsmonk ID is required.");
    
    setAddingMatchLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/games/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newMatchName.trim(),
          sportsMonkId: parseInt(newMatchSportsMonkId, 10)
        }),
      });
      if (!res.ok) throw new Error("Failed to add match");
      
      alert("Match added successfully!");
      setNewMatchName("");
      setNewMatchSportsMonkId("");
      setIsAddingMatch(false);
      await fetchGames(); 
    } catch (err) {
      console.error("handleAddMatch error:", err);
      alert("Failed to create match");
    } finally {
      setAddingMatchLoading(false);
    }
  };

  // ─── ADD QUESTION ──────────────────────────────────────────────────────────
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
      questionType: mode.toUpperCase(), 
    });
  };

  // ─── EDIT QUESTION ─────────────────────────────────────────────────────────
  const handleEdit = (q) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setEditingId(q.id); 
    setForm({ ...q });
  };

  // ─── SAVE QUESTION (POST / PUT) ───────────────────────────────────────────
  const handleSave = async () => {
    if (!form.question.trim()) return alert("Question is required");
    if (!form.over) return alert("Please select an over");
    if (!form.innings) return alert("Please select innings");

    const finalCorrectOption = form.correctOption !== null ? form.correctOption - 1 : null;

    try {
      if (editingId === "new") {
        const res = await fetch(`${BASE_URL}/questions/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: form.question, 
            overNumber: form.over,
            options: [form.option1, form.option2, form.option3, form.option4].filter(Boolean),
            gameId: gameId || SAMPLE_GAME_ID,
            innings: form.innings,
            questionType: form.questionType, 
            correctOption: finalCorrectOption,
          }),
        });
        if (!res.ok) throw new Error("POST failed");
      } else {
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
            questionType: form.questionType, 
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

  // ─── DELETE QUESTION ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    
    try {
      const res = await fetch(`${BASE_URL}/questions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      
      setQuestions(questions.filter((q) => q.id !== id));
    } catch (err) {
      console.error("handleDelete error:", err);
      alert("Failed to delete question from server");
    }
  };

  // ─── ADD TO MATCH ─────────────────────────────────────────────────────────
  const handleAddToMatch = async (q) => {
    if (!addToMatchGameId) return alert("Please select a match");
    setAddToMatchLoading(true);
    
    const finalCorrectOption = q.correctOption !== null ? q.correctOption - 1 : null;

    try {
      const res = await fetch(`${BASE_URL}/questions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question, 
          overNumber: q.over,
          options: [q.option1, q.option2, q.option3, q.option4].filter(Boolean),
          gameId: addToMatchGameId, 
          innings: q.innings,
          questionType: q.questionType, 
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
        <div className="header hero-header">
          <div className="logo-badge">P</div>
          <h1 className="logo-text">phield</h1>
          <p className="subtitle">Admin Control Center</p>
        </div>

        <div className="nav-cards">
          <div className="nav-card" onClick={() => setScreen("sample")}>
            <div className="nav-icon">📦</div>
            <div className="nav-content">
              <h3>Sample Questions</h3>
              <p>Browse and manage the default global question bank</p>
            </div>
            <div className="nav-arrow">→</div>
          </div>

          <div className="nav-card" onClick={() => {
              setGameId("");
              setScreen("match");
            }}>
            <div className="nav-icon">🎮</div>
            <div className="nav-content">
              <h3>Live Matches</h3>
              <p>Select a match and manage its specific questions</p>
            </div>
            <div className="nav-arrow">→</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MATCH — GAME PICKER ──────────────────────────────────────────────────
  if (screen === "match" && !gameId) {
    return (
      <div className="app-container">
        <div className="header inline-header">
          <div className="header-titles">
            <h1 className="logo-text small">Select Match</h1>
          </div>
          <button
            className="btn-outline"
            onClick={() => {
              setScreen("home");
              setIsAddingMatch(false);
            }}
          >
            ⬅ Back
          </button>
        </div>

        <div className="card highlight-card">
          {!isAddingMatch ? (
            <button 
              className="btn-success full-width" 
              onClick={() => setIsAddingMatch(true)}
            >
              <span className="icon">➕</span> Create New Match
            </button>
          ) : (
            <div className="create-match-form">
              <h3 className="section-title" style={{marginTop: 0}}>Create Match</h3>
              <div className="input-group">
                <label>Match Name</label>
                <input
                  className="input"
                  placeholder="e.g., India vs Australia"
                  value={newMatchName}
                  onChange={(e) => setNewMatchName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-group">
                <label>Sportsmonk ID</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g., 12345"
                  value={newMatchSportsMonkId}
                  onChange={(e) => setNewMatchSportsMonkId(e.target.value)}
                />
              </div>

              <div className="btn-row">
                <button
                  className="btn-success"
                  onClick={handleAddMatch}
                  disabled={addingMatchLoading}
                >
                  {addingMatchLoading ? "Saving..." : "Save Match"}
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setIsAddingMatch(false);
                    setNewMatchName("");
                    setNewMatchSportsMonkId("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {games.length === 0 ? (
          <div className="empty-state">
            <div className="loader"></div>
            <p>Loading matches…</p>
          </div>
        ) : (
          <div className="game-grid">
            {games.map((g) => (
              <button
                key={g.id}
                className="game-item"
                onClick={() => setGameId(g.id)}
              >
                <div className="game-details">
                  <span className="game-name">{g.name}</span>
                  {g.code && <span className="game-code">#{g.code}</span>}
                  <span className={`status-dot ${g.isActive !== false ? 'active' : 'expired'}`}></span>
                </div>
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
  const currentGame = games.find((g) => g.id === gameId);
  const currentGameName = currentGame?.name || "";
  const currentGameCode = currentGame?.code || "";

  return (
    <div className="app-container">
      <div className="header inline-header">
        <div className="header-titles">
          <h1 className="logo-text small">phield</h1>
          {!isSample && currentGameName && (
            <div className="match-badges">
              <span className="badge badge-primary">{currentGameName}</span>
              {currentGameCode && <span className="badge badge-secondary">ID: {currentGameCode}</span>}
            </div>
          )}
          {isSample && <span className="badge badge-primary">Sample Bank</span>}
        </div>

        <div className="header-actions">
          {!isSample && currentGame && (
            <button
              className={`btn-status ${currentGame.isActive === false ? 'expired' : 'active'}`}
              onClick={handleToggleMatchStatus}
              disabled={statusLoading}
              title="Click to toggle match activity status"
            >
              {statusLoading ? "..." : (currentGame.isActive === false ? "🔴 Expired" : "🟢 Active")}
            </button>
          )}
          
          <button className="btn-primary" onClick={handleAdd}>
            <span className="icon">➕</span> Add Question
          </button>
          <button
            className="btn-outline"
            onClick={() => {
              setScreen("home");
              setGameId("");
              setEditingId(null);
              setQuestions([]);
              setInningsFilter("ALL"); 
            }}
          >
            ⬅ Back
          </button>
        </div>
      </div>

      <div className="controls-bar">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls-wrapper">
          <div className="toggle-group">
            <button
              className={`toggle-btn ${inningsFilter === "ALL" ? "active" : ""}`}
              onClick={() => setInningsFilter("ALL")}
            >
              All
            </button>
            <button
              className={`toggle-btn ${inningsFilter === 1 ? "active" : ""}`}
              onClick={() => setInningsFilter(1)}
            >
              1st Inn
            </button>
            <button
              className={`toggle-btn ${inningsFilter === 2 ? "active" : ""}`}
              onClick={() => setInningsFilter(2)}
            >
              2nd Inn
            </button>
          </div>

          <div className="toggle-group">
            <button
              className={`toggle-btn ${mode === "prediction" ? "active" : ""}`}
              onClick={() => setMode("prediction")}
            >
              🎯 Over
            </button>
            <button
              className={`toggle-btn ${mode === "trivia" ? "active" : ""}`}
              onClick={() => setMode("trivia")}
            >
              🧠 Timeout
            </button>
          </div>
        </div>
      </div>

      {editingId === "new" && (
        <div className="card form-card slide-down">
          <h2 className="section-title">Create New Question</h2>
          <QuestionForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {loading && (
        <div className="empty-state">
          <div className="loader"></div>
          <p>Loading questions…</p>
        </div>
      )}

      {!loading && filteredQuestions.length === 0 && editingId !== "new" && (
        <div className="empty-state">
          <p className="empty-icon">📭</p>
          <h3>No questions found</h3>
          <p>Try adjusting your search or add a new question.</p>
        </div>
      )}

      <div className="questions-list">
        {filteredQuestions.map((q) => {
          const isEditing = editingId === q.id;
          const isAddingToMatch = addToMatchId === q.id;

          return (
            <div key={q.id} className={`card question-card ${isEditing ? "editing" : ""}`}>
              {isEditing ? (
                <>
                  <h2 className="section-title">Edit Question</h2>
                  <QuestionForm
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                  />
                </>
              ) : (
                <>
                  <div className="card-header">
                    <div className="meta-tags">
                      <span className="tag">Innings {q.innings || "—"}</span>
                      <span className="tag tag-accent">Over {q.over || "—"}</span>
                    </div>
                  </div>

                  <h3 className="question-text">{q.question}</h3>

                  <div className="options-layout">
                    {[q.option1, q.option2, q.option3, q.option4]
                      .filter(Boolean)
                      .map((opt, i) => (
                        <div
                          key={i}
                          className={`option-display ${
                            q.correctOption === i + 1 ? "is-correct" : ""
                          }`}
                        >
                          <span className="option-letter">{String.fromCharCode(65 + i)}</span> 
                          <span className="option-value">{opt}</span>
                          {q.correctOption === i + 1 && (
                            <span className="check-icon">✓</span>
                          )}
                        </div>
                      ))}
                  </div>

                  <div className="card-footer">
                    <div className="action-buttons">
                      <button className="btn-icon edit" onClick={() => handleEdit(q)}>
                        ✏️ Edit
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(q.id)}>
                        🗑️ Delete
                      </button>
                    </div>

                    {isSample && (
                      <div className="match-assignment">
                        <button
                          className={`btn-assign ${isAddingToMatch ? "cancel" : ""}`}
                          onClick={() => {
                            setAddToMatchId(isAddingToMatch ? null : q.id);
                            setAddToMatchGameId("");
                          }}
                        >
                          {isAddingToMatch ? "Cancel" : "➕ Add to Match"}
                        </button>
                      </div>
                    )}
                  </div>

                  {isSample && isAddingToMatch && (
                    <div className="add-to-match-panel slide-down">
                      <label>Select match destination:</label>
                      <div className="match-select-row">
                        {games.length === 0 ? (
                          <span className="loading-text">Loading matches…</span>
                        ) : (
                          <select
                            className="input"
                            value={addToMatchGameId}
                            onChange={(e) => setAddToMatchGameId(e.target.value)}
                          >
                            <option value="">— Choose a match —</option>
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
                        >
                          {addToMatchLoading ? "..." : "Confirm"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}