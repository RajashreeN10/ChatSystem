import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");
const API = "http://localhost:5000";

function App() {
  const [screen, setScreen] = useState("login"); // login | signup | userlist | chat
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activePartner, setActivePartner] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
const [groupName, setGroupName] = useState("");

  const handleSignUp = async () => {
    setError("");
    if (!name.trim() || !email.trim()) return;
    const res = await fetch(`${API}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setCurrentUser(data);
    setScreen("userlist");
  };

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) return;
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setCurrentUser(data);
    setScreen("userlist");
  };

  useEffect(() => {
    if (screen === "userlist" && currentUser) {
      fetch(`${API}/users?excludeId=${currentUser.id}`)
        .then((res) => res.json())
        .then(setUsers);

      fetch(`${API}/users/${currentUser.id}/rooms`)
        .then((res) => res.json())
        .then(setMyRooms);
    }
  }, [screen, currentUser]);

  const openChatWith = async (partner) => {
    const res = await fetch(`${API}/rooms/direct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId1: currentUser.id, userId2: partner.id }),
    });
    const room = await res.json();
    setActiveRoom(room);
    setActivePartner(partner);
    setScreen("chat");
  };

  const openExistingRoom = (room) => {
  const partnerMember = room.isGroup
    ? null
    : room.members.find((m) => m.userId !== currentUser.id);

  setActiveRoom(room);
  setActivePartner(
    room.isGroup
      ? { name: room.name }
      : { name: partnerMember?.user?.name || "Unknown" }
  );
  setScreen("chat");
};

  const toggleUserSelection = (userId) => {
  setSelectedUserIds((prev) =>
    prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
  );
};

const createGroup = async () => {
  if (!groupName.trim() || selectedUserIds.length === 0) return;
  const res = await fetch(`${API}/rooms/group`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: groupName,
      creatorId: currentUser.id,
      memberIds: selectedUserIds,
    }),
  });
  const room = await res.json();
  setActiveRoom(room);
  setActivePartner({ name: groupName }); // used just for the chat header
  setSelectedUserIds([]);
  setGroupName("");
  setScreen("chat");
};

  const handleLogout = () => {
  setCurrentUser(null);
  setActiveRoom(null);
  setActivePartner(null);
  setName("");
  setEmail("");
  setError("");
  setScreen("login");
};

  if (screen === "login") {
    return (
      <div style={styles.centerBox}>
        <h2>Login</h2>
        <input
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button onClick={handleLogin} style={styles.button}>
          Login
        </button>
        <p style={styles.switchText}>
          New here?{" "}
          <span
            style={styles.link}
            onClick={() => {
              setError("");
              setScreen("signup");
            }}
          >
            Sign Up
          </span>
        </p>
      </div>
    );
  }

  if (screen === "signup") {
    return (
      <div style={styles.centerBox}>
        <h2>Sign Up</h2>
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button onClick={handleSignUp} style={styles.button}>
          Sign Up
        </button>
        <p style={styles.switchText}>
          Already have an account?{" "}
          <span
            style={styles.link}
            onClick={() => {
              setError("");
              setScreen("login");
            }}
          >
            Login
          </span>
        </p>
      </div>
    );
  }

