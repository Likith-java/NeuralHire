# NeuralHire OS v2.0 - Backend API

AI-powered interview platform with real-time evaluation, gesture recognition, and recruiter management.

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for frontend)
- API Keys (see below)

### Installation

```bash
# 1. Navigate to backend directory
cd neuralhire-backend

# 2. Install Python dependencies
python -m pip install -r requirements.txt

# 3. Configure API keys
# Edit .env file with your keys (see API Keys section below)

# 4. Start the server
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Starting the Backend

```bash
cd neuralhire-backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The server will start at: **http://localhost:8000**

---

## 🔑 API Keys Setup

Create a `.env` file in the `neuralhire-backend` directory with the following keys:

```env
GROQ_API_KEY=gsk_your_groq_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
RESEND_API_KEY=re-placeholder
FROM_EMAIL=aria@neuralhire.ai
SECRET_KEY=your-random-secret-key
DATABASE_URL=sqlite:///./neuralhire.db
FRONTEND_URL=http://localhost:5173
```

### Where to Get API Keys

| Service | Website | Purpose |
|---------|---------|---------|
| **Groq** | https://console.groq.com/ | AI question generation & evaluation |
| **ElevenLabs** | https://elevenlabs.io/ | Text-to-Speech voice synthesis |
| **Resend** | https://resend.com/ | Email sending |

---

## 📡 API Endpoints

### Health Check

```
GET /api/health
```

**Response:**
```json
{
  "status": "online",
  "version": "2.0",
  "aria": "ready"
}
```

---

### Interview Sessions

#### Start New Interview

```
POST /api/session/start
```

**Request:**
```json
{
  "job_role": "Python Developer",
  "required_skills": ["Python", "FastAPI", "SQL"],
  "difficulty": "deep_dive",
  "input_mode": "text",
  "candidate_name": "John Doe"
}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "first_question": "Can you explain...",
  "question_number": 1,
  "question_id": 1
}
```

#### Submit Answer

```
POST /api/session/answer
```

**Request:**
```json
{
  "session_id": "uuid-string",
  "answer": "My answer is...",
  "input_mode": "text",
  "question_id": 1
}
```

**Response:**
```json
{
  "scores": {
    "semantic_score": 0.85,
    "confidence_score": 0.9,
    ...
  },
  "overall_score": 8.5,
  "next_question": "Follow-up question...",
  "aria_feedback": "Great answer with...",
  "interview_complete": false
}
```

#### Get Session Details

```
GET /api/session/{session_id}
```

---

### Gesture Recognition

#### Predict Gesture Letter

```
POST /api/gesture
```

**Request:**
```json
{
  "landmarks": [0.1, 0.2, 0.3, ...] // 63 values
}
```

**Response:**
```json
{
  "letter": "A",
  "confidence": 0.94
}
```

#### Get Word Suggestions

```
GET /api/words?prefix=RE
```

**Response:**
```json
{
  "suggestions": ["REST", "REACT", "REDIS", "REDUCE", "REQUEST", "RESPONSE"]
}
```

---

### Integrity Monitoring

#### Log Integrity Event

```
POST /api/integrity/{session_id}
```

**Request:**
```json
{
  "event_type": "looking_away",
  "details": "User looked away for 5 seconds"
}
```

**Response:**
```json
{
  "score": 87.0,
  "status": "caution",
  "event_logged": "looking_away"
}
```

#### Get Integrity Summary

```
GET /api/integrity/{session_id}/summary
```

---

### Reports

#### Get Interview Report

```
GET /api/report/{session_id}
```

#### Download PDF Report

```
GET /api/report/{session_id}/pdf
```

---

### Media Processing

#### Transcribe Audio

```
POST /api/transcribe
Content-Type: multipart/form-data

audio: <file>
```

#### Text-to-Speech

```
POST /api/tts
```

**Request:**
```json
{
  "text": "Hello, let's begin the interview."
}
```

#### Parse Resume

```
POST /api/resume/parse
Content-Type: multipart/form-data

resume: <file.pdf>
```

---

### Access Keys (Candidate)

#### Request Interview Key

```
POST /request-key
```

**Request:**
```json
{
  "email": "candidate@example.com"
}
```

#### Verify Interview Key

```
POST /verify-key
```

**Request:**
```json
{
  "email": "candidate@example.com",
  "key": "R7X2KP9A"
}
```

---

### Recruiter Authentication

#### Sign Up

```
POST /api/recruiter/signup
```

