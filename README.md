# GPX Street View Explorer

A modern web application that allows users to upload GPX files and explore their routes using Google Street View images. Built with React, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- **GPX File Upload**: Drag-and-drop interface for GPX file uploads
- **Route Processing**: Parse GPX coordinates and extract route points
- **Street View Generation**: Generate Street View images at configurable intervals (25m, 50m, 100m, 200m)
- **Interactive Viewer**: Navigate through Street View images with keyboard and mouse controls
- **Export Options**: Download images as ZIP archive or individual files

### User Experience
- **Dark Mode Design**: Professional dark theme optimized for extended use
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Real-time Progress**: Visual feedback during GPX processing and image loading
- **Keyboard Navigation**: Arrow keys for navigation, 'I' key for info toggle
- **Error Handling**: Comprehensive error messages and recovery options

### Technical Features
- **Client-side Processing**: All GPX parsing happens locally in the browser
- **TypeScript**: Full type safety throughout the application
- **Modern UI Components**: Built with shadcn/ui and Radix UI primitives
- **Performance Optimized**: Image lazy loading and efficient state management
- **Local Storage**: Settings persistence across browser sessions

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Platform account
- Google Maps API key with Street View Static API enabled

### Google API Setup

1. **Create a Google Cloud Project**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable the Street View Static API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Street View Static API"
   - Click "Enable"

3. **Create an API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

4. **Configure API Key Restrictions** (Recommended):
   - Click on your API key to edit it
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `https://yourdomain.com/*`)
   - Under "API restrictions", select "Restrict key"
   - Choose "Street View Static API"

### Installation

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd gpx-street-view-explorer
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Configure API Key**:
   - Open the application in your browser
   - Click the Settings button (gear icon)
   - Enter your Google API key
   - Configure other settings as needed

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## Usage Guide

### Basic Workflow

1. **Upload GPX File**:
   - Drag and drop a GPX file onto the upload area
   - Or click "Choose File" to browse for a file
   - Supported: GPX files up to 50MB

2. **Configure Settings** (First Time):
   - Click the Settings button
   - Enter your Google API key
   - Adjust image interval distance (default: 50m)
   - Configure image size and viewing angle

3. **Process Route**:
   - The app will automatically parse your GPX file
   - Generate Street View URLs at specified intervals
   - Load Street View images from Google's servers

4. **Explore Images**:
   - Use arrow keys or click navigation buttons
   - Drag the progress slider to jump to specific locations
   - Press 'I' to toggle location information overlay

5. **Export Results**:
   - Click the Export button
   - Choose ZIP archive (recommended) or individual files
   - Include metadata for detailed route information

### Settings Options

- **Image Interval**: Distance between Street View captures (25m-200m)
- **Image Size**: Resolution of Street View images (400x400 to 800x800)
- **Field of View**: Camera angle (60°-120°)
- **Pitch**: Vertical viewing angle (-10° to +20°)

### Keyboard Shortcuts

- `←` / `→`: Navigate between images
- `I`: Toggle information overlay
- `Esc`: Close dialogs and overlays

## Technical Architecture

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── GPXUploader.tsx # File upload interface
│   ├── ImageViewer.tsx # Street View image display
│   ├── SettingsPanel.tsx # Configuration panel
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useLocalStorage.ts
│   └── useStreetViewProcessor.ts
├── lib/                # Utility libraries
│   ├── gpx-parser.ts   # GPX file parsing
│   ├── street-view-api.ts # Google API integration
│   ├── export-utils.ts # Image export functionality
│   └── utils.ts        # General utilities
├── types/              # TypeScript definitions
│   └── index.ts
└── App.tsx            # Main application component
```

### Key Technologies

- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible UI components
- **Vite**: Fast build tool and development server
- **GPX Parsing**: Custom XML parser for GPX files
- **Google Street View API**: Static image generation
- **JSZip**: Client-side ZIP file creation
- **File Saver**: Browser file download utilities

### Performance Considerations

- **Lazy Loading**: Images are loaded progressively
- **Memory Management**: Efficient handling of large image sets
- **Rate Limiting**: Respects Google API usage limits
- **Caching**: Local storage for settings and preferences
- **Bundle Splitting**: Optimized JavaScript chunks for faster loading

## API Usage and Costs

### Google Street View Static API

- **Pricing**: $7 per 1,000 requests (as of 2024)
- **Free Tier**: $200 monthly credit (≈28,500 requests)
- **Rate Limits**: 25,000 requests per day by default

### Cost Estimation

For a typical GPX route:
- **10km route at 50m intervals**: ~200 images = ~$1.40
- **25km route at 100m intervals**: ~250 images = ~$1.75
- **50km route at 50m intervals**: ~1,000 images = ~$7.00

### Optimization Tips

- Use larger intervals (100m-200m) for longer routes
- Preview route length before processing
- Consider route complexity when setting intervals
- Monitor API usage in Google Cloud Console

## Troubleshooting

### Common Issues

1. **"Invalid API Key" Error**:
   - Verify API key is correct
   - Ensure Street View Static API is enabled
   - Check API key restrictions

2. **"No Street View Available" Messages**:
   - Some locations don't have Street View coverage
   - Rural or remote areas may have limited coverage
   - Try different routes or adjust intervals

3. **Slow Image Loading**:
   - Large image sizes increase loading time
   - Reduce image size in settings
   - Check internet connection speed

4. **GPX Parsing Errors**:
   - Ensure GPX file is valid XML
   - Check file size (max 50MB)
   - Try exporting GPX from different software

### Browser Compatibility

- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+
- **Required Features**: ES2020, Fetch API, File API
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

## Contributing

### Development Setup

1. Fork the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Make your changes
5. Run tests: `npm run test` (when available)
6. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Add proper error handling
- Include JSDoc comments for complex functions
- Use semantic commit messages

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Acknowledgments

- Google Maps Platform for Street View API
- shadcn/ui for beautiful UI components
- Radix UI for accessible primitives
- The React and TypeScript communities

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Google API documentation
3. Open an issue on GitHub
4. Check existing issues for solutions

---

**Note**: This application requires a Google API key and will incur costs based on usage. Please monitor your API usage and set up billing alerts in Google Cloud Console.