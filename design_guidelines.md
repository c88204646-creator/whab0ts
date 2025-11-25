# Design Guidelines: Business Automation SaaS Platform

## Design Approach

**Selected Approach**: Design System with Premium SaaS References

**References**: 
- Primary: Figma (for refined UI precision and enterprise polish)
- Secondary: Linear (clean hierarchy, purposeful spacing), Notion (modular organization)
- Tertiary: Stripe Dashboard (professional restraint, confident whitespace)

**Core Principles**:
- Generous whitespace creates breathing room and premium feel
- Precision over decoration - pixel-perfect alignment throughout
- Confident use of space - components don't crowd each other
- Enterprise-grade polish with approachable, modern aesthetics
- Information hierarchy through spacing and typography, not visual noise

---

## Typography System

**Font Stack**:
- **Primary**: Inter (Google Fonts CDN) - exceptional clarity at all sizes, professional
- **Monospace**: JetBrains Mono - technical data, API keys, code snippets

**Type Scale**:
- **Page Headers**: text-3xl font-semibold (main dashboard titles)
- **Section Headers**: text-xl font-semibold (module titles, card headers)
- **Subsection Headers**: text-base font-semibold (form sections, list headers)
- **Body Text**: text-sm font-normal (primary interface content)
- **Labels/Meta**: text-xs font-medium (form labels, timestamps, badges)
- **Buttons**: text-sm font-medium

**Hierarchy Rules**:
- Limit to 2-3 sizes per view for clarity
- Rely on weight (normal/medium/semibold) for differentiation
- Line-height: leading-relaxed (body), leading-tight (headers)
- Letter-spacing: tracking-tight for large headers, default for body

---

## Layout System

**Spacing Primitives**: Tailwind units **4, 6, 8, 12, 16, 24**

- **Micro**: gap-4, p-4 (within components)
- **Component**: gap-6, p-6 (between elements)
- **Section**: gap-8, py-12, p-8 (major divisions)
- **Generous**: py-16, gap-12 (premium spacing between major sections)
- **Page margins**: px-8 (mobile), px-12 (desktop)

**Dashboard Structure**:
```
├── Sidebar (fixed left, w-64, generous padding)
│   ├── Brand area (h-20, px-6)
│   ├── Navigation (px-4, py-8, space-y-2)
│   └── User section (h-24, px-6)
├── Main Area (flex-1, ml-64)
│   ├── Top Bar (h-20, sticky, px-8)
│   └── Content (p-8, max-w-7xl mx-auto)
```

**Grid Systems**:
- **Dashboard Cards**: grid-cols-1 lg:grid-cols-2 xl:grid-cols-3, gap-8
- **Data Tables**: Full-width with ample row height (min-h-16)
- **Two-Column Layouts**: grid-cols-[360px_1fr], gap-8
- **Forms**: Single column max-w-2xl with py-8 spacing between sections

**Whitespace Strategy**:
- Double typical spacing between major sections (py-12 to py-16)
- Cards have generous internal padding (p-6 to p-8)
- List items minimum height h-14 for comfortable scanning
- Modal dialogs: p-8 internal spacing

---

## Component Library

### Navigation

**Sidebar**:
- Section headers: text-xs font-semibold tracking-wider uppercase, mb-4
- Menu items: h-10, px-4, rounded-lg, flex items-center gap-3
- Icons: Heroicons outline, w-5 h-5
- Active state: distinct treatment with left indicator (w-1 absolute)
- Generous spacing: space-y-2 between items, py-8 between sections

**Top Bar**:
- Clean horizontal layout, h-20
- Left: Breadcrumbs or page title
- Right: Search (max-w-sm), notifications, user avatar (w-10 h-10)
- Subtle bottom border for definition

### Cards & Containers

**Dashboard Cards**:
- Border: border with subtle treatment
- Padding: p-6 to p-8
- Rounded: rounded-xl
- Shadow: Minimal or none (rely on borders)
- Header: flex justify-between items-center mb-6
- Title: text-lg font-semibold
- Actions: Icon buttons or subtle text links

**Metric Cards**:
- Large numbers: text-3xl font-semibold
- Label: text-sm, mb-2
- Trend indicator: Small badge with arrow icon
- Generous padding: p-8

### Data Display

**Tables**:
- Header row: text-xs font-semibold uppercase tracking-wider
- Data rows: min-h-16, border-b
- Cell padding: px-6 py-4
- Hover state on rows
- Action column: right-aligned icon buttons

**Status Badges**:
- Rounded: rounded-full
- Padding: px-3 py-1
- Text: text-xs font-medium
- Include dot indicator (w-2 h-2 rounded-full mr-2)

