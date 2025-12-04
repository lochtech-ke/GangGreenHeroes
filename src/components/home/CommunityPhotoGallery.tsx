import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IMAGES, IMAGE_ALT_TEXT } from '../../constants/images.constants';

interface CommunityPhoto {
  url: string;
  alt: string;
  caption?: string;
}

interface CommunityPhotoGalleryProps {
  photos?: CommunityPhoto[];
}

export const CommunityPhotoGallery: React.FC<CommunityPhotoGalleryProps> = ({ photos }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<CommunityPhoto | null>(null);

  const defaultPhotos: CommunityPhoto[] = [
    {
      url: IMAGES.community.smilingFaces,
      alt: IMAGE_ALT_TEXT.community.groupAction,
      caption: 'Community members celebrating conservation success',
    },
    {
      url: IMAGES.community.treePlanting1,
      alt: IMAGE_ALT_TEXT.community.treePlanting,
      caption: 'Tree planting initiative in Kakamega Forest',
    },
    {
      url: IMAGES.community.treePlanting2,
      alt: IMAGE_ALT_TEXT.community.treePlanting,
      caption: 'Youth engagement in forest restoration',
    },
    {
      url: IMAGES.community.communityAction,
      alt: IMAGE_ALT_TEXT.community.groupAction,
      caption: 'Collective action for environmental conservation',
    },
    {
      url: IMAGES.community.groupPlanting,
      alt: IMAGE_ALT_TEXT.community.treePlanting,
      caption: 'Community tree planting day',
    },
    {
      url: IMAGES.people.wangariMaathai,
      alt: IMAGE_ALT_TEXT.people.wangariMaathai,
      caption: 'Prof. Wangari Maathai - Our inspiration',
    },
  ];

  const displayPhotos = photos && photos.length > 0 ? photos : defaultPhotos;

  return (
    <>
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayPhotos.map((photo, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.url}
              alt={photo.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            {/* Glass overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium">{photo.caption}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-12 right-0 text-white hover:text-green-400 transition-colors"
                aria-label="Close lightbox"
              >
                <X size={32} />
              </button>

              {/* Image */}
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.alt}
                className="w-full h-auto rounded-lg shadow-2xl"
              />

              {/* Caption */}
              {selectedPhoto.caption && (
                <div className="mt-4 text-center">
                  <p className="text-white text-lg">{selectedPhoto.caption}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribution */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Photos courtesy of{' '}
          <a
            href="https://www.greenbeltmovement.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            The Green Belt Movement
          </a>
        </p>
      </div>
    </>
  );
};
