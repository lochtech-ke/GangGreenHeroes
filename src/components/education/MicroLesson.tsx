/**
 * Micro Lesson Component
 * Displays individual lessons with support for multiple media types
 */

import React, { useState } from 'react';
import type { Lesson } from '../../types/platform.types';

interface MicroLessonProps {
  lesson: Lesson;
  onComplete: () => void;
  isCompleted: boolean;
}

export const MicroLesson: React.FC<MicroLessonProps> = ({
  lesson,
  onComplete,
  isCompleted,
}) => {
  const [showContent, setShowContent] = useState(false);

  const renderMediaContent = () => {
    switch (lesson.mediaType) {
      case 'video':
        return (
          <div className="aspect-w-16 aspect-h-9 mb-6">
            <iframe
              src={lesson.mediaUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-lg"
            />
          </div>
        );

      case 'infographic':
        return (
          <div className="mb-6">
            <img
              src={lesson.mediaUrl}
              alt={lesson.title}
              className="w-full rounded-lg shadow-md"
            />
          </div>
        );

      case 'interactive':
        return (
          <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-green-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-700 mb-4">
                Interactive content coming soon!
              </p>
              {lesson.mediaUrl && (
                <a
                  href={lesson.mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Open Interactive Content
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        );

      case 'text':
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Lesson Header */}
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setShowContent(!showContent)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Completion Indicator */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {isCompleted ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <span className="text-sm font-medium">{lesson.orderIndex}</span>
              )}
            </div>

            {/* Lesson Title */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {lesson.title}
              </h3>
              <div className="mt-1 flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {lesson.mediaType}
                </span>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Icon */}
          <svg
            className={`h-6 w-6 text-gray-400 transition-transform ${
              showContent ? 'transform rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Lesson Content */}
      {showContent && (
        <div className="px-6 pb-6 border-t border-gray-200">
          <div className="pt-6">
            {/* Media Content */}
            {renderMediaContent()}

            {/* Text Content */}
            <div className="prose max-w-none mb-6">
              <div
                dangerouslySetInnerHTML={{ __html: lesson.content }}
                className="text-gray-700 leading-relaxed"
              />
            </div>

            {/* Complete Button */}
            {!isCompleted && (
              <div className="flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Mark as Complete
                </button>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center justify-end text-green-600">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Completed</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
