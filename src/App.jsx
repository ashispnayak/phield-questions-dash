import { useEffect, useState } from "react";
import generalData from "./data/question_over.json";
import timeoutData from "./data/question_trivia.json";

export default function App() {
  const [mode, setMode] = useState("general");
  const [questions, setQuestions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: ""
  });

  useEffect(() => {
    const stored = localStorage.getItem(mode);
    if (stored) {
      setQuestions(JSON.parse(stored));
    } else {
      setQuestions(mode === "general" ? generalData : timeoutData);
    }
  }, [mode]);

  const saveData = (data) => {
    localStorage.setItem(mode, JSON.stringify(data));
    setQuestions(data);
  };

  const handleAdd = () => {
    setEditingIndex("new");
    setForm({
      question: "",
      option1: "",
      option2: "",
      option3: "",
      option4: ""
    });
  };

  const handleEdit = (q, index) => {
    setEditingIndex(index);
    setForm({ ...q });
  };

  const handleSave = () => {
    const filledOptions = Object.values(form).slice(1).filter(o => o?.trim());

    if (!form.question.trim()) {
      alert("Question required");
      return;
    }

    if (filledOptions.length < 2) {
      alert("Minimum 2 options required");
      return;
    }

    let updated = [...questions];

    if (editingIndex === "new") {
      updated = [{ ...form, id: Date.now().toString() }, ...questions];
    } else {
      updated[editingIndex] = form;
    }

    saveData(updated);
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    if (!window.confirm("Delete this question?")) return;
    saveData(questions.filter((_, i) => i !== index));
  };

  // 🔍 SEARCH FILTER
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

  return (
    <div className="app-container">

      {/* HEADER */}
      <div className="header">
        <h1 className="logo-text">phield</h1>
        <p className="subtitle">Questions Management</p>

        <button className="btn-success" onClick={handleAdd}>
          + Add Question
        </button>
      </div>

      {/* 🔍 SEARCH BAR */}
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
          onClick={() => setMode("general")}
          className={`btn-primary ${mode === "general" ? "active" : ""}`}
        >
          🎯 Over Questions
        </button>

        <button
          onClick={() => setMode("timeout")}
          className={`btn-primary ${mode === "timeout" ? "active" : ""}`}
        >
          🧠 Timeout Questions
        </button>
      </div>

      {/* ADD NEW */}
      {editingIndex === "new" && (
        <div className="card">
          <input
            className="input"
            placeholder="Question"
            value={form.question}
            onChange={(e) =>
              setForm({ ...form, question: e.target.value })
            }
          />

          {["option1", "option2", "option3", "option4"].map((opt) => (
            <input
              key={opt}
              className="input"
              placeholder={opt}
              value={form[opt] || ""}
              onChange={(e) =>
                setForm({ ...form, [opt]: e.target.value })
              }
            />
          ))}

          <div className="btn-row">
            <button className="btn-success" onClick={handleSave}>
              Save
            </button>
            <button className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

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

                {["option1", "option2", "option3", "option4"].map((opt) => (
                  <input
                    key={opt}
                    className="input"
                    value={form[opt] || ""}
                    onChange={(e) =>
                      setForm({ ...form, [opt]: e.target.value })
                    }
                  />
                ))}

                <div className="btn-row">
                  <button className="btn-success" onClick={handleSave}>
                    Save
                  </button>
                  <button className="btn-secondary" onClick={handleCancel}>
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
                      <div key={i}>• {opt}</div>
                    ))}
                </div>

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