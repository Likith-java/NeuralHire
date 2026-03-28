import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Mic, Send, CheckCircle2, AlertCircle, HandMetal, FileText, User, X, Camera, CameraOff, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import interviewService from '../services/api';
import { Webcam } from '../components/Webcam';
import SignLanguageInput from '../components/SignLanguageInput';
import VoiceInput from '../components/VoiceInput';
import { AvatarPanel } from '../components/AvatarPanel';
import { useInterviewStore } from '../store/useInterviewStore';

type Step = 'interview' | 'complete';
type InputMode = 'text' | 'voice' | 'sign';

export default function InterviewRoom() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>('interview');
  const [sessionId, setSessionId] = useState<string>('');
  const [questionId, setQuestionId] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidateName] = useState(localStorage.getItem('neural_candidate_name') || 'Candidate');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [showWebcam, setShowWebcam] = useState(true);
  const [metrics, setMetrics] = useState({
    semantic: 0,
    confidence: 0,
    clarity: 0,
    depth: 0,
    hesitation: 0,
    overall: 0,
  });

  const role = localStorage.getItem('neural_role');
  const isRecruiter = role === 'recruiter';
  const { isCandidateSpeaking, setIsSpeaking } = useInterviewStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);

  const playTTS = useCallback(async (text: string) => {
    if (!text) return;

    // Stop any existing playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis.cancel();

    try {
      setIsSpeaking(true);

      try {
        const audioBlob = await interviewService.playTTS(text);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
        };

        await audio.play();
      } catch (err) {
        console.warn('Backend TTS failed, using browser fallback:', err);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('All TTS methods failed:', err);
      setIsSpeaking(false);
    }
  }, [setIsSpeaking]);

  // Interrupt ARIA if candidate starts talking
  useEffect(() => {
    if (isCandidateSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isCandidateSpeaking, setIsSpeaking]);

  // --- Integrity Tracking (Verifier Agent) ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionId) {
        interviewService.sendIntegrityEvent(
          sessionId,
          'tab_switch',
          'User left the interview screen'
        ).catch(err => console.error('Failed to log integrity event:', err));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId]);

  useEffect(() => {
    const session_id = localStorage.getItem('neural_session_id');
    const first_question = localStorage.getItem('neural_first_question');
    const q_id = localStorage.getItem('neural_question_id');
    const q_num = localStorage.getItem('neural_question_number');

    console.log('InterviewRoom loaded:', { session_id, first_question, q_id, q_num });

    if (!session_id || !first_question) {
      showToast('No interview session found. Please start from the beginning.', 'error');
      navigate('/signin');
      return;
    }

    setSessionId(session_id);
    setCurrentQuestion(first_question);
    setQuestionId(Number(q_id) || 0);
    setQuestionNumber(Number(q_num) || 1);
    setMessages([{ role: 'ai', text: first_question }]);

    // Trigger ARIA to "speak" the first question ONLY ONCE per mount
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      playTTS(first_question);
    }
  }, [navigate, showToast, playTTS]);

  const submitAnswer = useCallback(async (answerText?: string, mode?: InputMode) => {
    const textToSubmit = answerText || inputText;
    const activeMode = mode || inputMode;
    if (!textToSubmit.trim() || !sessionId) {
      showToast('Please enter an answer.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await interviewService.submitAnswer({
        sessionId,
        answer: textToSubmit,
        inputMode: activeMode,
        questionId,
      });

      setMetrics({
        semantic: response.semantic_score,
        confidence: response.confidence_score,
        clarity: response.clarity_score,
        depth: response.depth_score,
        hesitation: response.hesitation_score,
        overall: response.overall_score,
      });

      setMessages((prev) => [...prev, { role: 'user', text: textToSubmit }]);

      if (response.interview_complete) {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', text: response.aria_feedback },
          { role: 'ai', text: 'Interview Complete! Redirecting to your report...' },
        ]);
        setTimeout(() => {
          navigate(`/report/${sessionId}`);
        }, 2000);
        setStep('complete');
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'ai', text: response.aria_feedback },
          { role: 'ai', text: response.next_question || '' },
        ]);

        setQuestionId(response.next_question_id || 0);
        setQuestionNumber(response.question_number);
        const ariaFullText = `${response.aria_feedback}. ${response.next_question || ''}`;
        setCurrentQuestion(ariaFullText);
        localStorage.setItem('neural_question_id', String(response.next_question_id || 0));
        localStorage.setItem('neural_question_number', String(response.question_number));
        localStorage.setItem('neural_first_question', response.next_question || '');

        // Trigger ARIA to "speak" what is shown in the box
        playTTS(ariaFullText);
      }

      setInputText('');
    } catch (error: any) {
      showToast(error?.response?.data?.detail || 'Failed to submit answer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [inputText, inputMode, questionId, sessionId, navigate, showToast]);

  const handleVoiceAnswer = useCallback((transcript: string) => {
    setInputText(transcript);
    submitAnswer(transcript, 'voice');
  }, [submitAnswer]);

  const handleSignAnswer = useCallback((text: string) => {
    setInputText(text);
    submitAnswer(text, 'sign');
  }, [submitAnswer]);

  const handleFinishEarly = useCallback(async () => {
    if (!sessionId) return;
    if (window.confirm('Are you sure you want to finish the interview early? This will generate your final report based on answers so far.')) {
      try {
        await interviewService.finishSession(sessionId);
        showToast('Processing final evaluation...', 'success');
        setTimeout(() => {
          navigate(`/report/${sessionId}`);
        }, 1500);
      } catch (err) {
        console.error('Failed to finish session:', err);
        showToast('Error finalizing interview.', 'error');
      }
    }
  }, [sessionId, navigate, showToast]);

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Debug: show loading state
  if (!sessionId && !currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <AnimatePresence mode="wait">
        {step === 'interview' && (
          <motion.div
            key="interview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen p-6 lg:p-10"
          >
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Top Split-Screen Row: People */}
              {!isRecruiter && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Candidate Feed */}
                  <div className="bg-surface/40 border border-border rounded-[2.5rem] p-4 relative overflow-hidden group aspect-video flex items-center justify-center shadow-2xl">
                    <p className="absolute top-4 left-6 text-[10px] font-mono text-text-muted uppercase tracking-widest z-10">CANDIDATE FEED</p>
                    <div className="w-full h-full relative">
                      <button
                        onClick={() => setShowWebcam(!showWebcam)}
                        className="absolute top-4 right-4 z-20 p-2 bg-background/80 backdrop-blur-md rounded-lg border border-border"
                      >
                        {showWebcam ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                      </button>
                      {/* Hide the main webcam if the Sign Language input is active to avoid camera conflicts */}
                      {showWebcam && inputMode !== 'sign' ? (
                        <Webcam className="w-full h-full rounded-3xl object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-background/50 rounded-3xl border-2 border-dashed border-border transition-all">
                          {inputMode === 'sign' ? (
                            <div className="text-center space-y-2">
                              <Sparkles className="w-8 h-8 text-primary mx-auto animate-pulse" />
                              <p className="text-[10px] font-mono text-primary uppercase tracking-widest font-bold">Neural Engine Active</p>
                              <p className="text-[9px] text-text-muted uppercase">Sign language camera is active below</p>
                            </div>
                          ) : (
                            <>
                              <CameraOff className="w-8 h-8 text-text-muted mb-2" />
                              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Webcam Disabled</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ARIA AI Feed */}
                  <div className="bg-surface/40 border border-primary/30 rounded-[2.5rem] p-4 relative overflow-hidden aspect-video flex items-center justify-center shadow-2xl">
                    <p className="absolute top-4 left-6 text-[10px] font-mono text-primary/70 uppercase tracking-widest z-10">ARIA AI INTERVIEWER</p>
                    <div className="flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/30 rounded-full absolute top-4 right-6 z-10 backdrop-blur-md">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] font-bold uppercase text-success">Online</span>
                    </div>
                    <AvatarPanel className="w-full h-full" />
                  </div>
                </div>
              )}

              {/* Main Content Area */}
              <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-8">
                {/* Left Column: Chat Area */}
                <div className="space-y-6">
                  {/* Chat Area */}
                  <div className="bg-surface/40 border border-border rounded-[2.5rem] p-8 space-y-6 flex flex-col min-h-[600px] shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-text-muted">Interview Session</p>
                        <h2 className="text-3xl font-black uppercase">
                          Question {questionNumber}
                        </h2>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl">
                          <User className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-primary">{candidateName}</span>
                        </div>
                        <button
                          onClick={handleFinishEarly}
                          className="text-[9px] font-mono text-secondary hover:text-secondary/80 uppercase tracking-widest font-black flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Finish Early
                        </button>
                      </div>
                    </div>

                    {/* Current Question */}
                    <div className="bg-background border border-border rounded-3xl p-6 shadow-inner">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">ARIA</p>
                      <p className="text-lg leading-relaxed">{currentQuestion}</p>
                    </div>

                    {/* Chat History */}
                    <div className="flex-grow space-y-4 max-h-[350px] overflow-auto pr-2 custom-scrollbar">
                      {messages.slice(1).map((message, index) => (
                        <div
                          key={index}
                          className={`rounded-3xl p-5 border ${message.role === 'ai'
                            ? 'bg-primary/10 border-primary/20'
                            : 'bg-background border-border'
                            }`}
                        >
                          <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
                            {message.role === 'ai' ? 'ARIA' : candidateName}
                          </p>
                          <p className="text-sm leading-relaxed">{message.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Input Modes */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      {/* Mode Selector */}
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setInputMode('text')}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${inputMode === 'text'
                            ? 'bg-primary text-background border-primary shadow-lg shadow-primary/20'
                            : 'bg-background border-border text-text-muted hover:border-primary/50'
                            }`}
                        >
                          <FileText className="w-4 h-4" />
                          Text
                        </button>
                        <button
                          onClick={() => setInputMode('voice')}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${inputMode === 'voice'
                            ? 'bg-primary text-background border-primary shadow-lg shadow-primary/20'
                            : 'bg-background border-border text-text-muted hover:border-primary/50'
                            }`}
                        >
                          <Mic className="w-4 h-4" />
                          Voice
                        </button>
                        <button
                          onClick={() => setInputMode('sign')}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${inputMode === 'sign'
                            ? 'bg-primary text-background border-primary shadow-lg shadow-primary/20'
                            : 'bg-background border-border text-text-muted hover:border-primary/50'
                            }`}
                        >
                          <HandMetal className="w-4 h-4" />
                          Sign
                        </button>
                      </div>

                      {/* Input Components */}
                      <div className="min-h-[200px]">
                        {inputMode === 'text' && (
                          <div className="space-y-4">
                            <textarea
                              value={inputText}
                              onChange={(e) => setInputText(e.target.value)}
                              rows={5}
                              placeholder="Type your answer here..."
                              className="w-full bg-background border border-border rounded-3xl p-5 outline-none focus:border-primary/50 resize-none shadow-inner"
                            />
                            <button
                              onClick={() => submitAnswer()}
                              disabled={isSubmitting || !inputText.trim()}
                              className="w-full py-5 bg-primary text-background font-black rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                            >
                              {isSubmitting ? (
                                <>
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-background border-t-transparent rounded-full"
                                  />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Send className="w-5 h-5" />
                                  Submit Answer
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {inputMode === 'voice' && (
                          <VoiceInput onAnswer={handleVoiceAnswer} />
                        )}

                        {inputMode === 'sign' && (
                          <SignLanguageInput onAnswer={handleSignAnswer} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Dashboards */}
                <div className="space-y-6">
                  {/* Live Metrics - Only show for recruiter */}
                  {isRecruiter && (
                    <div className="bg-surface/40 border border-border rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                      <h3 className="text-xl font-black uppercase">Live Metrics</h3>

                      {[
                        { label: 'Semantic', value: metrics.semantic },
                        { label: 'Confidence', value: metrics.confidence },
                        { label: 'Clarity', value: metrics.clarity },
                        { label: 'Depth', value: metrics.depth },
                        { label: 'Hesitation', value: metrics.hesitation },
                        { label: 'Overall', value: metrics.overall },
                      ].map((metric) => (
                        <div key={metric.label} className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span>{metric.label}</span>
                            <span className={getScoreColor(metric.value)}>{metric.value.toFixed(1)}/10</span>
                          </div>
                          <div className="h-2 bg-background rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(metric.value * 10, 100)}%` }}
                              transition={{ duration: 0.5 }}
                              className={`h-full ${metric.value >= 7 ? 'bg-success' :
                                metric.value >= 5 ? 'bg-yellow-400' : 'bg-red-400'
                                }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input Mode Status */}
                  <div className="bg-surface/40 border border-border rounded-[2.5rem] p-8 shadow-xl">
                    <h3 className="text-xl font-black uppercase mb-4 text-center">Status Dashboard</h3>
                    <div className="flex flex-col items-center gap-6">
                      <div className="flex items-center justify-center gap-4 py-4 px-8 bg-background/50 rounded-2xl border border-border w-full">
                        {inputMode === 'text' && <FileText className="w-8 h-8 text-primary" />}
                        {inputMode === 'voice' && <Mic className="w-8 h-8 text-secondary" />}
                        {inputMode === 'sign' && <HandMetal className="w-8 h-8 text-success" />}
                        <span className="text-lg font-black uppercase">{inputMode} MODE ACTIVE</span>
                      </div>

                      <div className="flex items-center gap-3 bg-success/10 border border-success/30 px-6 py-4 rounded-2xl w-full justify-center shadow-lg shadow-success/10">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                        <span className="text-sm font-bold uppercase tracking-widest text-success">Session Encrypted</span>
                      </div>
                    </div>
                  </div>

                  {/* Hints/Instructions */}
                  <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 shadow-lg">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">NeuralHire Tips</h4>
                    <ul className="space-y-4">
                      {[
                        "Speak naturally; our AI understands context beyond keywords.",
                        "In Sign mode, keep your hands within the highlighted area.",
                        "Technical clarity is weighted higher than speed."
                      ].map((hint, i) => (
                        <li key={i} className="flex gap-4 text-sm text-text-muted leading-relaxed">
                          <Sparkles className="w-5 h-5 text-primary shrink-0 opacity-70" />
                          {hint}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex items-center justify-center p-6"
          >
            <div className="bg-surface/40 border border-border rounded-[2.5rem] p-12 text-center max-w-xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-success" />
              </motion.div>
              <h2 className="text-4xl font-black uppercase mb-4">Interview Complete!</h2>
              <p className="text-text-muted mb-8">Generating your personalized evaluation report...</p>
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                />
                <span className="text-sm text-text-muted">Loading report...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
