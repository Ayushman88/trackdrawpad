# Trackpad Drawing - Collaborative Whiteboard

A real-time collaborative drawing application with trackpad control for mobile devices.

## Features

### 🎨 **Whiteboard**

- Real-time collaborative drawing
- Multiple drawing tools (pen, eraser)
- Color and stroke width selection
- Responsive design for all screen sizes

### 📱 **Trackpad Control**

- **Mobile-optimized interface**
- **Landscape orientation support** for better control
- Touch-friendly drawing surface
- Real-time cursor tracking
- Responsive layout for mobile devices

### 🔄 **Real-time Sync**

- Socket.IO integration
- Instant drawing synchronization
- Multi-device collaboration
- Live cursor position sharing

## Mobile Experience

### 📱 **Portrait Mode**

- Optimized for vertical screens
- Touch-friendly controls
- Responsive button sizes
- Easy navigation

### 🌊 **Landscape Mode** (Recommended for Mobile)

- **Full-screen trackpad** for maximum drawing precision
- **Horizontal orientation** provides more drawing space
- **Better control** for detailed drawings
- **Optimized touch targets** for finger and stylus

### 🎯 **Mobile-Specific Features**

- Touch and drag drawing
- Responsive toolbar layout
- Mobile-optimized button sizes (44px minimum)
- Landscape orientation detection
- Mobile-specific styling and animations

## Responsive Design

The application is built with a **mobile-first approach** and includes:

- **Breakpoint System**: `sm:` (640px+), `md:` (768px+), `lg:` (1024px+)
- **Flexible Layouts**: Adapts to screen size and orientation
- **Touch Optimization**: Optimized for mobile devices
- **Viewport Management**: Proper mobile viewport settings
- **Orientation Support**: Automatic landscape/portrait detection

## Getting Started

1. **Login/Signup** on any device
2. **Choose your role**:
   - **Whiteboard**: Desktop/Mac for viewing and drawing
   - **Trackpad**: Mobile/Phone for remote control
3. **Start drawing** with real-time collaboration

## Mobile Usage Tips

### For Best Experience:

1. **Rotate to landscape** when using trackpad on mobile
2. **Use landscape mode** for precise drawing control
3. **Touch and drag** smoothly for best results
4. **Keep finger on screen** while drawing

### Device Compatibility:

- ✅ **iOS Safari** (iPhone/iPad)
- ✅ **Android Chrome**
- ✅ **Mobile Firefox**
- ✅ **Desktop browsers**

## Technical Details

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with responsive utilities
- **Real-time**: Socket.IO for live collaboration
- **Mobile**: Progressive Web App (PWA) ready
- **Responsive**: Mobile-first design approach

## Development

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

## Mobile Testing

Test the responsive design by:

1. Using browser dev tools device simulation
2. Testing on actual mobile devices
3. Rotating between portrait and landscape
4. Testing touch interactions

---

**Perfect for**: Remote presentations, teaching, collaborative drawing, mobile control, and touch-friendly interfaces.