if (screen === "userlist") {
    return (
      <div style={styles.centerBox}>
        <div style={styles.topBar}>
          <h2>Hi, {currentUser.name} 👋</h2>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
        <button
          onClick={() => setScreen("creategroup")}
          style={{ ...styles.button, marginBottom: 15 }}
        >
          + Create Group
        </button>

        {myRooms.length > 0 && (
          <>
            <p style={{ fontWeight: "bold", textAlign: "left" }}>My Chats</p>
            {myRooms.map((room) => {
              const label = room.isGroup
                ? `👥 ${room.name}`
                : room.members.find((m) => m.userId !== currentUser.id)?.user
                    ?.name || "Unknown";
              return (
                <div
                  key={room.id}
                  style={styles.userRow}
                  onClick={() => openExistingRoom(room)}
                >
                  {label}
                </div>
              );
            })}
          </>
        )}

        <p style={{ fontWeight: "bold", textAlign: "left", marginTop: 15 }}>
          Start a new chat
        </p>
        {users.length === 0 && <p>No other users yet.</p>}
        {users.map((u) => (
          <div key={u.id} style={styles.userRow} onClick={() => openChatWith(u)}>
            {u.name} <span style={{ color: "#888" }}>({u.email})</span>
          </div>
        ))}
      </div>
    );
  }

  if (screen === "creategroup") {
    return (
      <div style={styles.centerBox}>
        <h2>Create Group</h2>
        <input
          placeholder="Group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={styles.input}
        />
        <p style={{ textAlign: "left" }}>Select members:</p>
        {users.map((u) => (
          <label key={u.id} style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={selectedUserIds.includes(u.id)}
              onChange={() => toggleUserSelection(u.id)}
            />
            {" " + u.name}
          </label>
        ))}
        <button onClick={createGroup} style={{ ...styles.button, marginTop: 15 }}>
          Create Group
        </button>
        <p style={styles.switchText}>
          <span style={styles.link} onClick={() => setScreen("userlist")}>
            ← Back
          </span>
        </p>
      </div>
    );
  }

  if (screen === "chat") {
    return (
      <ChatWindow
        currentUser={currentUser}
        partner={activePartner}
        room={activeRoom}
        onBack={() => setScreen("userlist")}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}

function ChatWindow({ currentUser, partner, room, onBack, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchMembers = async () => {
    const res = await fetch(`${API}/rooms/${room.id}`);
    const data = await res.json();
    setMembers(data.members || []);
    setShowMembers(true);
  };

  useEffect(() => {
    socket.emit("join_room", room.id);

    fetch(`${API}/rooms/${room.id}/messages`)
      .then((res) => res.json())
      .then(setMessages);

    const handleNewMessage = (message) => {
      if (message.roomId === room.id) {
        setMessages((prev) => [...prev, message]);
      }
    };
    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [room.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

 const sendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    let fileUrl = null;
    let fileType = null;

    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      fileUrl = data.fileUrl;
      fileType = data.fileType;
      setUploading(false);
    }

    socket.emit("send_message", {
      roomId: room.id,
      senderId: currentUser.id,
      content: input.trim() || null,
      fileUrl,
      fileType,
    });

    setInput("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={{ marginBottom: 10 }}>
          ← Back
        </button>
        <button onClick={onLogout} style={styles.logoutButton}>
          Logout
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{room.isGroup ? `👥 ${partner.name}` : `Chat with ${partner.name}`}</h2>
        {room.isGroup && (
          <button onClick={fetchMembers} style={styles.logoutButton}>
            View Members
          </button>
        )}
      </div>
      <div style={styles.chatBox}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              textAlign: msg.senderId === currentUser.id ? "right" : "left",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                background: msg.senderId === currentUser.id ? "#DCF8C6" : "#EEE",
                padding: "6px 12px",
                borderRadius: 12,
                maxWidth: "80%",
              }}
            >
              {msg.senderId !== currentUser.id && (
                <div>
                  <strong>{msg.sender?.name}</strong>
                </div>
              )}
              {msg.fileUrl && msg.fileType === "image" && (
                <img
                  src={msg.fileUrl}
                  alt="attachment"
                  style={{ maxWidth: "100%", borderRadius: 8, marginTop: 4 }}
                />
              )}
              {msg.fileUrl && msg.fileType === "file" && (
                <div style={{ marginTop: 4 }}>
                  <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                    📎 Download file
                  </a>
                </div>
              )}
              {msg.content && <div>{msg.content}</div>}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      <div ref={bottomRef} />
      </div>
      
     {selectedFile && (
        <div style={{ marginBottom: 6, fontSize: 13, color: "#555" }}>
          📎 {selectedFile.name}{" "}
          <span
            style={{ color: "red", cursor: "pointer" }}
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            ✕
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />
        <button onClick={() => fileInputRef.current.click()}>📎</button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={sendMessage} disabled={uploading}>
          {uploading ? "Uploading..." : "Send"}
        </button>
      </div>

      {showMembers && (
        <div style={styles.modalOverlay} onClick={() => setShowMembers(false)}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3>Members ({members.length})</h3>
            {members.map((m) => (
              <div key={m.userId} style={{ padding: "6px 0", textAlign: "left" }}>
                {m.user.name} <span style={{ color: "#888" }}>({m.user.email})</span>
              </div>
            ))}
            <button
              onClick={() => setShowMembers(false)}
              style={{ ...styles.button, marginTop: 15 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  centerBox: {
    maxWidth: 400,
    margin: "60px auto",
    fontFamily: "sans-serif",
    textAlign: "center",
  },
  input: {
    display: "block",
    width: "100%",
    padding: 10,
    marginBottom: 10,
    boxSizing: "border-box",
  },
  button: {
    padding: "10px 20px",
    cursor: "pointer",
    width: "100%",
  },
  error: {
    color: "red",
    fontSize: 14,
  },
  switchText: {
    marginTop: 15,
    fontSize: 14,
  },
  link: {
    color: "#0077ff",
    cursor: "pointer",
    textDecoration: "underline",
  },
  userRow: {
    padding: 10,
    border: "1px solid #ddd",
    borderRadius: 6,
    marginBottom: 8,
    cursor: "pointer",
    textAlign: "left",
  },
  chatBox: {
    border: "1px solid #ccc",
    borderRadius: 8,
    height: 400,
    overflowY: "auto",
    padding: 10,
    marginBottom: 10,
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutButton: {
    padding: "6px 14px",
    cursor: "pointer",
    background: "#f5f5f5",
    border: "1px solid #ccc",
    borderRadius: 6,
    height: "fit-content",
  },
checkboxRow: {
    display: "block",
    textAlign: "left",
    padding: "6px 0",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBox: {
    background: "white",
    padding: 20,
    borderRadius: 8,
    minWidth: 280,
    maxWidth: "80%",
    textAlign: "center",
  },
};


export default App;