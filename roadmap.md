# Dark Mode Implementation Roadmap for Flux

## Overview
This roadmap outlines the steps required to implement a dark mode feature across the entire Flux web application. The implementation will include a toggle button in the navigation bar and ensure all components remain visually appealing and readable in both light and dark modes.

## Color Scheme
The dark mode will use the following color palette:

### Light Mode (Current)
- Background: #ffffff (white)
- Text: #111827, #374151, #4b5563, #6b7280 (various shades of gray)
- Primary: #2563eb, #1e3a8a (blue shades)
- Secondary: #8b5cf6 (purple)
- Accent: #dc2626 (red for logout/remove buttons)
- Card/Container: #ffffff (white)
- Border/Divider: #e5e7eb (light gray)
- Shadow: rgba(0, 0, 0, 0.1)

### Dark Mode (Proposed)
- Background: #121212 (very dark gray)
- Text: #f9fafb, #e5e7eb, #d1d5db, #9ca3af (various shades of light gray/white)
- Primary: #3b82f6, #60a5fa (blue shades)
- Secondary: #a78bfa (lighter purple)
- Accent: #ef4444 (brighter red for better visibility)
- Card/Container: #1f2937 (dark gray)
- Border/Divider: #374151 (medium gray)
- Shadow: rgba(0, 0, 0, 0.5)

## Implementation Steps

### 1. Create CSS Variables for Theme Colors
Create a global CSS file with CSS variables for all theme colors to make switching between light and dark modes easier.

### 2. Implement Theme Context
Create a React context to manage the theme state (light/dark) across the application.

### 3. Add Dark Mode Toggle to Navigation
Add a toggle button to the Navigation component to switch between light and dark modes.

### 4. Update Component Styles
Update the CSS for all components to use the theme variables instead of hardcoded colors.

### 5. Test and Refine
Test the dark mode across all pages and components, making adjustments as needed.

## Detailed Implementation Plan

### 1. Create CSS Variables for Theme Colors
Create a new file `src/styles/Theme.css` with CSS variables for both light and dark modes.

### 2. Implement Theme Context
Create a new file `src/ThemeContext.js` to manage the theme state and provide it to all components.

### 3. Add Dark Mode Toggle to Navigation
Update the Navigation component to include a toggle button for switching between light and dark modes.

### 4. Update Component Styles
Modify all CSS files to use the theme variables instead of hardcoded colors. The following files need to be updated:

#### Component Styles
- Navigation.css
- Achievements.css
- BookList.css
- Challenges.css
- DisplayBooks.css
- FetchBooks.css
- FollowButton.css
- GamificationBadge.css
- Leaderboard.css
- ReadlistPopup.css
- StarRating.css

#### Page Styles
- Author-Details.css
- BestSellers.css
- Book-Details.css
- Favorites.css
- Home.css
- Login.css
- Profile.css
- Readlist.css
- ReadlistPage.css
- Register.css
- UserProfile.css
- UserSearch.css

### 5. Test and Refine
Test the dark mode implementation across all pages and components, making adjustments as needed to ensure readability and visual appeal.

## Component-Specific Considerations

### Navigation
- The navigation bar should have a dark background in dark mode
- The active link should have a darker blue background in dark mode
- The Flux logo should remain visible against the dark background

### Forms (Login, Register, etc.)
- Form inputs should have darker backgrounds with lighter text
- Form buttons should maintain their blue color but with adjusted brightness

### Book Cards and Lists
- Book cards should have dark backgrounds with light text
- Book covers should remain unchanged
- Hover effects should be adjusted for visibility in dark mode

### Achievements and Challenges
- Progress bars should maintain their color but with adjusted brightness
- Badges and icons should remain visible against dark backgrounds
- Achievement cards should have dark backgrounds with light text

### Gamification Elements
- Notifications should have darker backgrounds with light text
- Points and level indicators should remain visible and appealing

## Persistence
The user's theme preference should be saved in localStorage to persist across sessions.

## Accessibility Considerations
- Ensure sufficient contrast between text and background colors
- Maintain focus indicators for keyboard navigation
- Test with screen readers to ensure compatibility

## Timeline
1. Set up theme infrastructure (CSS variables and context) - Day 1
2. Implement toggle in navigation - Day 1
3. Update component styles - Days 2-3
4. Test and refine - Day 4
5. Final review and deployment - Day 5
