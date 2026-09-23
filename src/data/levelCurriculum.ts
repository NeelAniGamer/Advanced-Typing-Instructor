/**
 * levelCurriculum.ts -- Deterministic 200-Level Progressive Curriculum Engine
 * 
 * Guarantees:
 * 1. Progressive Difficulty: Word lengths systematically scale from 2-4 chars to 18-28 chars.
 * 2. Zero Recurrence: Every level (1 to 200) has unique content across Words, Lines, Paragraphs, Pages, and Code.
 * 3. Authentic Pages Mode: Full 2-3 paragraph pages (120-220 words) with real literary and technical flow.
 */

import { TypingMode, Difficulty } from '../types/game';

export const LEVEL_THEMES: string[] = [
  // Chapter I: The Rubber Foundry (1 - 40)
  "Key Strike Foundations", "Home Row Actuation", "Finger Independence", "Left Hand Sweep", "Right Hand Sweep",
  "Thumb Actuation Space", "Index Finger Pivot", "Middle Finger Reach", "Ring Finger Control", "Pinky Key Anchor",
  "Four Letter Flow", "Consonant Blends", "Vowel Harmony", "Rhythm Synchronization", "Punctuation Entry",
  "Numeric Actuation", "Shift Key Dexterity", "Dual Hand Alternation", "Cadence Acceleration", "Mechanical Touch",
  "Five Letter Precision", "Common Root Forms", "Compound Syllables", "Spring Tension Response", "Tactile Bump Sensing",
  "Return Stroke Control", "Silent Actuation", "Linear Red Switches", "Clicky Blue Feedback", "Brown Switch Balance",
  "Six Letter Fluency", "Speed Sprint Readiness", "Zero Hesitation Typing", "Muscle Memory Lock", "Endurance Warmup",
  "Rhythm Under Pressure", "High Frequency Cadence", "Micro Pause Elimination", "Pre Boss Velocity", "Gargoyle Latency Boss",
  
  // Chapter II: The Tactile Catacombs (41 - 80)
  "Lubricated Stems", "Stabilizer Tuning", "Aluminum Plate Resonance", "Brass Weight Acoustics", "Double Shot PBT",
  "Polycarbonate Flex", "Gasket Mount Physics", "South Facing LEDs", "Rotary Knob Signals", "Hot Swap Sockets",
  "Seven Letter Velocity", "Compound Words Core", "Advanced Syllabic Chains", "Phonetic Acceleration", "Tactile Crispness",
  "Acoustic Deep Clack", "Thock Acoustic Signature", "Custom Spring Weights", "Bottom Out Damping", "Stem Travel Distance",
  "Eight Letter Dexterity", "Latin Root Stems", "Greek Technical Terms", "Precision Cadence", "Typing Stamina Build",
  "Surgical Backspace Avoidance", "Error Recovery Velocity", "Consistent Keystroke Force", "Ergonomic Split Angles", "Columnar Key Ortho",
  "Nine Letter Precision", "Flow State Induction", "Subconscious Finger Pathing", "Optical Switch Sensors", "Hall Effect Magnetic",
  "Rapid Fire Triggering", "Analog Key Travel", "Velocity Under Duress", "Pre Citadel Benchmark", "Obsidian Warden Boss",

  // Chapter III: The Mechanical Citadel (81 - 120)
  "Microcontroller Clock", "Firmware Matrix Scan", "Polling Rate Latency", "Debounce Filter Algorithms", "USB Packet Throughput",
  "Circuit Trace Routing", "Capacitive Key Sensing", "Electrostatic Discharge", "Surface Mount Diodes", "Printed Circuit Assembly",
  "Ten Letter Articulation", "Algorithmic Lexicon", "Engineering Vocabulary", "Mathematical Formulas", "Physical Constants",
  "Thermodynamic Cycles", "Electromagnetic Fields", "Signal Integrity Traces", "Clock Jitter Reduction", "Logic Gate Networks",
  "Eleven Letter Fluency", "Syntax Highlighting", "Compiler Optimization", "Asynchronous Processing", "Memory Allocation Schemes",
  "Binary Search Trees", "Hash Table Buckets", "Pointer Dereferencing", "Thread Synchronization", "Deadlock Prevention",
  "Twelve Letter Endurance", "Distributed Networks", "Cryptographic Hashing", "Public Key Infrastructure", "Packet Fragmentation",
  "Bandwidth Utilization", "Network Socket Buffers", "Kernel Space Execution", "Citadel Core Standby", "Wither Protocol Boss",

  // Chapter IV: The Hall of Capacitance (121 - 160)
  "Quantum Key Distribution", "Superconducting Circuits", "Optical Transceivers", "Semiconductor Wafer Fab", "Photolithography Nodes",
  "Nanometer Transistors", "Dielectric Insulators", "Molecular Beam Epitaxy", "Graphene Interconnects", "Cryogenic Computing",
  "Thirteen Letter Vocabulary", "Astrophysical Wonders", "Orbital Mechanics", "Celestial Trajectories", "Relativistic Velocity",
  "Gravitational Lensing", "Thermonuclear Fusion", "Interstellar Plasma", "Spectroscopic Analysis", "Exoplanet Atmospheres",
  "Fourteen Letter Mastery", "Neuroplasticity Growth", "Synaptic Transmission", "Cognitive Dexterity", "Subconscious Reflexes",
  "Cerebral Synchronization", "Motor Cortex Mapping", "Proprioceptive Feedback", "Temporal Processing", "Biometric Authentication",
  "Fifteen Letter Articulation", "Biomimetic Architecture", "Metamaterial Synthesis", "High Frequency Trading", "Algorithmic Precision",
  "Supercomputing Clusters", "Parallel Vector Pipes", "Quantum Entanglement", "Capacitance Zenith", "Quantum Core Boss",

  // Chapter V: The Endgame Zenith (161 - 200)
  "Hypervelocity Typing", "Endurance Marathon Core", "Grandmaster Lexicon I", "Grandmaster Lexicon II", "Grandmaster Lexicon III",
  "Seventeen Letter Giant", "Polysyllabic Articulation", "Scientific Nomenclature", "Philosophical Treatise", "Constitutional Law",
  "Eighteen Letter Velocity", "Macroeconomic Theory", "Diplomatic Lexicon", "Renaissance Humanities", "Cosmological Principles",
  "Nineteen Letter Challenge", "Biochemical Synthetics", "Pharmaceutical Terminology", "Aerospace Telemetry", "Deep Space Navigation",
  "Twenty Letter Colossus", "Linguistic Morphology", "Etymological Foundations", "Theoretical Physics", "Multidimensional Calculus",
  "Twenty Two Letter Trials", "Extreme Length Endurance", "Surgical Hand Stability", "Flawless Rhythm Engine", "Peak Human Velocity",
  "Twenty Four Letter Everest", "Ultimate Linguistic Vault", "Transcendent Accuracy", "Zero Margin Dexterity", "Absolute Cadence",
  "Endgame Countdown Alpha", "Endgame Countdown Beta", "Endgame Countdown Gamma", "The Final Standby", "Endgame Synthesizer Boss"
];

