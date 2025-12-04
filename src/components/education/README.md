# Educational Content System

This directory contains components for the educational content system, which provides learning modules, lessons, quizzes, and certificates to users.

## Components

### LearningDashboard
Main dashboard for browsing and accessing learning modules. Features:
- Module overview with filtering by category and difficulty
- Progress tracking statistics
- Daily environmental nuggets
- Module cards with progress indicators

### MicroLesson
Individual lesson component supporting multiple media types:
- Text content with HTML formatting
- Video embeds (YouTube, Vimeo, etc.)
- Infographic images
- Interactive content (external links)
- Expandable/collapsible interface
- Completion tracking

### Quiz
Interactive quiz component for module assessments:
- Multiple choice questions
- Immediate feedback with explanations
- Progress tracking
- Score calculation
- Pass/fail threshold (70%)
- Question navigation

### Certificate
Digital certificate generation and display:
- Professional certificate design
- Download/print functionality
- Social sharing
- Certificate verification ID
- Certificate list view

## Service Layer

### EducationService (`src/services/education.service.ts`)
Handles all educational content operations:
- `getLearningModules()` - Fetch available modules with filters
- `getLearningModule(id)` - Get module with lessons
- `getUserProgress(userId)` - Get user's learning progress
- `completeLesson()` - Mark lesson as completed
- `completeModule()` - Complete module and award rewards
- `generateCertificate()` - Generate certificate for completed module
- `getLearningStats()` - Get user's learning statistics

## Database Schema

### Tables
- `learning_modules` - Educational modules
- `lessons` - Individual lessons within modules
- `user_learning_progress` - User progress tracking
- `daily_nuggets` - Daily environmental facts

### Key Features
- Row Level Security (RLS) policies
- Automatic Green Coin rewards on completion
- Progress tracking with completed lessons array
- Certificate issuance tracking

## Usage

### Basic Module Flow
1. User browses modules on Learning Dashboard
2. User selects a module and views lessons
3. User completes lessons one by one
4. User takes quiz after completing all lessons
5. User receives Green Coins and certificate upon passing

### Integration Points
- Green Coin wallet system for rewards
- User authentication for progress tracking
- Navigation system for routing
- Badge system for learning achievements

## Routes

- `/learning` - Learning Dashboard
- `/learning/:moduleId` - Module detail with lessons
- `/certificates` - User's earned certificates

## Requirements Validated

This implementation addresses:
- **A4.1**: Daily nuggets and micro-lessons
- **A4.2**: Green Coins awarded on completion
- **A4.3**: Progress tracking
- **A4.4**: Interactive quiz component
- **A4.5**: Digital certificate issuance

## Future Enhancements

- Video progress tracking
- Interactive simulations
- Peer learning features
- Module recommendations based on interests
- Learning streaks and achievements
- Social sharing of certificates
- Certificate verification system
