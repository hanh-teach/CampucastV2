// Z-Index Token Definitions
// Define the application-wide z-index scale to ensure consistency.

export const zIndex = {
  base: "z-0",          // Content
  sidebar: "z-20",      // Sidebar base
  sidebarHovered: "z-[35]", // Sidebar hover-flyout
  header: "z-40",       // Header
  mobileOverlay: "z-[60]",  // Mobile overlay
  modal: "z-[9999]",    // Modal/Dialogs
  loadingOverlay: "z-[99999]", // Critical overlays
};

/*
Application z-index scale:
- Content main: z-0
- Sidebar: z-20
- Sidebar hover-flyout: z-[35]
- Header: z-40
- Mobile overlay: z-[60]
- Modal/Dialogs: z-[9999]
- Loading/Critical overlays: z-[99999]
*/