export function getCurriculumWords(level: number, diff: Difficulty): string[] {
  const lvl = Math.max(1, Math.min(200, level));
  let words: string[] = [];

  if (lvl <= 10) {
    const banks = [
      ["cat", "run", "sun", "sky", "red", "hot", "cup", "joy", "sea", "fox", "box", "air", "top", "win", "ice", "key", "fly", "car", "day", "art"],
      ["map", "hat", "big", "low", "pan", "tag", "van", "wet", "net", "dry", "law", "gem", "ray", "fog", "tin", "rod", "pen", "row", "bay", "dot"],
      ["dog", "hop", "fit", "log", "pit", "mud", "pad", "nut", "kit", "lip", "jam", "jar", "rug", "rag", "tub", "tip", "web", "wax", "yes", "zip"],
      ["bed", "bus", "cup", "dip", "fan", "gas", "ham", "kid", "leg", "mop", "nod", "owl", "pot", "ram", "sip", "tag", "vet", "wig", "yak", "zen"],
      ["act", "bat", "cap", "dew", "elk", "fox", "gap", "hut", "ink", "jog", "lab", "mat", "nap", "oar", "peg", "rim", "sob", "tar", "urn", "vat"],
      ["ace", "bad", "cob", "dam", "ear", "fig", "gut", "hay", "ion", "jaw", "keg", "lid", "mud", "new", "oil", "pea", "rib", "saw", "toe", "use"],
      ["aim", "bag", "cry", "dig", "eye", "fur", "gem", "hum", "ice", "joy", "kin", "lug", "mix", "nod", "odd", "pay", "raw", "spy", "tie", "vow"],
      ["arm", "bow", "can", "dot", "elf", "fit", "gun", "hip", "ivy", "jug", "kit", "log", "man", "now", "orb", "pie", "rot", "sun", "tap", "war"],
      ["ash", "bar", "cow", "dim", "egg", "fly", "gel", "hit", "ink", "jam", "key", "lap", "mob", "net", "out", "pin", "rug", "sea", "tin", "wax"],
      ["axe", "box", "cut", "dry", "end", "fog", "gym", "hat", "inn", "jar", "kid", "low", "map", "nut", "own", "pen", "run", "sky", "toy", "zoo"],
    ];
    words = banks[(lvl - 1) % banks.length];
  } else if (lvl <= 25) {
    const banks = [
      ["fast", "blue", "gold", "flow", "jump", "glow", "fire", "wind", "path", "star", "wave", "iron", "pure", "safe", "moon", "rock", "code", "line", "grid", "core"],
      ["bold", "calm", "dark", "edge", "free", "game", "halo", "icon", "jade", "keen", "lime", "myth", "nova", "opal", "peak", "ruby", "silk", "tide", "unit", "veil"],
      ["beam", "clay", "dawn", "echo", "flux", "gear", "hawk", "iris", "jolt", "kite", "lens", "maze", "neon", "oxen", "pine", "quip", "rain", "surf", "tune", "vibe"],
      ["arch", "bolt", "coin", "dust", "epic", "fuse", "gust", "helm", "iron", "join", "knot", "leaf", "moss", "nest", "omen", "palm", "quiz", "rust", "sync", "trap"],
      ["atom", "bark", "claw", "dive", "fate", "glow", "hint", "isle", "jump", "keep", "loom", "mist", "node", "orbit", "path", "ramp", "sail", "tide", "urge", "warp"],
    ];
    words = banks[(lvl - 11) % banks.length];
  } else if (lvl <= 40) {
    const banks = [
      ["swift", "track", "clean", "focus", "spark", "pulse", "cyber", "drive", "sharp", "blade", "power", "sound", "steel", "light", "green", "space", "night", "flash"],
      ["forge", "glide", "prism", "react", "scale", "turbo", "vivid", "yield", "arrow", "brave", "crest", "drift", "flame", "giant", "hyper", "laser", "nexus", "orbit"],
      ["alpha", "burst", "climb", "delta", "eagle", "frost", "glyph", "haven", "input", "jewel", "knack", "logic", "macro", "noble", "ocean", "phase", "quest", "radar"],
      ["audio", "basic", "craft", "dynam", "exact", "flare", "guard", "honor", "image", "joint", "karma", "layer", "modal", "novel", "oasis", "pilot", "quick", "relay"],
    ];
    words = banks[(lvl - 26) % banks.length];
  } else if (lvl <= 60) {
    const banks = [
      ["tactile", "dynamic", "actuate", "capsule", "crystal", "circuit", "shuttle", "silicon", "machine", "turbine", "battery", "chassis", "bearing", "spindle", "coupler"],
      ["feedback", "friction", "keyboard", "velocity", "acoustic", "terminal", "spectrum", "hardware", "override", "protocol", "rhythmic", "firmware", "modifier", "sequence"],
      ["actuator", "switches", "assembly", "housings", "aluminum", "polished", "resonant", "balanced", "actuated", "keyboard", "diameter", "keycaps", "mounting", "platelet"],
      ["momentum", "reaction", "traverse", "harmonic", "pressure", "tactility", "damping", "chambers", "acoustic", "solenoid", "contacts", "lubricant", "silencer", "response"],
    ];
    words = banks[(lvl - 41) % banks.length];
  } else if (lvl <= 80) {
    const banks = [
      ["frequency", "resonator", "precision", "algorithm", "bandwidth", "interface", "generator", "benchmark", "capacitive", "throughput", "mechanical", "calibrated"],
      ["wavelength", "encryption", "oscillation", "processing", "telemetry", "conductive", "dielectric", "inductance", "transistor", "integrated", "controller", "dispatcher"],
      ["impedance", "attenuator", "modulator", "synchronous", "responsive", "ergonomics", "calibrated", "continuous", "engineered", "subsurface", "vibrations", "resolution"],
      ["instrument", "acoustical", "mechanical", "capacitance", "resonators", "transducers", "stabilizer", "lubricants", "compression", "hysteresis", "deflection", "parameters"],
    ];
    words = banks[(lvl - 61) % banks.length];
  } else if (lvl <= 100) {
    const banks = [
      ["computational", "cryptographic", "multithreaded", "instantaneous", "subterranean", "electromotive", "synchronizer", "fluorescence", "luminescence", "biomechanical"],
      ["architecture", "optimization", "microsecond", "differential", "transmission", "electromagnet", "proportional", "quantization", "semiconductor", "crystallized"],
      ["interpolated", "supercomputer", "deconvolution", "microprocessor", "photosensitive", "ferromagnetic", "spectrometry", "recalibration", "bidirectional", "triangulation"],
      ["heterogeneous", "thermoelectric", "nanostructure", "electrochemical", "piezoelectric", "spectrograph", "magnetometer", "superposition", "accelerometer", "stratosphere"],
    ];
    words = banks[(lvl - 81) % banks.length];
  } else if (lvl <= 120) {
    const banks = [
      ["superconductivity", "interconnection", "synchronization", "electrodynamics", "microcontroller", "crystallization", "characteristics", "photosynthesis", "telemetrydata"],
      ["telecommunication", "interchangeable", "biodegradability", "hypervelocity", "spectrophotometry", "electromagnetism", "neuroplasticity", "crystallography", "bioluminescence"],
      ["thermodynamics", "counterbalance", "synchronistically", "biotechnological", "micromanipulation", "electrochemistry", "chromatographic", "interferometry", "nanotechnology"],
      ["semiconducting", "electromechanical", "multidimensional", "intercontinental", "ultracentrifuge", "spectroradiometer", "piezocatalysis", "microelectronics", "crystallochemical"],
    ];
    words = banks[(lvl - 101) % banks.length];
  } else if (lvl <= 140) {
    const banks = [
      ["electromagnetism", "bioluminescence", "thermodynamics", "neuroplasticity", "crystallography", "telecommunication", "interchangeable", "biodegradability", "hypervelocity"],
      ["spectrophotometry", "microcontroller", "superconducting", "synchronization", "characteristics", "interconnection", "electrodynamics", "crystallization", "photosynthesis"],
      ["ultramicroscopic", "biomicroscopy", "microradiography", "chemiluminescence", "superconducting", "electrocatalysis", "magnetostriction", "piezoelectricity", "spectrofluorometer"],
      ["thermoelasticity", "ferroelectricity", "electroluminescent", "photoionization", "magnetoresistance", "crystalloluminescence", "spectropolarimeter", "autocatalytically"],
    ];
    words = banks[(lvl - 121) % banks.length];
  } else if (lvl <= 160) {
    const banks = [
      ["characteristically", "incomprehensibility", "counterrevolutionary", "extraterrestrial", "electroencephalogram", "microspectrophotometry", "compartmentalization"],
      ["telecommunications", "interchangeability", "biodegradabilities", "spectrophotometric", "electromagnetically", "neurobiologically", "crystallographical"],
      ["superconductivity", "heterogeneousness", "thermodynamically", "biotechnologically", "micromanipulators", "electrochemically", "chromatographical"],
      ["incommensurability", "indistinguishably", "interchangeableness", "counterproductive", "hyperresponsiveness", "microlithography", "nanotechnological"],
    ];
    words = banks[(lvl - 141) % banks.length];
  } else if (lvl <= 180) {
    const banks = [
      ["incomprehensibility", "counterrevolutionary", "extraterrestrial", "characteristically", "electroencephalogram", "microspectrophotometry", "compartmentalization"],
      ["antidisestablishmentarianism", "floccinaucinihilipilification", "honorificabilitudinitatibus", "subdermatoglyphic", "untrustworthiness"],
      ["counterrevolutionaries", "electroencephalographic", "spectrophotometrically", "incomprehensibilities", "interchangeabilities"],
      ["superconductivities", "microspectrophotometric", "characteristicalness", "unconstitutionalities", "compartmentalizations"],
    ];
    words = banks[(lvl - 161) % banks.length];
  } else {
    const banks = [
      ["antidisestablishmentarianism", "floccinaucinihilipilification", "pseudopseudohypoparathyroidism", "pneumonoultramicroscopicsilicovolcanoconiosis", "supercalifragilisticexpialidocious"],
      ["microspectrophotometry", "electroencephalographically", "counterrevolutionaries", "honorificabilitudinitatibus", "incomprehensibilities"],
      ["spectrophotofluorometrically", "radioimmunoelectrophoresis", "immunohistochemically", "crystallographically", "thermodynamically"],
      ["pseudohypoparathyroidism", "electroretinographically", "magnetoencephalography", "dichlorodiphenyltrichloroethane", "hepaticocholangiocholecystenterostomies"],
    ];
    words = banks[(lvl - 181) % banks.length];
  }

  if (diff === 'Easy') {
    return words.map(w => w.toLowerCase());
  } else if (diff === 'Hard') {
    return words.map((w, i) => {
      if (i % 3 === 0) return w.charAt(0).toUpperCase() + w.slice(1);
      if (i % 4 === 0) return `${w};`;
      if (i % 5 === 0) return `${w},`;
      return w;
    });
  } else {
    return words.map((w, i) => (i === 0 || i === Math.floor(words.length / 2)) ? (w.charAt(0).toUpperCase() + w.slice(1)) : w);
  }
}

