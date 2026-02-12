# Flow Field Experiments

A collection of interactive generative art experiments built with p5.js.

🌐 **Live Demo**: [https://yourusername.github.io/flow-field-experiments/](https://yourusername.github.io/flow-field-experiments/)

## 🎨 Experiments

### 1. Flow Field Generator
Interactive particle system with customizable flow fields.

**Features:**
- 🌊 Three modes: Generate, Brush, and Spawn
- 🎨 Customizable particle shapes (lines, dots, rectangles, triangles)
- 🎨 Color palette support
- 📐 Adjustable particle sizes with variation
- 🖌️ Paint custom flow fields with brush tool
- ✨ Spawn particles interactively
- 💾 Export as SVG vector graphics
- ⚙️ Extensive parameter controls

**Live Demo**: [Flow Field Generator](https://yourusername.github.io/flow-field-experiments/experiments/flow-field-generator/)

## 🚀 Getting Started

### View Online
Visit the [live demo](https://yourusername.github.io/flow-field-experiments/) to try all experiments directly in your browser.

### Run Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/flow-field-experiments.git
   cd flow-field-experiments
   ```

2. Open `index.html` in your browser, or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (with http-server)
   npx http-server
   ```

3. Navigate to `http://localhost:8000`

## 🛠️ Technologies

- [p5.js](https://p5js.org/) - Creative coding library
- [dat.GUI](https://github.com/dataarts/dat.gui) - Interface controls
- Vanilla HTML/CSS/JavaScript

## 📝 Usage

Each experiment is self-contained and includes:
- Interactive controls panel
- Real-time parameter adjustment
- Export functionality
- On-screen instructions

### Flow Field Generator Controls

**Keyboard Shortcuts:**
- `B` - Cycle through modes (Generate → Brush → Spawn)
- `H` - Hide/show instructions
- `P` - Play/pause particle simulation
- `S` - Export as SVG
- `R` - Reset particles
- `C` - Clear canvas
- `Space` - Reset flow field

**Mouse Controls:**
- **Generate Mode**: Mouse controls attractor
- **Brush Mode**: Drag to paint flow field
- **Spawn Mode**: Click to spawn particle groups

## 🎨 Color Palettes

Default palette inspired by Pantone colors:
```
#EE3124 - RAL 3024 Red Fluo
#7851A9 - Pantone 2587 C
#003DA5 - Pantone 287 C
#00457C - Pantone 294 C
#1B3D4F - Pantone 296 C
```

You can customize palettes in the GUI using comma-separated hex codes.

## 📄 License

MIT License - Feel free to use these experiments for your own creative projects!

## 🤝 Contributing

Future experiments coming soon! Feel free to fork and create your own variations.

## 👤 Author

**Lorenzo**
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- Inspired by the creative coding community
- Built with p5.js and dat.GUI
- Color palette from Pantone and RAL standards

---

⭐ Star this repo if you find it useful!
