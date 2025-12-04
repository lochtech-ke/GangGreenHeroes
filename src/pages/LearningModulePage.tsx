/**
 * Learning Module Page
 * Displays a single learning module with lessons and quiz
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { educationService } from '../services/education.service';
import { useAuth } from '../hooks/useAuth';
import { MicroLesson } from '../components/education/MicroLesson';
import { Quiz } from '../components/education/Quiz';
import type { LearningModule, UserLearningProgress } from '../types/platform.types';

export const LearningModulePage: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [module, setModule] = useState<LearningModule | null>(null);
  const [progress, setProgress] = useState<UserLearningProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (user && moduleId) {
      loadModuleData();
    }
  }, [user, moduleId]);

  const loadModuleData = async () => {
    if (!user || !moduleId) return;

    try {
      setLoading(true);
      setError(null);

      const [moduleData, progressData] = await Promise.all([
        educationService.getLearningModule(moduleId),
        educationService.getModuleProgress(user.id, moduleId),
      ]);

      setModule(moduleData);
      setProgress(progressData);
    } catch (err) {
      console.error('Failed to load module:', err);
      setError(err instanceof Error ? err.message : 'Failed to load module');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!user || !moduleId) return;

    try {
      await educationService.completeLesson(user.id, moduleId, lessonId);
      await loadModuleData(); // Reload to get updated progress
    } catch (err) {
      console.error('Failed to complete lesson:', err);
      alert('Failed to mark lesson as complete. Please try again.');
    }
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    return progress?.completedLessons?.includes(lessonId) || false;
  };

  const allLessonsCompleted = (): boolean => {
    if (!module || !module.lessons || !progress) return false;
    return module.lessons.every((lesson) =>
      progress.completedLessons?.includes(lesson.id)
    );
  };

  const handleQuizComplete = async (score: number) => {
    if (!user || !moduleId) return;

    try {
      setCompleting(true);
      const result = await educationService.completeModule(user.id, moduleId, score);

      // Show success message
      alert(
        `Congratulations! You've completed the module and earned ${result.ggCoinsAwarded} GG Coins!`
      );

      // Navigate back to dashboard
      navigate('/learning');
    } catch (err) {
      console.error('Failed to complete module:', err);
      alert('Failed to complete module. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Module not found'}</p>
          <button
            onClick={() => navigate('/learning')}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            ← Back to Learning Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isModuleCompleted = !!progress?.completedAt;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/learning')}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Learning Dashboard
      </button>

      {/* Module Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {module.title}
            </h1>
            <div className="flex items-center space-x-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {module.category}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {module.difficulty}
              </span>
            </div>
          </div>
          {isModuleCompleted && (
            <div className="flex-shrink-0">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Completed
              </div>
            </div>
          )}
        </div>

        <p className="text-gray-700 mb-6">{module.description}</p>

        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <span className="flex items-center">
            <svg
              className="h-5 w-5 mr-2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {module.duration} minutes
          </span>
          <span className="flex items-center">
            <svg
              className="h-5 w-5 mr-2 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                clipRule="evenodd"
              />
            </svg>
            {module.green_coin_reward} GG Coins
          </span>
          <span className="flex items-center">
            <svg
              className="h-5 w-5 mr-2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {module.lessons?.length || 0} lessons
          </span>
        </div>
      </div>

      {/* Lessons */}
      {!showQuiz && (
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lessons</h2>
          {module.lessons?.map((lesson) => (
            <MicroLesson
              key={lesson.id}
              lesson={lesson}
              onComplete={() => handleLessonComplete(lesson.id)}
              isCompleted={isLessonCompleted(lesson.id)}
            />
          ))}
        </div>
      )}

      {/* Quiz Section */}
      {showQuiz ? (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Module Quiz</h2>
          <Quiz
            questions={[
              // Sample questions - in production, these would come from the database
              {
                id: '1',
                question: 'What is the primary benefit of tree planting?',
                options: [
                  'Carbon sequestration',
                  'Aesthetic beauty',
                  'Shade provision',
                  'All of the above',
                ],
                correctAnswer: 3,
                explanation:
                  'Tree planting provides multiple benefits including carbon sequestration, aesthetic beauty, shade, and biodiversity support.',
              },
            ]}
            onComplete={handleQuizComplete}
          />
        </div>
      ) : (
        !isModuleCompleted &&
        allLessonsCompleted() && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to Test Your Knowledge?
            </h3>
            <p className="text-gray-600 mb-6">
              You've completed all lessons! Take the quiz to earn your GG Coins
              and certificate.
            </p>
            <button
              onClick={() => setShowQuiz(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Start Quiz
            </button>
          </div>
        )
      )}

      {completing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-700">Completing module...</p>
          </div>
        </div>
      )}
    </div>
  );
};