**Request:**
```json
{
  "full_name": "John Smith",
  "email": "john@company.com",
  "company_name": "Acme Corp",
  "company_size": "11-50"
}
```

#### Login

```
POST /api/recruiter/login
```

**Request:**
```json
{
  "email": "john@company.com",
  "password": "NEUR1234@#abc"
}
```

#### Forgot Password

```
POST /api/recruiter/forgot-password
```

#### Reset Password

```
POST /api/recruiter/reset-password
```

#### Logout

```
POST /api/recruiter/logout
X-Auth-Token: <session_token>
```

#### Get Profile

```
GET /api/recruiter/me
X-Auth-Token: <session_token>
```

---

### Recruiter Dashboard

#### List Candidates

```
GET /api/recruiter/candidates
X-Auth-Token: <session_token>
```

#### Get Candidate Details

```
GET /api/recruiter/candidates/{session_id}
X-Auth-Token: <session_token>
```

#### Compare Candidates

```
GET /api/recruiter/candidates/compare?session_ids=id1,id2,id3
X-Auth-Token: <session_token>
```

#### Get Statistics

```
GET /api/recruiter/stats
X-Auth-Token: <session_token>
```

#### Delete Candidate Record

```
DELETE /api/recruiter/candidates/{session_id}
X-Auth-Token: <session_token>
```

---

### Demo Data

#### Load Demo Profiles

```
POST /api/demo/load
```

Loads 3 demo interview profiles (Priya Sharma, Rohan Mehta, Arjun Kumar) for testing.

---

## 🧪 Testing

### Test Health Endpoint

```bash
curl http://localhost:8000/api/health
```

### Test Question Generation

```bash
curl -X POST http://localhost:8000/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"job_role":"Python Developer","required_skills":["Python","SQL"],"difficulty":"deep_dive"}'
```

### Test Word Suggestions

```bash
curl "http://localhost:8000/api/words?prefix=RE"
```

---

## 📁 Project Structure

```
neuralhire-backend/
├── main.py              # FastAPI app entry point
├── database.py          # SQLAlchemy database setup
├── requirements.txt     # Python dependencies
├── .env                # Environment variables (create from .env.example)
├── models/             # SQLAlchemy database models
│   ├── session.py
│   ├── question.py
│   ├── answer.py
│   ├── integrity.py
│   ├── interview_key.py
│   └── recruiter.py
├── routers/            # API route handlers
│   ├── session.py
│   ├── gesture.py
│   ├── integrity.py
│   ├── report.py
│   ├── media.py
│   ├── keys.py
│   ├── recruiter_auth.py
│   └── recruiter_dashboard.py
├── services/           # Business logic services
│   ├── groq_service.py
│   ├── whisper_service.py
│   ├── tts_service.py
│   ├── gesture_service.py
│   ├── word_service.py
│   ├── integrity_service.py
│   ├── email_service.py
│   ├── auth_service.py
│   ├── scoring_service.py
│   └── resume_service.py
├── schemas/            # Pydantic request/response models
└── logs/              # Application logs (auto-created)
```

---

## 🔧 Troubleshooting

### Port 8000 Already in Use

```bash
# Find the process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>
```

### Database Errors

If you encounter database errors, delete the SQLite database and restart:

```bash
del neuralhire.db
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### API Key Issues

- Ensure `.env` file exists in `neuralhire-backend/` directory
- Check that API keys are valid and have sufficient quota
- Restart the server after updating `.env`

### Module Import Errors

```bash
# Reinstall dependencies
python -m pip install -r requirements.txt --force-reinstall
```

### Sentence-Transformers Warning

The warning about `huggingface_hub` symlinks is harmless on Windows. The model will still work correctly.

---

## 📚 Additional Resources

- **Swagger Documentation:** http://localhost:8000/docs
- **ReDoc Documentation:** http://localhost:8000/redoc
- **Groq API:** https://console.groq.com/docs
- **ElevenLabs API:** https://elevenlabs.io/docs/api-reference

---

## 🎯 Features

- [x] AI-powered interview questions (Groq Llama 3.3)
- [x] Real-time answer scoring
- [x] Semantic similarity analysis
- [x] Gesture recognition for sign language
- [x] Integrity monitoring
- [x] Text-to-Speech (ElevenLabs)
- [x] Audio transcription (ElevenLabs Scribe)
- [x] Recruiter authentication
- [x] Candidate management
- [x] PDF report generation
- [x] Demo data loading

---

**Built with ❤️ by NeuralHire OS v2.0**
