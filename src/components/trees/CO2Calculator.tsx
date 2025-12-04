import React, { useState } from 'react';
import { TrendingUp, Info, Calculator } from 'lucide-react';
import { treeWalletService } from '../../services/treeWallet.service';

/**
 * CO₂ Calculator Component
 * Interactive calculator for estimating tree CO₂ sequestration
 * Requirements: A8.2
 */
export const CO2Calculator: React.FC = () => {
  const [species, setSpecies] = useState('');
  const [plantedDate, setPlantedDate] = useState('');
  const [height, setHeight] = useState('');
  const [diameter, setDiameter] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const commonSpecies = [
    'Eucalyptus',
    'Bamboo',
    'Acacia',
    'Pine',
    'Cedar',
    'Cypress',
    'Oak',
    'Mahogany',
    'Teak',
    'Mango',
    'Avocado',
    'Citrus',
  ];

  const handleCalculate = () => {
    if (!species || !plantedDate) {
      alert('Please enter species and planted date');
      return;
    }

    const date = new Date(plantedDate);
    if (isNaN(date.getTime())) {
      alert('Invalid date');
      return;
    }

    const heightCm = height ? parseFloat(height) : undefined;
    const diameterCm = diameter ? parseFloat(diameter) : undefined;

    const co2 = treeWalletService.calculateCO2Sequestration(
      species,
      date,
      heightCm,
      diameterCm
    );

    setResult(co2);
  };

  const handleReset = () => {
    setSpecies('');
    setPlantedDate('');
    setHeight('');
    setDiameter('');
    setResult(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calculator className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">CO₂ Sequestration Calculator</h2>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
          <p className="text-sm text-blue-800 mb-2">
            This calculator estimates annual CO₂ sequestration based on:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Tree species (different species have different sequestration rates)</li>
            <li>Tree age (younger trees sequester less, peak at 10-20 years)</li>
            <li>Tree size (height and diameter indicate biomass)</li>
          </ul>
          <p className="text-xs text-blue-700 mt-2">
            Note: These are estimates. Actual sequestration varies based on soil, climate, and
            care.
          </p>
        </div>
      )}

      {/* Calculator Form */}
      <div className="space-y-4">
        {/* Species Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tree Species *
          </label>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select a species</option>
            {commonSpecies.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
          {species === 'other' && (
            <input
              type="text"
              placeholder="Enter species name"
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          )}
        </div>

        {/* Planted Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Planted Date *
          </label>
          <input
            type="date"
            value={plantedDate}
            onChange={(e) => setPlantedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Optional Measurements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (cm) <span className="text-gray-500 text-xs">optional</span>
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="e.g., 250"
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diameter (cm) <span className="text-gray-500 text-xs">optional</span>
            </label>
            <input
              type="number"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              placeholder="e.g., 15"
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleCalculate}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center space-x-2"
          >
            <Calculator className="w-5 h-5" />
            <span>Calculate</span>
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result !== null && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Estimated Annual CO₂ Sequestration</p>
              <p className="text-4xl font-bold text-green-600">
                {result.toFixed(1)}
                <span className="text-xl text-gray-600 ml-2">kg/year</span>
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Context Information */}
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-sm text-gray-700">
              <strong>What this means:</strong> This tree removes approximately{' '}
              <strong>{result.toFixed(1)} kg</strong> of CO₂ from the atmosphere each year.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              💡 For context: The average car emits about 4,600 kg of CO₂ per year. You'd need
              about {Math.ceil(4600 / result)} trees like this to offset one car's emissions.
            </p>
          </div>
        </div>
      )}

      {/* Methodology Note */}
      <div className="mt-6 text-xs text-gray-500 border-t pt-4">
        <p>
          <strong>Calculation Methodology:</strong> Estimates are based on species-specific
          sequestration rates, tree age multipliers (peak at 10-20 years), and size factors
          derived from height and diameter measurements. Actual sequestration varies with local
          conditions.
        </p>
      </div>
    </div>
  );
};
