# Design Guidelines: WhatsApp CRM SaaS Dashboard

## Design Approach

**Selected Approach**: Design System with SaaS Dashboard References

**References**: 
- Primary inspiration from leadsales.io and kommo.com for modern CRM aesthetics
- Secondary patterns from Linear (for clean data hierarchy) and Notion (for modular content organization)
- Focus on enterprise-grade functionality with approachable visual design

**Core Principles**:
- Clarity over decoration - every element serves a functional purpose
- Efficient information density without overwhelming users
- Consistent patterns across all modules for fast learning curve
- Professional polish that builds trust with business users

---

## Typography System

**Font Stack**:
- **Primary**: Inter (via Google Fonts CDN) - modern, highly legible at all sizes
- **Monospace**: JetBrains Mono - for technical elements like phone numbers, API keys

**Type Scale**:
- **Display/Headers**: text-2xl to text-3xl, font-semibold (module titles, page headers)
- **Section Headers**: text-lg, font-semibold (card headers, sidebar sections)
- **Body Text**: text-sm, font-normal (primary interface text)
- **Meta/Labels**: text-xs, font-medium (labels, timestamps, status badges)
- **Buttons/CTAs**: text-sm, font-medium (all interactive elements)

**Hierarchy Rules**:
- Use weight variation (normal/medium/semibold) more than size changes
- Maintain consistent line-height: leading-relaxed for body, leading-tight for headers
- Never use more than 3 type sizes on a single interface section

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16**
- Micro spacing (within components): p-2, gap-2, space-x-4
- Component spacing (between elements): p-4, p-6, gap-4
- Section spacing (major layout divisions): p-8, py-12, gap-8
- Page margins: px-6 (mobile), px-8 (desktop)

**Dashboard Structure**:
```
├── Sidebar Navigation (fixed left, w-64)
│   ├── Logo/Brand (h-16)
│   ├── Module Navigation (flex-1)
│   └── User Profile/Settings (h-20)
├── Main Content Area (flex-1, ml-64)
│   ├── Top Bar (h-16, sticky)
│   │   ├── Page Title/Breadcrumbs
│   │   ├── Search/Filters
│   │   └── Actions/Notifications
│   └── Content Section (p-6 to p-8)
```

**Grid Systems**:
- **Module Cards**: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 with gap-6
- **Data Tables**: Full-width with responsive horizontal scroll
- **Chat Interface**: Two-column layout (conversation list | active chat) using grid-cols-[320px_1fr]
- **Forms/Settings**: Single column max-w-2xl for focused completion

---

## Component Library

### Navigation Components

**Sidebar Menu**:
- Section headers with uppercase text-xs tracking-wider
- Menu items with icons (Heroicons - use only this library) aligned left, 20px size
- Active state: medium background treatment with accent indicator on left edge (w-1 border)
- Hover state: subtle background shift
- Collapsible sections with chevron indicators

**Top Bar**:
- Minimal height (h-16) with horizontal layout
- Right-aligned action buttons and user avatar
- Notification bell with badge counter
- Search input with icon prefix (max-w-md)

### Data Display Components

**Status Badges**:
- Pill-shaped (rounded-full px-3 py-1)
- Text: text-xs font-medium
- Variants: Connected/Active, Disconnected, Pending, Error
- Include dot indicator for visual redundancy

**Account Cards** (WhatsApp connections):
- Compact card layout (p-4)
- Header: Avatar/Icon + Account Name + Type Badge
- Body: Phone number (monospace), Connection Status, Last Active
- Footer: Action buttons (View Chats, Disconnect)

**Chat List Items**:
- Avatar (48px) + Contact Name + Last Message Preview
- Right column: Timestamp + Unread Badge
- Active chat: distinct background treatment
- Hover: subtle background change

### Form Components

**Modal Dialogs** (QR Code, Device Setup):
- Centered overlay with backdrop blur
- Max width: max-w-lg for simple forms, max-w-2xl for QR display
- Header: text-lg font-semibold with close button (top-right X icon)
- Body: p-6 with consistent vertical spacing (space-y-4)
- Footer: Button row with Cancel (secondary) + Primary Action

**Input Fields**:
- Consistent height: h-10 for text inputs
- Labels: text-sm font-medium mb-2
- Border treatment on all states (default, focus, error)
- Helper text: text-xs mt-1
- Icon support (prefix/suffix) with pl-10 or pr-10 padding

