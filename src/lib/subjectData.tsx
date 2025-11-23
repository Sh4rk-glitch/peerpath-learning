import React from 'react';
import { Microscope, Calculator, BookText, Languages, Palette, Music, Dumbbell, Code, FlaskConical } from 'lucide-react';

export const ALL_SUBJECTS: Array<any> = [
  { id: 'ap-biology', title: 'AP Biology', name: 'AP Biology', category: 'science', icon: <Microscope className="h-6 w-6" /> },
  { id: 'chemistry', title: 'Chemistry', name: 'Chemistry', category: 'science', icon: <FlaskConical className="h-6 w-6" /> },
  { id: 'calculus', title: 'Calculus', name: 'Calculus', category: 'math', icon: <Calculator className="h-6 w-6" /> },
  { id: 'statistics', title: 'Statistics', name: 'Statistics', category: 'math', icon: <Calculator className="h-6 w-6" /> },
  { id: 'world-history', title: 'World History', name: 'World History', category: 'humanities', icon: <BookText className="h-6 w-6" /> },
  { id: 'literature', title: 'Literature', name: 'Literature', category: 'humanities', icon: <BookText className="h-6 w-6" /> },
  { id: 'spanish', title: 'Spanish', name: 'Spanish', category: 'language', icon: <Languages className="h-6 w-6" /> },
  { id: 'french', title: 'French', name: 'French', category: 'language', icon: <Languages className="h-6 w-6" /> },
  { id: 'digital-art', title: 'Digital Art', name: 'Digital Art', category: 'arts', icon: <Palette className="h-6 w-6" /> },
  { id: 'music-theory', title: 'Music Theory', name: 'Music Theory', category: 'arts', icon: <Music className="h-6 w-6" /> },
  { id: 'computer-science', title: 'Computer Science', name: 'Computer Science', category: 'tech', icon: <Code className="h-6 w-6" /> },
  { id: 'physical-education', title: 'Physical Education', name: 'Physical Education', category: 'health', icon: <Dumbbell className="h-6 w-6" /> },
];

export default ALL_SUBJECTS;
