# Silicon Entropy

**Silicon Entropy** is an advanced, high-fidelity CPU thermal and architectural simulator built to visualize the thermodynamic and electrical limits of silicon processors. 

Unlike standard hardware monitors, this project simulates the physical interplay between voltage, frequency, and heat dissipation in real-time using FDM (Finite Difference Method) solvers. It allows users to push hardware beyond theoretical limits, exploring experimental cooling solutions, quantum effects, and sci-fi architectural concepts.

![Project Preview](https://via.placeholder.com/800x450?text=Silicon+Entropy+Preview)

## Core Features

### 🌡️ Advanced Thermal Physics
- **Real-time FDM Simulation**: Calculates heat diffusion across the die surface based on localized core load.
- **Material Science**: Simulates conductivity of various block materials (Copper, Aluminum, Graphene, Diamond).
- **Environment Control**: Manage ambient temperature, humidity (dew point/condensation risk), and thermal interface material (TIM) quality.

### 🖥️ Architectural Sandbox
- **Core Configuration**: Scale from a single core up to a 64-core threadripper-style monster.
- **Experimental Logic**:
  - **Recursive SMT**: Fractal thread scheduling for massive throughput.
  - **Dark Silicon Reuse**: Harvest inactive transistors for cache.
  - **Neural Prediction**: AI-based branch prediction optimizations.
- **Visualizers**:
  - **Die Heatmap**: Professional-grade thermal imaging palettes (Ironbow, Magma, Whitehot, Spectrogram).
  - **Electron Mobility**: Particle-based visualization of circuit load and resistance.

### ⚡ Extreme Overclocking & "The Void"
- **Unbound Voltage Control**: Push VCore beyond safe limits (up to 2.5V+) to trigger thermal runaway.
- **Exotic Cooling**:
  - Standard Air & AIO Liquid Cooling.
  - **LN2 (Liquid Nitrogen)** & **LHe (Liquid Helium)** for sub-zero benchmarking.
  - **BEC (Bose-Einstein Condensate)** for near-absolute zero experiments.
- **Sci-Fi Anomalies**: Unlock "Void" parameters to simulate singularities, reality anchors, and quantum tunneling effects.

## Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS Modules
- **Rendering**: HTML5 Canvas API (High-performance pixel manipulation for thermal maps)
- **Icons**: Lucide React

## getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/silicon-entropy.git
    cd silicon-entropy
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the simulation**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## Controls

- **Standard Tab**: Manage voltage, load, and cooling solutions.
- **Architecture Tab**: Configure core count, SMT, and experimental chip features.
- **Experimental Tab**: Access dangerous settings (Superconductors, Safety Bypasses).
- **Void Tab**: [REDACTED] - Anomalous physics simulation.

## License

MIT License.