**List Items**:
- Minimum height: h-14
- Padding: px-6 py-3
- Avatar: w-10 h-10 rounded-full
- Two-line layout: name/title on top, meta below
- Right section: timestamp or actions

### Forms & Inputs

**Input Fields**:
- Height: h-12 (generous touch targets)
- Padding: px-4
- Border: border with rounded-lg
- Labels: text-sm font-medium mb-2
- Focus: ring-2 ring-offset-2
- Helper text: text-xs mt-2

**Buttons**:
- Primary: h-12, px-6, rounded-lg, text-sm font-medium
- Secondary: Same dimensions, border variant
- Icon buttons: w-10 h-10, rounded-lg, centered icon (w-5 h-5)
- Ghost buttons: Minimal treatment for tertiary actions
- Loading state: Spinner with opacity reduction

**Modals**:
- Backdrop: blur effect
- Container: max-w-lg to max-w-2xl, rounded-2xl
- Padding: p-8
- Header: text-xl font-semibold, mb-6
- Footer: flex gap-3 justify-end, mt-8
- Close button: Absolute top-right (top-6 right-6)

### Chat Interface Components

**Conversation List**:
- Fixed width: w-96
- Item height: min-h-20, px-6 py-4
- Avatar: w-12 h-12
- Active chat: Distinct background
- Unread badge: Rounded, positioned top-right

**Message Bubbles**:
- Max width: max-w-md
- Padding: px-4 py-3
- Rounded: rounded-2xl (asymmetric corners)
- Spacing between: space-y-3
- Timestamp: text-xs, mt-1

**Message Input**:
- Fixed bottom area, h-24
- Input: Flexible height (min-h-12), rounded-xl
- Actions: Icon buttons flanking input

---

## Module Layouts

### Dashboard Home
- Welcome header with user name, mb-12
- Metrics grid: 4 columns on xl screens, gap-8
- Activity feed: Two-column (feed | details), gap-8
- Generous vertical spacing: py-16 between sections

### Connections Module
- Header with search and filters, mb-8
- Card grid: 3 columns xl, gap-8
- "Add Connection" card: Dashed border, centered content (p-12)
- Empty state: Centered illustration (max-w-sm), text-center

### Automation Builder
- Three-column layout: Trigger | Actions | Settings
- Canvas area: Generous padding (p-12)
- Node components: min-w-64, p-6, rounded-xl
- Connection lines: SVG paths between nodes

### Settings Module
- Vertical tabs: Fixed left (w-56), main content (flex-1)
- Content area: max-w-3xl, py-8
- Form sections: space-y-12
- Section headers: text-xl font-semibold, mb-6
- Save bar: Sticky bottom with backdrop blur

---

## Iconography

**Library**: Heroicons (outline primary, solid for active states)

**Sizes**:
- Navigation: w-5 h-5
- Buttons: w-5 h-5  
- Feature icons: w-8 h-8
- Large illustrations: w-16 h-16
- Status dots: w-2 h-2

**Key Icons**:
- Automation: BoltIcon
- Connections: LinkIcon
- Chat: ChatBubbleLeftRightIcon
- Settings: Cog6ToothIcon
- Users: UserGroupIcon
- Analytics: ChartBarIcon

---

## Responsive Behavior

**Breakpoints**:
- Mobile (< 768px): Single column, hamburger menu, full-screen modals
- Tablet (768-1024px): 2-column grids, collapsible sidebar
- Desktop (> 1024px): Full layouts, 3-column grids

**Mobile Adaptations**:
- Sidebar becomes drawer overlay
- Reduce padding: p-6 to p-4
- Stack all grid layouts to single column
- Tables: Card-based view instead of horizontal scroll
- Chat: Full-screen conversation view with back button

---

## Accessibility

- Contrast: Minimum 4.5:1 for all text
- Focus indicators: ring-2 ring-offset-2 on all interactive elements
- ARIA labels: All icon-only buttons
- Keyboard navigation: Full support with logical tab order
- Form validation: Inline errors with clear messaging
- Loading states: Announced to screen readers
- Skip links: "Skip to main content" for keyboard users

---

## Images

**Dashboard Context** - No traditional hero images

**Illustrations**:
- Empty states: Modern line illustrations (undraw.co, streamline), max-w-xs, centered
- Onboarding screens: Full-screen illustrations (max-w-lg) with content overlay
- Error states: Friendly illustrations (max-w-sm)

**User-Generated Content**:
- Avatars: Circular (rounded-full), 32px (lists), 40px (cards), 48px (profiles)
- Brand logos: Square containers (w-10 h-10), rounded-lg, centered logos

**Feature Graphics**:
- QR codes: 256x256px, centered in modal
- Connection status: Icon-based indicators (no images)
- Automation flow: SVG-based node diagrams