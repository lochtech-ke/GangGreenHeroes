import React from 'react';
import { BadgeGallery } from '../components/nft/BadgePreview';

export const BadgeGalleryPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            #GangGreen NFT Badge System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Earn beautiful geometric badges for your environmental contributions. 
            Each badge is dynamically generated and can be minted as an NFT on the blockchain.
          </p>
        </div>

        <BadgeGallery />

        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Badge Types & Criteria</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🌳 Tree Planter</h3>
              <p className="text-sm text-gray-600 mb-2">
                Awarded for planting trees and contributing to reforestation efforts.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>Bronze: 10+ trees</li>
                <li>Silver: 50+ trees</li>
                <li>Gold: 100+ trees</li>
                <li>Platinum: 500+ trees</li>
                <li>Diamond: 1,000+ trees</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🛡️ Forest Guardian</h3>
              <p className="text-sm text-gray-600 mb-2">
                Recognizes dedication to protecting forest ecosystems.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>Bronze: 1+ initiative</li>
                <li>Silver: 3+ initiatives</li>
                <li>Gold: 5+ initiatives</li>
                <li>Platinum: 10+ initiatives</li>
                <li>Diamond: 20+ initiatives</li>
              </ul>
            </div>

            <div className="border-l-4 border-teal-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🍃 Carbon Champion</h3>
              <p className="text-sm text-gray-600 mb-2">
                Honors contributions to carbon sequestration and climate action.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>Bronze: 100+ kg CO₂</li>
                <li>Silver: 500+ kg CO₂</li>
                <li>Gold: 1,000+ kg CO₂</li>
                <li>Platinum: 5,000+ kg CO₂</li>
                <li>Diamond: 10,000+ kg CO₂</li>
              </ul>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⭐ Eco Warrior</h3>
              <p className="text-sm text-gray-600 mb-2">
                Celebrates active participation in environmental conservation.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>Bronze: 1,000+ points</li>
                <li>Silver: 5,000+ points</li>
                <li>Gold: 10,000+ points</li>
                <li>Platinum: 25,000+ points</li>
                <li>Diamond: 50,000+ points</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⛰️ Green Pioneer</h3>
              <p className="text-sm text-gray-600 mb-2">
                Acknowledges leadership and innovation in sustainable development.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>Bronze: Level 5+</li>
                <li>Silver: Level 10+</li>
                <li>Gold: Level 20+</li>
                <li>Platinum: Level 30+</li>
                <li>Diamond: Level 50+</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-md p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl mb-2">1️⃣</div>
              <h3 className="font-semibold mb-2">Earn Through Action</h3>
              <p className="text-sm text-green-100">
                Plant trees, join initiatives, and participate in conservation activities to qualify for badges.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">2️⃣</div>
              <h3 className="font-semibold mb-2">Automatic Generation</h3>
              <p className="text-sm text-green-100">
                Badges are dynamically generated with geometric art based on your achievements and tier.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">3️⃣</div>
              <h3 className="font-semibold mb-2">Mint as NFT</h3>
              <p className="text-sm text-green-100">
                Convert your badges into blockchain NFTs that you truly own and can showcase forever.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
