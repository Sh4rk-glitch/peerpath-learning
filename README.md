# PeerPath

## Project info

**URL**: peerpath-learning.vercel.app

## What is PeerPath?

1. Structured Learning Pathways
At its heart, PeerPath is organized around Subjects (like AP Biology, Calculus, Spanish, etc.). Each subject has a defined Learning Pathway, which is essentially a curriculum broken down into a series of lessons.

When you select a subject, you are presented with a sequence of lessons, allowing you to progress from one topic to the next in a logical order. This structured approach helps you build a "skill tree" by mastering concepts step-by-step.

2. AI-Powered Content Generation
This is one of the most powerful features of PeerPath. The platform uses a hybrid approach to create rich and comprehensive lesson content:

Built-in Curriculum: It starts with a foundation of pre-defined curricula for various subjects. These are concise overviews of each lesson topic.
AI Enrichment: To create in-depth learning material, PeerPath uses the Gemini AI model. It sends the basic lesson information to the AI to generate a detailed, multi-part lesson that includes:
An Overview of the topic.
A list of Key Concepts and vocabulary.
A Detailed Explanation with examples.
Worked Examples & Practice Problems.
A discussion of Real-world Applications.
A Summary and a preview of the next lesson.
Fallback System: If the AI service is unavailable, the application has a built-in function to expand the basic lesson outlines into a similarly structured, readable format, ensuring that the learning experience is never interrupted.
3. Interactive, AI-Generated Quizzes
To test your understanding, each lesson is paired with a quiz. The quiz system is also AI-driven and highly flexible:

On-Demand Generation: When you decide to take a quiz, PeerPath generates it on the spot based on the content of the lesson you just completed.
Dual-Generation Strategy: For an optimal user experience, it first generates a "local" quiz almost instantly using algorithms to pull key terms and sentences from the lesson text. In the background, it makes a call to the Gemini AI to generate a more nuanced and "enhanced" set of questions. You can start with the local quiz and then switch to the AI-generated one when it's ready.
Customizable Quizzes: You can customize the quiz by selecting the number of questions and the "style" of the quiz, choosing from:
Vocab: Focuses on definitions and key terms.
Concept: Tests your understanding of core concepts.
Application: Presents problems that require you to apply what you've learned.
Detailed Feedback: After submitting your answers, you get a detailed results page showing your score, the time taken, and a review of each question with an explanation of the correct answer.
4. Live Collaborative Study Sessions
Beyond self-paced learning, PeerPath is built for real-time collaboration:

Scheduling System: The "Schedule" page displays a list of upcoming study sessions created by other users. You can browse, filter by subject, and join sessions.
Hosting: You can create your own study sessions for any subject. You set the title, time, duration, and capacity. The system then generates a meeting link (e.g., Google Meet) for the session.
Backend Integration: This entire scheduling system is powered by a Supabase backend, which manages sessions, participants, and user profiles.
Email Notifications: When you join a session, the platform can send a confirmation email to you, ensuring you have all the details for the upcoming study group.
Host Management: If you are the host of a session, you have tools to manage it, including editing the details, viewing the list of attendees, or deleting the session.


## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase for backend
- Deployed using vercel

##Usage

Create an Account
Sign up or log in using Supabase’s auth system.
Then you are free to explore!

#Join or Host a Micro-Mentoring Session

Select a topic
Choose “Host” or “Join Now”
Start your timed, focused session

#Enter a Live Study Room

Join classmates
Take AI-generated quizzes

#Track Your Progress
Check mastery scores, streaks, upcoming meetings, and suggestions.

##Future Improvements

Larger AI-powered analytics dashboard for teachers or clubs
Gamified badge system for micro-mentors
Mobile app version with offline flashcards
Collaborative “Study Pathways” built by clubs or teachers
Integration with school LMS systems (Canvas, Schoology)
Real-time whiteboard for advanced study rooms

##This site was built by: Shourya Mishra, Ali Tauqir, Maykel Silalahi
Build for FBLA - Website design