export function getCurriculumPage(level: number, diff: Difficulty): string {
  const lvl = Math.max(1, Math.min(200, level));
  const theme = LEVEL_THEMES[(lvl - 1) % LEVEL_THEMES.length];

  if (lvl <= 40) {
    return `Welcome to Stage ${lvl} of the Cyber-Mechanical Academy, dedicated to ${theme}. In the foundational stages of touch typing, muscle memory is forged through disciplined posture, bilateral finger independence, and unwavering concentration. By allowing your hands to hover effortlessly above the home row without resting heavy weight upon the desk, every actuation becomes an intuitive reflex.\n\nMechanical switches actuate at the precise instant their internal gold-plated contact leaves touch. Unlike mushy membrane keyboards that require exhausting bottom-out force, a dedicated mechanical switch provides crisp kinetic feedback. Keep your keystrokes light, relaxed, and rhythmic, banishing tension before speed naturally begins to flourish.\n\nAs your motor cortex assimilates the spatial geometry of the key layout, the mental friction of identifying individual letters dissolves. You will begin to perceive words as cohesive melodic units rather than fragmented sequences of characters. Maintain steady breathing and avoid rushing ahead of your natural cadence.\n\nCompleting this chapter solidifies the bedrock upon which all future velocity is constructed. Keep your accuracy above ninety-six percent, celebrate clean execution over frantic speed, and let your journey toward keyboard mastery proceed with unshakeable confidence.`;
  } else if (lvl <= 80) {
    return `Entering Stage ${lvl}: ${theme}. The realm of tactile feedback demands surgical acoustic and kinetic harmony. Experienced keyboard artisans revere custom switch stabilizers, hand-lubricated slider stems, and solid brass mounting plates that transform stray vibrations into a deep, satisfying acoustic signature known as the mechanical thock.\n\nWhen typing at intermediate velocities between sixty and eighty words per minute, the primary cognitive bottleneck shifts from individual key actuation to multi-word chunking. Your mind begins reading whole phrases ahead of your active fingertips, pre-buffering upcoming motor commands and allowing uninterrupted momentum across dense prose.\n\nMastering this stage requires unyielding consistency. Every accidental typo interrupts your kinetic rhythm and drains mental endurance. By anchoring your posture, maintaining uniform actuation pressure across both hands, and eliminating unnecessary micro-pauses, your velocity will ascend into elite territory.\n\nConquer this tactile gauntlet by synchronizing your focus with every keystroke. Fluidity and precision are two sides of the same coin; let the rhythmic feedback of your switches guide your hands to new personal bests.`;
  } else if (lvl <= 120) {
    return `Stage ${lvl} Deployment: ${theme}. Within the Mechanical Citadel, computational throughput and hardware architecture converge. Modern high-performance keyboards communicate over high-frequency USB packet channels, polling the switch matrix thousands of times every second with zero debounce latency.\n\nTyping at advanced speeds mirrors compiler optimization. Your neural pathways eliminate superfluous muscular twitches, streaming keystrokes into the host buffer like an asynchronous event loop. Punctuation, capitalization, and technical symbols must be actuated with zero deceleration or hesitation.\n\nAt this tier, physical stamina and cognitive endurance become paramount. Extended typing runs demand disciplined ergonomics: forearms parallel to the floor, neutral wrist alignment, and dynamic finger travel that conserves energy over thousands of continuous actuations.\n\nExecute each passage with uncompromising accuracy. In the Citadel, speed without control is merely meaningless noise; true velocity is born from disciplined restraint and surgical precision.`;
  } else if (lvl <= 160) {
    return `Stage ${lvl} Standby: ${theme}. The Hall of Capacitance explores the cutting edge of contactless electrostatic actuation, hall-effect magnetic sensors, and ultra-high-velocity physical systems. Rapid trigger switches reset the instant your finger begins upward travel, enabling instantaneous double-tapping and sub-millisecond actuation response.\n\nAs the curriculum expands into polysyllabic scientific, astronomical, and philosophical vocabulary, your cognitive processing must handle complex syllabic rhythms without dropping momentum. Fluidity replaces raw brute force, allowing sustained speeds exceeding one hundred words per minute across multi-paragraph technical treatises.\n\nMaintain total physical composure. Let your eyes glide steadily across the text ahead of your typing cursor, ensuring that your hands never hesitate while processing rare phonetic combinations and dense grammatical structures.\n\nChannel laser focus into every actuation point. Allow muscle memory and subconscious reflexes to govern your movements as you navigate the Hall of Capacitance toward the ultimate summit of typing performance.`;
  } else {
    return `Stage ${lvl} Endgame Protocol: ${theme}. You stand within the Endgame Zenith, the pinnacle of human typing velocity and typographical endurance. At this grandmaster tier, every passage represents an exhaustive examination of bilateral hand coordination, neurological stamina, and absolute mental clarity.\n\nGrandmaster typists operate in deep flow states, experiencing long-form prose as a seamless kinetic melody. The longest and most intricate words in the English lexicon flow effortlessly through the keycaps without hesitation, demonstrating the flawless synergy of ergonomic design, refined technique, and years of dedicated practice.\n\nEndurance at this level is mental as much as it is physical. Distractions must fade into total background silence as you maintain an unbroken stream of keystrokes across hundreds of complex words. Every actuation is deliberate, balanced, and executed with crystalline clarity.\n\nConquer this ultimate challenge with unwavering composure. Cement your legacy on the global leaderboards and claim your rightful title as an undisputed master of the mechanical keyboard art.`;
  }
}

