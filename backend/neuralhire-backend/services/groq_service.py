from groq import Groq
from dotenv import load_dotenv
from loguru import logger
import os
import json
import random

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

MODEL = "llama-3.3-70b-versatile"

DSA_QUESTIONS = {
    "arrays": [
        "Find the maximum subarray sum (Kadane's Algorithm)",
        "Rotate an array by k positions",
        "Find the median of two sorted arrays",
        "Find the duplicate in an array",
        "Product of array except self",
        "Find all subarrays with sum equals k",
        "Maximum product subarray",
        "Find the missing number in an array",
        "Two sum problem",
        "Move zeros to end",
        "Find pivot index"
    ],
    "strings": {
        "hard": [
            "Implement atoi (string to integer)",
            "Find the longest substring without repeating characters",
            "Regular expression matching",
            "Edit distance between two strings",
            "Minimum window substring"
        ],
        "medium": [
            "Longest palindromic substring",
            "Group anagrams",
            "Valid palindrome II"
        ]
    },
    "linked_lists": [
        "Reverse a linked list",
        "Detect cycle in linked list",
        "Merge two sorted linked lists",
        "Find intersection point of two linked lists",
        "Remove nth node from end of list",
        "Add two numbers represented as linked lists",
        "Swap nodes in pairs"
    ],
    "trees": [
        "Inorder, preorder, postorder traversal",
        "Validate if a binary tree is a BST",
        "Find LCA in binary tree",
        "Binary tree maximum path sum",
        "Serialize and deserialize binary tree",
        "Level order traversal (BFS)",
        "Find diameter of binary tree"
    ],
    "graphs": [
        "Implement DFS and BFS",
        "Detect cycle in undirected graph",
        "Topological sorting",
        "Number of islands problem",
        "Shortest path in weighted graph (Dijkstra)",
        "Course schedule (cycle detection)"
    ],
    "dynamic_programming": [
        "Climbing stairs problem",
        "Longest increasing subsequence",
        "Coin change problem (minimum coins)",
        "0/1 Knapsack problem",
        "Longest common subsequence",
        "Edit distance",
        "Maximum subarray sum (Kadane's DP)",
        "House robber problem",
        "Decode ways"
    ],
    "sorting": [
        "Implement quicksort",
        "Implement merge sort",
        "Find the kth smallest element",
        "Merge intervals",
        "Counting sort for range of integers"
    ],
    "searching": [
        "Binary search (iterative and recursive)",
        "Search in rotated sorted array",
        "Find peak element in mountain array",
        "Search in 2D matrix"
    ],
    "stacks_queues": [
        "Valid parentheses",
        "Min stack problem",
        "Implement queue using stacks"
    ],
    "heaps": [
        "Kth largest element",
        "Find median from data stream",
        "Top K frequent elements"
    ],
    "problem_solving": [
        "Explain your approach to solving a complex problem",
        "Describe a time when you had to debug a critical issue",
        "How do you optimize code for performance?",
        "Walk me through your problem-solving process",
        "How do you handle tight deadlines with complex requirements?",
        "Describe a technical challenge you overcame",
        "How do you prioritize tasks in a project?",
        "Explain a time when you had to learn something quickly",
        "How do you handle ambiguous requirements?",
        "Describe your experience with system design"
    ]
}

PROBLEM_SOLVING_KEYWORDS = ["engineer", "developer", "software", "data", "backend", "frontend", "fullstack", "python", "java", "javascript", "react", "node", "sql", "database", "DSA", "algorithm", "data structure", "coding", "programming", "leetcode", "hackerrank", "problem solving", "manager", "lead", "senior", "junior", "mid", "intern"]


def generate_question(job_role: str, skills: list, difficulty: str, question_num: int) -> str:
    job_role_lower = job_role.lower()
    skills_lower = [s.lower() for s in skills]
    all_text = job_role_lower + " " + " ".join(skills_lower)
    
    needs_dsa = any(kw in all_text for kw in PROBLEM_SOLVING_KEYWORDS)
    
    # Generate DSA question every 2nd question for technical roles
    if needs_dsa and question_num % 2 == 0:
        return generate_dsa_question(difficulty, question_num)
    
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are ARIA, an adaptive AI interviewer for NeuralHire. Generate interview question #" + str(question_num) + " for a " + difficulty + " level interview. Job role: " + job_role + ". Required skills: " + ", ".join(skills) + ". Return ONLY the question text. No numbering. No preamble. No explanation. Make it specific, technical, and appropriate for the difficulty level."
                },
                {
                    "role": "user",
                    "content": "Generate the next interview question."
                }
            ],
            max_tokens=200,
            temperature=0.7
        )
        result = response.choices[0].message.content
        logger.info(f"Question {question_num} generated for {job_role}")
        return result
    except Exception as e:
        logger.error(f"Groq question generation failed: {e}")
        return f"Can you explain your experience with {skills[0] if skills else 'the required technologies'}?"


