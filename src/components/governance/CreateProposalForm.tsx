import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { proposalService } from '../../services/proposal.service';
import { governanceTokenService } from '../../services/governanceToken.service';
import type { CreateProposalInput } from '../../types/governance.types';

export default function CreateProposalForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [minTokens, setMinTokens] = useState(100);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<CreateProposalInput>({
    title: '',
    description: '',
    category: 'feature',
    implementation_timeline: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      loadUserBalance();
    }
  }, [user]);

  useEffect(() => {
    loadMinTokensForCategory();
  }, [formData.category]);

  const loadUserBalance = async () => {
    if (!user) return;
    try {
      const userBalance = await governanceTokenService.getBalance(user.id);
      setBalance(userBalance);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadMinTokensForCategory = async () => {
    try {
      const categoryConfig = await proposalService.getCategoryConfig(formData.category);
      if (categoryConfig) {
        setMinTokens(categoryConfig.minimum_tokens_to_create);
      }
    } catch (error) {
      console.error('Error loading category config:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (balance < minTokens) {
      newErrors.balance = `You need at least ${minTokens} governance tokens to create a ${formData.category} proposal`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !user) return;

    setLoading(true);
    try {
      const result = await proposalService.createProposal(user.id, formData);

      if (result.success && result.data) {
        navigate(`/governance/proposals/${result.data.id}`);
      } else {
        alert(result.error?.message || 'Failed to create proposal');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">Please sign in to create a proposal.</p>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview Proposal</h2>
          
          <div className="space-y-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900">{formData.title}</h3>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{formData.description}</p>
            </div>

            {formData.implementation_timeline && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Implementation Timeline</h4>
                <p className="text-gray-600">{formData.implementation_timeline}</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setShowPreview(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Submit Proposal'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (validate()) setShowPreview(true); }} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Proposal</h2>

        {/* Balance Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800">Your Governance Token Balance</p>
              <p className="text-2xl font-bold text-blue-900">{balance} tokens</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-800">Required for {formData.category}</p>
              <p className="text-lg font-semibold text-blue-900">{minTokens} tokens</p>
            </div>
          </div>
          {errors.balance && (
            <p className="mt-2 text-sm text-red-600">{errors.balance}</p>
          )}
        </div>

        {/* Category */}
        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="feature">Feature - New functionality or capability</option>
            <option value="improvement">Improvement - Enhancement to existing features</option>
            <option value="policy">Policy - Platform rules or governance changes</option>
            <option value="other">Other - General proposals</option>
          </select>
        </div>

        {/* Title */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a clear, concise title for your proposal"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.title.length}/200 characters
          </p>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={8}
            placeholder="Provide a detailed description of your proposal. Include the problem it solves, benefits, and any relevant context."
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length} characters (minimum 50)
          </p>
        </div>

        {/* Implementation Timeline */}
        <div className="mb-6">
          <label htmlFor="implementation_timeline" className="block text-sm font-medium text-gray-700 mb-2">
            Implementation Timeline (Optional)
          </label>
          <input
            type="text"
            id="implementation_timeline"
            name="implementation_timeline"
            value={formData.implementation_timeline}
            onChange={handleChange}
            placeholder="e.g., 2-4 weeks after approval"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Estimated time to implement if the proposal passes
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/governance')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Preview Proposal
          </button>
        </div>
      </div>
    </form>
  );
}