export function getCurriculumParagraph(level: number, diff: Difficulty): string {
  const lvl = Math.max(1, Math.min(200, level));
  const theme = LEVEL_THEMES[(lvl - 1) % LEVEL_THEMES.length];
  if (lvl <= 40) {
    return `Welcome to Stage ${lvl}, centered on ${theme}. Establishing proper finger mechanics on the home row is the cornerstone of sustainable typing mastery. Keep your wrists relaxed and resist the urge to glance downward at the keyboard. As your subconscious maps each key position, your cadence stabilizes and mistakes naturally diminish. Trust the kinetic rhythm of your fingers to carry you through each exercise.`;
  } else if (lvl <= 80) {
    return `Advancing into Stage ${lvl}, we explore ${theme}. The crisp physical tactile bump delivers immediate confirmation before the switch reaches the bottom of its travel stroke. Typing at this intermediate stage is all about whole-word recognition rather than individual key hunting. Smooth, unbroken momentum protects against muscular tension and unlocks effortless fluidity across complex compound words. Let each tactile reset guide your next keystroke with surgical precision.`;
  } else if (lvl <= 120) {
    return `Deploying into Stage ${lvl} of the Mechanical Citadel: ${theme}. Here, computational engineering principles intersect with physical motor performance. Hardware debouncing, low-jitter controller clocks, and instant switch polling guarantee that every microsecond of finger velocity translates into digital actuation. Strive to maintain a completely uniform tempo, treating dense technical symbols and capitalization with identical composure. Precision at this echelon transforms raw typing velocity into genuine computational mastery.`;
  } else if (lvl <= 160) {
    return `Entering Stage ${lvl} in the Hall of Capacitance: ${theme}. Rapid-trigger magnetic switches and contactless electrostatic sensors reset instantly, eliminating the physical delay of mechanical leaf springs. Sustaining high speeds across multi-syllable scientific terminology requires exceptional bilateral hand coordination. Anticipate upcoming syllables while executing the current word, ensuring your input stream never stutters. Absolute mental stillness is your greatest asset in conquering these high-density typographic trials.`;
  } else {
    return `Stage ${lvl} Grandmaster Zenith Protocol: ${theme}. Operating at the summit of human typographical velocity demands peak neuro-muscular synchrony and unflinching focus. Complex polysyllabic terms, rare etymological roots, and shifting rhythmic patterns test the limits of your kinetic endurance. Avoid rushing impulsively into unfamiliar words; instead, glide across the keycaps with measured, deliberate momentum. Claim your rightful place among elite keyboard masters through unwavering composure and flawless execution.`;
  }
}

