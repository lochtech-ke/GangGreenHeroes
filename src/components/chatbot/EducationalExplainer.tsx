/**
 * Educational Explainer Component
 * Q&A interface for environmental concept explanations
 * Implements Requirement A2.2: Educational explainer with concept simplification
 */

import React, { useState } from 'react';
import { aiCompanionService } from '../../services/aiCompanion.service';
import { ConceptExplanation, ExplanationRequest } from '../../types/aiCompanion.types';
import { AgeCohort } from '../../types/contentCuration.types';

interface EducationalExplainerProps {
  ageCohort: AgeCohort;
  userInterests?: string[];
  onClose?: () => void;
}

export const EducationalExplainer: React.FC<EducationalExplainerProps> = ({
  ageCohort,
  userInterests,
  onClose
}) => {
  const [selectedConcept, setSelectedConcept] = useState<string>('');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [explanation, setExplanation] = useState<ConceptExplanation | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'concepts' | 'questions'>('concepts');

  const commonConcepts = aiCompanionService.getCommonConcepts();

  const handleExplainConcept = async (concept: string) => {
    setLoading(true);
    setError('');
    setExplanation(null);
    setAnswer('');

    try {
      const request: ExplanationRequest = {
        concept,
        ageCohort,
        userInterests
      };

      const result = await aiCompanionService.explainConcept(request);
      setExplanation(result);
      setSelectedConcept(concept);
    } catch (err: any) {
      setError(err.message || 'Failed to explain concept. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!customQuestion.trim()) return;

    setLoading(true);
    setError('');
    setExplanation(null);
    setAnswer('');

    try {
      const result = await aiCompanionService.answerQuestion(
        customQuestion,
        ageCohort
      );
      setAnswer(result);
    } catch (err: any) {
      setError(err.message || 'Failed to answer question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRelatedConceptClick = (concept: string) => {
    setActiveTab('concepts');
    handleExplainConcept(concept);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            🌱 Environmental Concepts Explained
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Learn about climate action in simple, clear language
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('concepts')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'concepts'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📚 Browse Concepts
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'questions'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ❓ Ask a Question
        </button>
      </div>

      {/* Concepts Tab */}
      {activeTab === 'concepts' && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Select a concept to learn about:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {commonConcepts.map((concept) => (
                <button
                  key={concept}
                  onClick={() => handleExplainConcept(concept)}
                  disabled={loading}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    selectedConcept === concept
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="text-sm font-medium">{concept}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Explanation Display */}
          {explanation && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {explanation.concept}
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {explanation.simpleExplanation}
                </p>
              </div>

              {explanation.examples.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    🌍 Examples in Kenya:
                  </h4>
                  <ul className="space-y-2">
                    {explanation.examples.map((example, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span className="text-gray-700">{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {explanation.actionableSteps && explanation.actionableSteps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    ✅ What You Can Do:
                  </h4>
                  <ul className="space-y-2">
                    {explanation.actionableSteps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">→</span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {explanation.relatedConcepts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    🔗 Related Concepts:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {explanation.relatedConcepts.map((concept, index) => (
                      <button
                        key={index}
                        onClick={() => handleRelatedConceptClick(concept)}
                        className="px-3 py-1 bg-white border border-green-300 rounded-full text-sm text-green-700 hover:bg-green-100 transition-colors"
                      >
                        {concept}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Ask any environmental question:
            </h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="e.g., How does tree planting help fight climate change?"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={handleAskQuestion}
                disabled={loading || !customQuestion.trim()}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Thinking...' : 'Ask'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Ask specific questions about climate action, conservation, or environmental topics
            </p>
          </div>

          {/* Answer Display */}
          {answer && (
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  GM
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Green Mentor says:</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{answer}</p>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Questions */}
          {!answer && !loading && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">
                Popular questions:
              </h4>
              <div className="space-y-2">
                {[
                  'What is carbon sequestration and why does it matter?',
                  'How can I reduce my carbon footprint in Kenya?',
                  'What are the benefits of planting indigenous trees?',
                  'How does deforestation affect climate change?'
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCustomQuestion(question);
                      handleAskQuestion();
                    }}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-sm text-gray-700"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Green Mentor is thinking...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
