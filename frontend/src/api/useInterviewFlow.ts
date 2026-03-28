import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterviewStore } from '../store/useInterviewStore';
import interviewService from '../services/api';

export const useInterviewFlow = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    inputMode,
    sessionId,
    setSessionId,
    addMessage,
    updateScores,
    updateConfidence,
    updateClarity,
    updateDepth,
    updateHesitation,
    updateOverallScore,
    setQuestionProgress,
    setStatus,
    addLog,
  } = useInterviewStore();

  const handleStartInterview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const candidateId = localStorage.getItem('neural_candidate_id');
      const jobRoleId = localStorage.getItem('neural_job_role_id');
      if (!candidateId || !jobRoleId) {
        throw new Error('Candidate profile must be created before starting a session.');
      }
      const response = await interviewService.startSession({
        candidateId,
        jobRoleId,
      });

      setSessionId(response.session_id);
      addMessage({
        id: 'initial-msg',
        role: 'aria',
        text: response.first_question,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isNew: true,
      });
      setQuestionProgress(response.question_number, 8); // Assuming 8 questions total for now
      setStatus('active');
      navigate('/interview');
      addLog({ message: 'Neural link established. Session started.', type: 'success' });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to start interview session.';
      setError(errMsg);
      addLog({ message: errMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (text: string) => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    // Optimistic update: add candidate message
    const candidateMsgId = Math.random().toString(36).substr(2, 9);
    addMessage({
      id: candidateMsgId,
      role: 'candidate',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isNew: true,
    });

    try {
      const response = await interviewService.submitAnswer({
        sessionId,
        answer: text,
        inputMode,
      });

      // Update all scores
      updateScores({
        problemSolving: response.scores.problem_solving,
        systemDesign: response.scores.system_design,
        communication: response.scores.communication,
        codeQuality: response.scores.code_quality,
        technicalDepth: response.scores.technical_depth,
        adaptability: response.scores.adaptability,
      });

      updateConfidence(response.confidence_score);
      updateClarity(response.semantic_score);
      updateDepth(response.integrity_score);
      updateHesitation(response.hesitation_score);
      updateOverallScore(response.overall_score);

      if (response.interview_complete) {
        handleEndInterview();
      } else {
        addMessage({
          id: Math.random().toString(36).substr(2, 9),
          role: 'aria',
          text: response.next_question,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isNew: true,
        });
        setQuestionProgress(response.question_number + 1, 8);
      }
      addLog({ message: 'Answer analyzed. Scores updated.', type: 'success' });
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to submit answer.';
      setError(errMsg);
      addLog({ message: errMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscribe = async (blob: Blob) => {
    try {
      const response = await interviewService.transcribeAudio(blob);
      return response.transcript;
    } catch (err) {
      console.error('Transcription error:', err);
      return '';
    }
  };

  const handleGesture = async (landmarks: number[][]) => {
    try {
      return await interviewService.detectGesture(landmarks);
    } catch (err) {
      console.error('Gesture detection error:', err);
      return null;
    }
  };

  const handleEndInterview = () => {
    setStatus('complete');
    if (sessionId) {
      navigate(`/report/${sessionId}`);
    } else {
      navigate('/report');
    }
    addLog({ message: 'Interview session terminated. Generating report...', type: 'info' });
  };

  return {
    handleStartInterview,
    handleSubmitAnswer,
    handleTranscribe,
    handleGesture,
    handleEndInterview,
    isLoading,
    error,
  };
};