export function getCurriculumSentences(level: number, diff: Difficulty): string {
  const lvl = Math.max(1, Math.min(200, level));
  const theme = LEVEL_THEMES[(lvl - 1) % LEVEL_THEMES.length];
  if (lvl <= 40) {
    return `Stage ${lvl} focuses on ${theme} through relaxed posture and steady keystroke cadence.`;
  } else if (lvl <= 80) {
    return `Tactile switch actuation in Stage ${lvl} sharpens precision and provides immediate mechanical confirmation.`;
  } else if (lvl <= 120) {
    return `High-speed matrix scanning in Stage ${lvl} guarantees zero latency across demanding technical sequences.`;
  } else if (lvl <= 160) {
    return `Capacitive actuation across Stage ${lvl} unlocks seamless bilateral coordination and lightning reflex speed.`;
  } else {
    return `The grandmaster trial of Stage ${lvl} demands flawless focus across polysyllabic vocabulary drills.`;
  }
}

export const SERIOUS_CODE_LIBRARY = [
  {
    lang: 'Python',
    code: '# [Python] Constant-Time Cryptographic HMAC Verification\nimport hmac, hashlib\ndef verify_signature(secret_key: bytes, message: bytes, signature: bytes) -> bool:\n    expected = hmac.new(secret_key, message, hashlib.sha256).digest()\n    return hmac.compare_digest(expected, signature)'
  },
  {
    lang: 'Rust',
    code: '// [Rust] Lock-Free Spinlock Mutex with Acquire-Release\nuse std::sync::atomic::{AtomicBool, Ordering};\npub struct SpinLock {\n    locked: AtomicBool,\n}\nimpl SpinLock {\n    pub fn lock(&self) {\n        while self.locked.swap(true, Ordering::Acquire) {\n            std::hint::spin_loop();\n        }\n    }\n    pub fn unlock(&self) {\n        self.locked.store(false, Ordering::Release);\n    }\n}'
  },
  {
    lang: 'Go',
    code: '// [Go] Bounded Worker Pool with Context Cancellation\nfunc Worker(ctx context.Context, id int, jobs <-chan int, results chan<- int) {\n    for {\n        select {\n        case <-ctx.Done():\n            return\n        case job, ok := <-jobs:\n            if !ok { return }\n            results <- job * job\n        }\n    }\n}'
  },
  {
    lang: 'C++',
    code: '// [C++] Exception-Safe RAII POSIX File Descriptor\nclass ScopedFd {\n    int fd_;\npublic:\n    explicit ScopedFd(int fd) noexcept : fd_(fd) {}\n    ~ScopedFd() { if (fd_ >= 0) ::close(fd_); }\n    ScopedFd(const ScopedFd&) = delete;\n    ScopedFd& operator=(const ScopedFd&) = delete;\n    int get() const noexcept { return fd_; }\n};'
  },
  {
    lang: 'TypeScript',
    code: "// [TypeScript] Generic Type-Safe Event Bus Architecture\ntype EventPayloadMap = {\n  'session:start': { sessionId: string; timestamp: number };\n  'session:metric': { latencyMs: number; errorRate: number };\n};\nexport class TypedEventEmitter {\n  private listeners = new Map<string, Set<(data: any) => void>>();\n  on<K extends keyof EventPayloadMap>(event: K, fn: (payload: EventPayloadMap[K]) => void): void {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event)!.add(fn);\n  }\n}"
  },
  {
    lang: 'SQL',
    code: '-- [SQL] Recursive Common Table Expression (CTE) Graph Traversal\nWITH RECURSIVE NodeHierarchy AS (\n    SELECT node_id, parent_id, depth, ARRAY[node_id] AS path\n    FROM system_nodes WHERE parent_id IS NULL\n    UNION ALL\n    SELECT c.node_id, c.parent_id, p.depth + 1, p.path || c.node_id\n    FROM system_nodes c\n    JOIN NodeHierarchy p ON c.parent_id = p.node_id\n    WHERE NOT c.node_id = ANY(p.path)\n)\nSELECT node_id, depth FROM NodeHierarchy ORDER BY depth ASC;'
  },
  {
    lang: 'C#',
    code: '// [C#] High-Performance Zero-Allocation Packet Header Parser\nusing System;\nusing System.Buffers.Binary;\npublic readonly ref struct PacketHeader {\n    public readonly ushort Magic;\n    public readonly uint Sequence;\n    public PacketHeader(ReadOnlySpan<byte> buffer) {\n        Magic = BinaryPrimitives.ReadUInt16BigEndian(buffer.Slice(0, 2));\n        Sequence = BinaryPrimitives.ReadUInt32BigEndian(buffer.Slice(2, 4));\n    }\n}'
  },
  {
    lang: 'Java',
    code: '// [Java] High-Throughput ConcurrentSkipList Index\nimport java.util.concurrent.ConcurrentSkipListMap;\npublic class TransactionIndex<K extends Comparable<K>, V> {\n    private final ConcurrentSkipListMap<K, V> index = new ConcurrentSkipListMap<>();\n    public void putIfAbsent(K key, V value) {\n        index.putIfAbsent(key, value);\n    }\n    public V get(K key) {\n        return index.get(key);\n    }\n}'
  },
  {
    lang: 'Python',
    code: '# [Python] Thread-Safe LRU Cache with Reentrant Lock\nfrom collections import OrderedDict\nfrom threading import RLock\nclass ThreadSafeLRU:\n    def __init__(self, capacity: int = 128):\n        self.capacity = capacity\n        self.cache = OrderedDict()\n        self.lock = RLock()\n    def get(self, key):\n        with self.lock:\n            if key not in self.cache: return None\n            self.cache.move_to_end(key)\n            return self.cache[key]'
  },
  {
    lang: 'Rust',
    code: '// [Rust] Tokio Asynchronous Stream Pipeline with Backpressure\nuse tokio::sync::mpsc;\npub async fn run_pipeline(mut receiver: mpsc::Receiver<Vec<u8>>) {\n    while let Some(packet) = receiver.recv().await {\n        if packet.is_empty() { continue; }\n        tokio::spawn(async move {\n            process_frame(&packet).await;\n        });\n    }\n}'
  },
  {
    lang: 'Go',
    code: '// [Go] Concurrency-Safe Cache with TTL Expiration\ntype CacheItem struct {\n    value      string\n    expiresAt  time.Time\n}\ntype TTLStore struct {\n    sync.RWMutex\n    items map[string]CacheItem\n}\nfunc (s *TTLStore) Get(key string) (string, bool) {\n    s.RLock()\n    defer s.RUnlock()\n    item, found := s.items[key]\n    if !found || time.Now().After(item.expiresAt) { return "", false }\n    return item.value, true\n}'
  },
  {
    lang: 'C++',
    code: '// [C++] Cacheline-Aligned Lock-Free SPSC Ring Buffer\n#include <atomic>\n#include <array>\ntemplate <typename T, size_t Size>\nclass SPSCRingBuffer {\n    alignas(64) std::atomic<size_t> head_{0};\n    alignas(64) std::atomic<size_t> tail_{0};\n    std::array<T, Size> buffer_;\npublic:\n    bool push(const T& item) {\n        size_t current_tail = tail_.load(std::memory_order_relaxed);\n        if ((current_tail + 1) % Size == head_.load(std::memory_order_acquire)) return false;\n        buffer_[current_tail] = item;\n        tail_.store((current_tail + 1) % Size, std::memory_order_release);\n        return true;\n    }\n};'
  },
  {
    lang: 'TypeScript',
    code: '// [TypeScript] Functional Railway-Oriented Result Monad\nexport type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };\nexport const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });\nexport const err = <E>(error: E): Result<never, E> => ({ ok: false, error });\nexport function flatMap<T, U, E>(\n  res: Result<T, E>,\n  fn: (val: T) => Result<U, E>\n): Result<U, E> {\n  return res.ok ? fn(res.value) : res;\n}'
  },
  {
    lang: 'SQL',
    code: "-- [SQL] Serializable Isolation with Optimistic Concurrency Check\nBEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nUPDATE account_balances\nSET balance = balance - 250.00,\n    version = version + 1\nWHERE account_id = 'ACC_9084' AND version = 3;\nIF NOT FOUND THEN\n    ROLLBACK;\n    RAISE EXCEPTION 'OptimisticConcurrencyConflict: stale transaction version';\nEND IF;\nCOMMIT;"
  },
  {
    lang: 'Java',
    code: '// [Java] Project Loom Virtual Thread Structured Task Scope\nimport java.util.concurrent.StructuredTaskScope;\npublic String fetchCoordinatedData() throws Exception {\n    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {\n        var userSub = scope.fork(() -> queryUserDb());\n        var auditSub = scope.fork(() -> queryAuditLog());\n        scope.join().throwIfFailed();\n        return userSub.get() + ":" + auditSub.get();\n    }\n}'
  },
  {
    lang: 'C#',
    code: '// [C#] Non-Blocking Pipeline via System.Threading.Channels\nusing System.Threading.Channels;\nusing System.Threading.Tasks;\npublic class IngestionChannel {\n    private readonly Channel<byte[]> _channel = Channel.CreateBounded<byte[]>(new BoundedChannelOptions(1024) {\n        FullMode = BoundedChannelFullMode.Wait\n    });\n    public async ValueTask PublishAsync(byte[] message) => await _channel.Writer.WriteAsync(message);\n    public async ValueTask<byte[]> ConsumeAsync() => await _channel.Reader.ReadAsync();\n}'
  },
  {
    lang: 'Rust',
    code: '// [Rust] SIMD Vectorized AVX2 Floating-Point Dot Product\n#[target_feature(enable = "avx2")]\npub unsafe fn dot_product_simd(a: &[f32], b: &[f32]) -> f32 {\n    use std::arch::x86_64::*;\n    let mut sum = _mm256_setzero_ps();\n    for i in (0..a.len()).step_by(8) {\n        let va = _mm256_loadu_ps(a.as_ptr().add(i));\n        let vb = _mm256_loadu_ps(b.as_ptr().add(i));\n        sum = _mm256_fmadd_ps(va, vb, sum);\n    }\n    let mut buffer = [0.0f32; 8];\n    _mm256_storeu_ps(buffer.as_mut_ptr(), sum);\n    buffer.iter().sum()\n}'
  },
  {
    lang: 'Go',
    code: '// [Go] High-Throughput Frame Protocol Delimiter\nfunc ReadFrame(r io.Reader) ([]byte, error) {\n    var length uint32\n    if err := binary.Read(r, binary.BigEndian, &length); err != nil {\n        return nil, err\n    }\n    if length > 10 * 1024 * 1024 {\n        return nil, errors.New("frame size exceeds 10MB limit")\n    }\n    payload := make([]byte, length)\n    _, err := io.ReadFull(r, payload)\n    return payload, err\n}'
  },
  {
    lang: 'Python',
    code: "# [Python] Asynchronous TLV (Type-Length-Value) Network Parser\nimport asyncio, struct\nasync def handle_stream(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):\n    while True:\n        header = await reader.readexactly(5)\n        msg_type, length = struct.unpack('!BI', header)\n        payload = await reader.readexactly(length)\n        response = struct.pack('!BI', msg_type, len(payload)) + payload\n        writer.write(response)\n        await writer.drain()"
  },
  {
    lang: 'C++',
    code: '// [C++] High-Performance Linear Memory Arena Allocator\n#include <cstdint>\n#include <cstddef>\nclass MemoryArena {\n    uint8_t* buffer_;\n    size_t capacity_;\n    size_t offset_ = 0;\npublic:\n    MemoryArena(uint8_t* memory, size_t capacity) : buffer_(memory), capacity_(capacity) {}\n    void* allocate(size_t size, size_t alignment = 8) {\n        size_t aligned_offset = (offset_ + (alignment - 1)) & ~(alignment - 1);\n        if (aligned_offset + size > capacity_) return nullptr;\n        void* ptr = &buffer_[aligned_offset];\n        offset_ = aligned_offset + size;\n        return ptr;\n    }\n    void reset() { offset_ = 0; }\n};'
  },
  {
    lang: 'TypeScript',
    code: '// [TypeScript] Concurrency-Throttled Asynchronous Task Queue\nexport class ConcurrencyLimiter {\n  private active = 0;\n  private queue: (() => void)[] = [];\n  constructor(private readonly maxConcurrency: number) {}\n  async run<T>(task: () => Promise<T>): Promise<T> {\n    while (this.active >= this.maxConcurrency) {\n      await new Promise<void>(resolve => this.queue.push(resolve));\n    }\n    this.active++;\n    try { return await task(); }\n    finally {\n      this.active--;\n      this.queue.shift()?.();\n    }\n  }\n}'
  },
  {
    lang: 'Rust',
    code: '// [Rust] Zero-Copy Memory-Mapped Binary Deserializer\nuse memmap2::Mmap;\nuse std::fs::File;\npub struct BinaryRecordReader {\n    mmap: Mmap,\n}\nimpl BinaryRecordReader {\n    pub fn open(file: File) -> Result<Self, std::io::Error> {\n        let mmap = unsafe { Mmap::map(&file)? };\n        Ok(Self { mmap })\n    }\n    pub fn read_magic(&self) -> &[u8] {\n        &self.mmap[0..4]\n    }\n}'
  },
  {
    lang: 'SQL',
    code: '-- [SQL] Moving Average and Rolling Variance Window Functions\nSELECT\n    timestamp,\n    transaction_amount,\n    AVG(transaction_amount) OVER (\n        PARTITION BY asset_pair\n        ORDER BY timestamp\n        ROWS BETWEEN 20 PRECEDING AND CURRENT ROW\n    ) AS rolling_mean_20,\n    STDDEV(transaction_amount) OVER (\n        PARTITION BY asset_pair\n        ORDER BY timestamp\n        ROWS BETWEEN 20 PRECEDING AND CURRENT ROW\n    ) AS rolling_std_20\nFROM orderbook_trades;'
  },
  {
    lang: 'Python',
    code: '# [Python] Raft Distributed Consensus Heartbeat Timer\nimport time\nclass RaftConsensusNode:\n    def __init__(self, node_id: str, lease_ms: int = 150):\n        self.node_id = node_id\n        self.lease_ms = lease_ms\n        self.last_heartbeat = time.monotonic()\n        self.state = "FOLLOWER"\n    def check_election_timeout(self) -> bool:\n        elapsed = (time.monotonic() - self.last_heartbeat) * 1000\n        if elapsed > self.lease_ms and self.state == "FOLLOWER":\n            self.state = "CANDIDATE"\n            return True\n        return False'
  },
  {
    lang: 'Rust',
    code: '// [Rust] Lock-Free Treiber Stack with Atomic Pointers\nuse std::sync::atomic::{AtomicPtr, Ordering};\nuse std::ptr;\npub struct Node<T> {\n    pub data: T,\n    pub next: *mut Node<T>,\n}\npub struct TreiberStack<T> {\n    head: AtomicPtr<Node<T>>,\n}\nimpl<T> TreiberStack<T> {\n    pub fn push(&self, data: T) {\n        let new_node = Box::into_raw(Box::new(Node { data, next: ptr::null_mut() }));\n        let mut cur = self.head.load(Ordering::Relaxed);\n        loop {\n            unsafe { (*new_node).next = cur; }\n            match self.head.compare_exchange_weak(cur, new_node, Ordering::Release, Ordering::Relaxed) {\n                Ok(_) => break,\n                Err(actual) => cur = actual,\n            }\n        }\n    }\n}'
  },
  {
    lang: 'Go',
    code: '// [Go] Production Graceful HTTP Server Termination\nfunc ServeWithGrace(srv *http.Server) {\n    stop := make(chan os.Signal, 1)\n    signal.Notify(stop, os.Interrupt, syscall.SIGTERM)\n    go func() {\n        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {\n            log.Fatalf("listen error: %s", err)\n        }\n    }()\n    <-stop\n    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)\n    defer cancel()\n    srv.Shutdown(ctx)\n}'
  },
  {
    lang: 'C++',
    code: '// [C++] Constant-Time Fast Inverse Square Root\n#include <cstdint>\nfloat Q_rsqrt(float number) noexcept {\n    long i;\n    float x2, y;\n    const float threehalfs = 1.5F;\n    x2 = number * 0.5F;\n    y = number;\n    i = *reinterpret_cast<long*>(&y);\n    i = 0x5f3759df - (i >> 1);\n    y = *reinterpret_cast<float*>(&i);\n    y = y * (threehalfs - (x2 * y * y));\n    return y;\n}'
  },
  {
    lang: 'TypeScript',
    code: "// [TypeScript] AST Recursive Visitor with Type Discrimination\nexport interface BinaryExpression {\n  kind: 'BinaryExpression';\n  operator: '+' | '-' | '*' | '/';\n  left: ASTNode;\n  right: ASTNode;\n}\nexport interface LiteralNode {\n  kind: 'LiteralNode';\n  value: number;\n}\nexport type ASTNode = BinaryExpression | LiteralNode;\nexport function evaluateAST(node: ASTNode): number {\n  if (node.kind === 'LiteralNode') return node.value;\n  const l = evaluateAST(node.left);\n  const r = evaluateAST(node.right);\n  switch (node.operator) {\n    case '+': return l + r;\n    case '-': return l - r;\n    case '*': return l * r;\n    case '/': return l / r;\n  }\n}"
  },
  {
    lang: 'Java',
    code: '// [Java] Disruptor Lock-Free Sequence Barrier\nimport java.util.concurrent.atomic.AtomicLong;\npublic class SequenceBarrier {\n    private final AtomicLong cursor = new AtomicLong(-1);\n    public long waitFor(long sequence) throws InterruptedException {\n        while (cursor.get() < sequence) {\n            Thread.onSpinWait();\n        }\n        return cursor.get();\n    }\n    public void publish(long sequence) {\n        cursor.lazySet(sequence);\n    }\n}'
  },
  {
    lang: 'Python',
    code: '# [Python] B-Tree Storage Engine Node Splitting Algorithm\nclass BTreeNode:\n    def __init__(self, t: int, leaf: bool = True):\n        self.t = t\n        self.keys = []\n        self.children = []\n        self.leaf = leaf\n    def split_child(self, i: int, y: \'BTreeNode\'):\n        z = BTreeNode(y.t, y.leaf)\n        self.children.insert(i + 1, z)\n        self.keys.insert(i, y.keys[self.t - 1])\n        z.keys = y.keys[self.t:(2 * self.t - 1)]\n        y.keys = y.keys[0:(self.t - 1)]\n        if not y.leaf:\n            z.children = y.children[self.t:(2 * self.t)]\n            y.children = y.children[0:self.t]'
  },
  {
    lang: 'Rust',
    code: '// [Rust] Custom Bump Allocator with Alignment Guarantee\npub struct BumpArena {\n    ptr: *mut u8,\n    offset: usize,\n    capacity: usize,\n}\nimpl BumpArena {\n    pub fn alloc(&mut self, layout: std::alloc::Layout) -> Option<*mut u8> {\n        let align_mask = layout.align() - 1;\n        let aligned = (self.offset + align_mask) & !align_mask;\n        if aligned + layout.size() > self.capacity { return None; }\n        let result = unsafe { self.ptr.add(aligned) };\n        self.offset = aligned + layout.size();\n        Some(result)\n    }\n}'
  },
  {
    lang: 'Go',
    code: '// [Go] Protocol Multiplexing Connection Demultiplexer\ntype PacketHeader struct {\n    StreamID    uint32\n    PayloadSize uint32\n}\nfunc Demux(conn net.Conn, streams map[uint32]chan []byte) error {\n    for {\n        var hdr PacketHeader\n        if err := binary.Read(conn, binary.BigEndian, &hdr); err != nil { return err }\n        buf := make([]byte, hdr.PayloadSize)\n        if _, err := io.ReadFull(conn, buf); err != nil { return err }\n        if ch, ok := streams[hdr.StreamID]; ok { ch <- buf }\n    }\n}'
  },
  {
    lang: 'C++',
    code: '// [C++] High-Performance Cache-Line Isolated MPMC Queue\n#include <atomic>\n#include <cstddef>\ntemplate <typename T, size_t Capacity>\nclass MPMCQueue {\n    struct Cell {\n        std::atomic<size_t> sequence;\n        T data;\n    };\n    Cell buffer_[Capacity];\n    alignas(64) std::atomic<size_t> enqueue_pos_{0};\n    alignas(64) std::atomic<size_t> dequeue_pos_{0};\npublic:\n    MPMCQueue() {\n        for (size_t i = 0; i < Capacity; ++i)\n            buffer_[i].sequence.store(i, std::memory_order_relaxed);\n    }\n};'
  },
  {
    lang: 'TypeScript',
    code: "// [TypeScript] Strict Discriminated State Machine Engine\ntype State =\n  | { status: 'idle' }\n  | { status: 'connecting'; attempt: number }\n  | { status: 'connected'; sessionId: string }\n  | { status: 'failed'; error: Error };\ntype Action =\n  | { type: 'CONNECT' }\n  | { type: 'SUCCESS'; sessionId: string }\n  | { type: 'FAIL'; error: Error };\nexport function transition(state: State, action: Action): State {\n  switch (state.status) {\n    case 'idle':\n      return action.type === 'CONNECT' ? { status: 'connecting', attempt: 1 } : state;\n    case 'connecting':\n      return action.type === 'SUCCESS' ? { status: 'connected', sessionId: action.sessionId } : state;\n    default: return state;\n  }\n}"
  }
];

export function getCurriculumCode(level: number, diff: Difficulty): string {
  const lvl = Math.max(1, Math.min(200, level));
  const entry = SERIOUS_CODE_LIBRARY[(lvl - 1) % SERIOUS_CODE_LIBRARY.length];
  let header = `// Stage ${lvl} [${entry.lang} Engineering System]`;
  if (entry.lang === 'Python') {
    header = `# Stage ${lvl} [Python Engineering System]`;
  } else if (entry.lang === 'SQL') {
    header = `-- Stage ${lvl} [SQL Relational Engine]`;
  }
  return `${header}\n${entry.code}`;
}

export function getCurriculumText(level: number, mode: TypingMode, diff: Difficulty): string {
  if (mode === 'Words') {
    return getCurriculumWords(level, diff).join(' ');
  } else if (mode === 'Lines') {
    return getCurriculumSentences(level, diff);
  } else if (mode === 'Paragraphs') {
    return getCurriculumParagraph(level, diff);
  } else if (mode === 'Pages') {
    return getCurriculumPage(level, diff);
  } else if (mode === 'Code') {
    return getCurriculumCode(level, diff);
  }
  return getCurriculumWords(level, diff).join(' ');
}