**Toggle Switches** (WhatsApp Type: Normal/Business):
- Horizontal slide selector with two options
- Active option: distinct background, smooth transition
- Size: h-10 with equal-width segments

### Real-time Chat Interface

**Conversation View**:
- Fixed header (h-16): Contact info + Status + Actions
- Message area (flex-1, overflow-y-auto): 
  - Messages grouped by sender with timestamps
  - Incoming: align-left with distinct background
  - Outgoing: align-right with different background
  - System messages: centered, text-xs
- Input area (h-20): Text input + Attachment button + Send button

**Message Bubbles**:
- Max width: max-w-md for readability
- Padding: px-4 py-2
- Rounded corners: rounded-2xl (more rounded on opposite corners)
- Metadata: text-xs timestamp + read receipts

### Action Components

**Primary Buttons**:
- Height: h-10 (h-12 for hero CTAs)
- Padding: px-6
- Font: text-sm font-medium
- Rounded: rounded-lg
- Include loading states (spinner + disabled appearance)

**Icon Buttons**:
- Square: w-10 h-10
- Centered icon (20px)
- Rounded: rounded-lg
- Tooltips on hover (if space permits)

**Dropdown Menus**:
- Trigger: Button or text with chevron-down icon
- Menu: Absolute positioned, min-w-[200px]
- Items: px-4 py-2 with hover states
- Dividers between logical groups

---

## Module-Specific Layouts

### Connections Module
- Grid of account cards (3 columns on xl screens)
- "Add Account" card with dashed border and centered icon/text
- Filter bar above grid: Status filter + Search
- Empty state: Centered illustration + "Connect Your First Account" CTA

### Conversations Module
- Two-column layout: Conversation List (fixed 320px) | Active Chat (flex-1)
- Conversation list: Search at top + filterable/sortable chat items
- Active chat: Full message interface with persistent input
- No active chat selected: Empty state with prompts

### Chatbots Module
- Tab navigation: Automated Responses | Knowledge Base | Analytics
- Card-based layout for bot configurations
- Keyword/Trigger management: Tag input components
- Response editor: Rich text area with variable insertion

### Settings Module
- Vertical tab navigation on left (200px)
- Content area: Form sections with clear headers
- Save/Cancel actions: Sticky footer on scroll

---

## Iconography

**Library**: Heroicons (outline for most UI, solid for filled states)
**Icon Sizes**:
- Navigation/Menu: w-5 h-5 (20px)
- Buttons: w-5 h-5
- Large feature icons: w-12 h-12 (48px)
- Status indicators: w-3 h-3 (12px dots)

**Common Icons**:
- Chat: ChatBubbleLeftRightIcon
- Users/Contacts: UserGroupIcon
- Settings: Cog6ToothIcon
- WhatsApp: Custom SVG (WhatsApp logo)
- QR Code: QrCodeIcon
- Disconnect: ArrowRightOnRectangleIcon

---

## Responsive Behavior

**Breakpoints**:
- Mobile (< 768px): Hide sidebar, show hamburger menu, stack all columns
- Tablet (768px - 1024px): Collapsible sidebar, 2-column grids
- Desktop (> 1024px): Full sidebar visible, 3-column grids

**Mobile Adjustments**:
- Conversations: Single column with back button to return to list
- Cards: Stack to single column
- Tables: Horizontal scroll with fixed first column
- Modals: Full-screen on mobile (rounded corners removed)

---

## Accessibility Standards

- Maintain 4.5:1 contrast ratios for all text
- Focus indicators on all interactive elements (ring-2 ring-offset-2)
- ARIA labels for icon-only buttons
- Keyboard navigation support (tab order, Enter/Space activation)
- Screen reader announcements for real-time chat updates
- Form validation with clear error messaging

---

## Images

**No hero images required** - This is a dashboard application, not a marketing site.

**Illustrations/Graphics**:
- Empty states: Simple line illustrations (undraw.co style) centered with max-w-xs
- QR Code display: Generated QR code image, centered in modal at 256x256px
- User avatars: Circular (rounded-full), 32px (list items), 48px (profiles)
- Account type icons: WhatsApp logo variants for Normal/Business