def generate_dsa_question(difficulty: str, question_num: int) -> str:
    categories = list(DSA_QUESTIONS.keys())
    category = random.choice(categories)
    
    if isinstance(DSA_QUESTIONS[category], dict):
        if difficulty == "basic":
            category = random.choice(["arrays", "linked_lists", "sorting", "searching"])
        else:
            category = random.choice(["dynamic_programming", "graphs", "trees", "strings"])
        questions = DSA_QUESTIONS.get(category, DSA_QUESTIONS["arrays"])
    else:
        questions = DSA_QUESTIONS[category]
    
    if isinstance(questions, dict):
        difficulty_questions = questions.get(difficulty.lower(), questions.get("hard", []))
    else:
        difficulty_questions = questions
    
    if difficulty == "deep_dive":
        full_questions = DSA_QUESTIONS["dynamic_programming"] + DSA_QUESTIONS["graphs"] + DSA_QUESTIONS["trees"] + DSA_QUESTIONS["strings"]["hard"]
        question = random.choice(full_questions)
    elif difficulty == "basic":
        question = random.choice(DSA_QUESTIONS["arrays"] + DSA_QUESTIONS["linked_lists"] + DSA_QUESTIONS["sorting"])
    else:
        question = random.choice(questions)
    
    return f"Implement in {difficulty} difficulty: {question}. Explain the time and space complexity."


def generate_followup(question: str, answer: str, score: float) -> str:
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": f"You are ARIA. The candidate scored {score:.1f}/10 on this answer. Original question: {question} Their answer: {answer} Generate ONE targeted follow-up question that probes their weak point. Return ONLY the follow-up question. No preamble. No explanation."
                },
                {
                    "role": "user",
                    "content": "Generate follow-up question."
                }
            ],
            max_tokens=150,
            temperature=0.7
        )
        result = response.choices[0].message.content
        logger.info(f"Follow-up generated with score {score:.1f}")
        return result
    except Exception as e:
        logger.error(f"Groq followup generation failed: {e}")
        return "Can you elaborate on that point with more specific details?"


def evaluate_answer(question: str, answer: str, job_role: str) -> dict:
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": f"You are ARIA evaluating a technical interview answer. Question: {question} Candidate's answer: {answer} Job role: {job_role} Return ONLY valid JSON (no markdown, no backticks) with these exact keys: {{'claude_score': <float 0-10>, 'feedback': '<one sentence max>', 'depth_mode': '<surface or deep_dive or stress_test>'}}"
                },
                {
                    "role": "user",
                    "content": "Evaluate this answer."
                }
            ],
            max_tokens=300,
            temperature=0.3
        )
        result_text = response.choices[0].message.content.strip()
        result = json.loads(result_text)
        logger.info(f"Answer evaluated: score={result.get('claude_score', 5.0)}")
        return result
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed: {e}, response: {response.choices[0].message.content}")
        return {"claude_score": 5.0, "feedback": "Answer received.", "depth_mode": "surface"}
    except Exception as e:
        logger.error(f"Groq evaluation failed: {e}")
        return {"claude_score": 5.0, "feedback": "Answer received.", "depth_mode": "surface"}


def generate_ideal_answer(question: str, job_role: str) -> str:
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": f"Generate a concise ideal answer (60-80 words) for this interview question for a {job_role} candidate: {question} Return only the answer text. No preamble."
                },
                {
                    "role": "user",
                    "content": "Generate ideal answer."
                }
            ],
            max_tokens=150,
            temperature=0.5
        )
        result = response.choices[0].message.content
        logger.info(f"Ideal answer generated for: {question[:50]}...")
        return result
    except Exception as e:
        logger.error(f"Ideal answer generation failed: {e}")
        return "A comprehensive answer would demonstrate deep understanding of the subject with practical examples."
