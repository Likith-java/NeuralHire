import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker using unpkg
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const STOPWORDS = new Set([
    'the', 'a', 'is', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'an', 'of', 'from', 'as', 'it'
]);

export interface ATSResult {
    score: number;
    matchedKeywords: string[];
    totalKeywords: number;
}

export interface Candidate {
    id: string;
    name: string;
    email: string;
    score: number;
    resumeText: string;
    timestamp: string;
    matchedKeywords: string[];
    candidateImage?: string;
}

const CANDIDATES_STORAGE_KEY = 'neuralhire_candidates';
const MAX_STORED_CANDIDATES = 50;
const MAX_STORED_RESUME_CHARS = 2_000;

const isQuotaExceeded = (err: unknown) => {
    if (typeof err !== 'object' || err === null) return false;
    const anyErr = err as any;
    return (
        anyErr?.name === 'QuotaExceededError' ||
        anyErr?.code === 22 ||
        anyErr?.number === -2147024882
    );
};

const toStorableCandidate = (candidate: Candidate): Candidate => {
    // Resume text can be huge; cap it so localStorage doesn't explode.
    return {
        ...candidate,
        resumeText: (candidate.resumeText || '').slice(0, MAX_STORED_RESUME_CHARS),
    };
};

export const normalizeText = (text: string): string[] => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !STOPWORDS.has(word));
};

export const parsePDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
    }
    return text;
};

export const parseDocx = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
};

export const analyzeResume = (resumeText: string, jobDesc: string): ATSResult => {
    const resumeWords = new Set(normalizeText(resumeText));
    const jobWords = Array.from(new Set(normalizeText(jobDesc)));

    const matchedKeywords = jobWords.filter(word => resumeWords.has(word));
    const score = Math.round((matchedKeywords.length / jobWords.length) * 100) || 0;

    return {
        score,
        matchedKeywords,
        totalKeywords: jobWords.length
    };
};

export const saveCandidate = (candidate: Candidate) => {
    const candidates = getCandidates();
    candidates.push(toStorableCandidate(candidate));

    // Keep only most recent N candidates to stay within quota.
    let payload = candidates.slice(-MAX_STORED_CANDIDATES);
    try {
        localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
        if (!isQuotaExceeded(err)) throw err;

        // Quota exceeded: drop oldest until it fits (or give up gracefully).
        while (payload.length > 0) {
            payload = payload.slice(1);
            try {
                localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(payload));
                return;
            } catch (e) {
                if (!isQuotaExceeded(e)) throw e;
            }
        }

        console.warn('Failed to persist candidates: storage quota exceeded.');
    }
};

export const getCandidates = (): Candidate[] => {
    const data = localStorage.getItem(CANDIDATES_STORAGE_KEY);
    try {
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const getCandidateById = (id: string): Candidate | null => {
    const candidates = getCandidates();
    return candidates.find((candidate) => candidate.id === id) || null;
};

export const deleteCandidatesByIds = (ids: string[]) => {
    const candidates = getCandidates();
    const remaining = candidates.filter((candidate) => !ids.includes(candidate.id));
    localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(remaining));
};

export const deleteAllCandidates = () => {
    localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify([]));
};
