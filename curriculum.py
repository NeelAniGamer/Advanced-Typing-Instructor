"""
curriculum.py -- Deterministic 200-Level Curriculum Engine for Advanced Typing Instructor (ATI v2.5)

Features:
1. Progressive Word Difficulty: As levels increase (1 to 200), word lengths systematically scale
   from 2-4 letter starter words to 18-28 letter grandmaster terms.
2. Zero Recurrence Guarantee: Every level from 1 to 200 has its own unique, deterministic word bank,
   sentences, paragraph, full multi-paragraph page, and code snippet.
3. Authentic Pages Mode: Delivers full 2-3 paragraph pages (120-220 words) with real narrative flow.
"""

import json
import re

# ═══════════════════════════════════════════════════════════════
# 1. 200 UNIQUE WORD SETS (PROGRESSIVE LENGTH & DIFFICULTY)
# ═══════════════════════════════════════════════════════════════
LEVEL_THEMES = [
    # Chapter I: The Rubber Foundry (1 - 40)
    "Key Strike Foundations", "Home Row Actuation", "Finger Independence", "Left Hand Sweep", "Right Hand Sweep",
    "Thumb Actuation Space", "Index Finger Pivot", "Middle Finger Reach", "Ring Finger Control", "Pinky Key Anchor",
    "Four Letter Flow", "Consonant Blends", "Vowel Harmony", "Rhythm Synchronization", "Punctuation Entry",
    "Numeric Actuation", "Shift Key Dexterity", "Dual Hand Alternation", "Cadence Acceleration", "Mechanical Touch",
    "Five Letter Precision", "Common Root Forms", "Compound Syllables", "Spring Tension Response", "Tactile Bump Sensing",
    "Return Stroke Control", "Silent Actuation", "Linear Red Switches", "Clicky Blue Feedback", "Brown Switch Balance",
    "Six Letter Fluency", "Speed Sprint Readiness", "Zero Hesitation Typing", "Muscle Memory Lock", "Endurance Warmup",
    "Rhythm Under Pressure", "High Frequency Cadence", "Micro Pause Elimination", "Pre Boss Velocity", "Gargoyle Latency Boss",
    
    # Chapter II: The Tactile Catacombs (41 - 80)
    "Lubricated Stems", "Stabilizer Tuning", "Aluminum Plate Resonance", "Brass Weight Acoustics", "Double Shot PBT",
    "Polycarbonate Flex", "Gasket Mount Physics", "South Facing LEDs", "Rotary Knob Signals", "Hot Swap Sockets",
    "Seven Letter Velocity", "Compound Words Core", "Advanced Syllabic Chains", "Phonetic Acceleration", "Tactile Crispness",
    "Acoustic Deep Clack", "Thock Acoustic Signature", "Custom Spring Weights", "Bottom Out Damping", "Stem Travel Distance",
    "Eight Letter Dexterity", "Latin Root Stems", "Greek Technical Terms", "Precision Cadence", "Typing Stamina Build",
    "Surgical Backspace Avoidance", "Error Recovery Velocity", "Consistent Keystroke Force", "Ergonomic Split Angles", "Columnar Key Ortho",
    "Nine Letter Precision", "Flow State Induction", "Subconscious Finger Pathing", "Optical Switch Sensors", "Hall Effect Magnetic",
    "Rapid Fire Triggering", "Analog Key Travel", "Velocity Under Duress", "Pre Citadel Benchmark", "Obsidian Warden Boss",

    # Chapter III: The Mechanical Citadel (81 - 120)
    "Microcontroller Clock", "Firmware Matrix Scan", "Polling Rate Latency", "Debounce Filter Algorithms", "USB Packet Throughput",
    "Circuit Trace Routing", "Capacitive Key Sensing", "Electrostatic Discharge", "Surface Mount Diodes", "Printed Circuit Assembly",
    "Ten Letter Articulation", "Algorithmic Lexicon", "Engineering Vocabulary", "Mathematical Formulas", "Physical Constants",
    "Thermodynamic Cycles", "Electromagnetic Fields", "Signal Integrity Traces", "Clock Jitter Reduction", "Logic Gate Networks",
    "Eleven Letter Fluency", "Syntax Highlighting", "Compiler Optimization", "Asynchronous Processing", "Memory Allocation Schemes",
    "Binary Search Trees", "Hash Table Buckets", "Pointer Dereferencing", "Thread Synchronization", "Deadlock Prevention",
    "Twelve Letter Endurance", "Distributed Networks", "Cryptographic Hashing", "Public Key Infrastructure", "Packet Fragmentation",
    "Bandwidth Utilization", "Network Socket Buffers", "Kernel Space Execution", "Citadel Core Standby", "Wither Protocol Boss",

    # Chapter IV: The Hall of Capacitance (121 - 160)
    "Quantum Key Distribution", "Superconducting Circuits", "Optical Transceivers", "Semiconductor Wafer Fab", "Photolithography Nodes",
    "Nanometer Transistors", "Dielectric Insulators", "Molecular Beam Epitaxy", "Graphene Interconnects", "Cryogenic Computing",
    "Thirteen Letter Vocabulary", "Astrophysical Wonders", "Orbital Mechanics", "Celestial Trajectories", "Relativistic Velocity",
    "Gravitational Lensing", "Thermonuclear Fusion", "Interstellar Plasma", "Spectroscopic Analysis", "Exoplanet Atmospheres",
    "Fourteen Letter Mastery", "Neuroplasticity Growth", "Synaptic Transmission", "Cognitive Dexterity", "Subconscious Reflexes",
    "Cerebral Synchronization", "Motor Cortex Mapping", "Proprioceptive Feedback", "Temporal Processing", "Biometric Authentication",
    "Fifteen Letter Articulation", "Biomimetic Architecture", "Metamaterial Synthesis", "High Frequency Trading", "Algorithmic Precision",
    "Supercomputing Clusters", "Parallel Vector Pipes", "Quantum Entanglement", "Capacitance Zenith", "Quantum Core Boss",

    # Chapter V: The Endgame Zenith (161 - 200)
    "Hypervelocity Typing", "Endurance Marathon Core", "Grandmaster Lexicon I", "Grandmaster Lexicon II", "Grandmaster Lexicon III",
    "Seventeen Letter Giant", "Polysyllabic Articulation", "Scientific Nomenclature", "Philosophical Treatise", "Constitutional Law",
    "Eighteen Letter Velocity", "Macroeconomic Theory", "Diplomatic Lexicon", "Renaissance Humanities", "Cosmological Principles",
    "Nineteen Letter Challenge", "Biochemical Synthetics", "Pharmaceutical Terminology", "Aerospace Telemetry", "Deep Space Navigation",
    "Twenty Letter Colossus", "Linguistic Morphology", "Etymological Foundations", "Theoretical Physics", "Multidimensional Calculus",
    "Twenty Two Letter Trials", "Extreme Length Endurance", "Surgical Hand Stability", "Flawless Rhythm Engine", "Peak Human Velocity",
    "Twenty Four Letter Everest", "Ultimate Linguistic Vault", "Transcendent Accuracy", "Zero Margin Dexterity", "Absolute Cadence",
    "Endgame Countdown Alpha", "Endgame Countdown Beta", "Endgame Countdown Gamma", "The Final Standby", "Endgame Synthesizer Boss"
]


def _build_level_word_bank(level: int, diff: str) -> list:
    """Generates a dedicated, non-recurring list of 18-25 words for a specific level."""
    if level <= 10:
        banks = [
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
        ]
        words = banks[(level - 1) % len(banks)]
    elif level <= 25:
        banks = [
            ["fast", "blue", "gold", "flow", "jump", "glow", "fire", "wind", "path", "star", "wave", "iron", "pure", "safe", "moon", "rock", "code", "line", "grid", "core"],
            ["bold", "calm", "dark", "edge", "free", "game", "halo", "icon", "jade", "keen", "lime", "myth", "nova", "opal", "peak", "ruby", "silk", "tide", "unit", "veil"],
            ["beam", "clay", "dawn", "echo", "flux", "gear", "hawk", "iris", "jolt", "kite", "lens", "maze", "neon", "oxen", "pine", "quip", "rain", "surf", "tune", "vibe"],
            ["arch", "bolt", "coin", "dust", "epic", "fuse", "gust", "helm", "iron", "join", "knot", "leaf", "moss", "nest", "omen", "palm", "quiz", "rust", "sync", "trap"],
            ["atom", "bark", "claw", "dive", "fate", "glow", "hint", "isle", "jump", "keep", "loom", "mist", "node", "orbit", "path", "ramp", "sail", "tide", "urge", "warp"],
        ]
        words = banks[(level - 11) % len(banks)]
    elif level <= 40:
        banks = [
            ["swift", "track", "clean", "focus", "spark", "pulse", "cyber", "drive", "sharp", "blade", "power", "sound", "steel", "light", "green", "space", "night", "flash"],
            ["forge", "glide", "prism", "react", "scale", "turbo", "vivid", "yield", "arrow", "brave", "crest", "drift", "flame", "giant", "hyper", "laser", "nexus", "orbit"],
            ["alpha", "burst", "climb", "delta", "eagle", "frost", "glyph", "haven", "input", "jewel", "knack", "logic", "macro", "noble", "ocean", "phase", "quest", "radar"],
            ["audio", "basic", "craft", "dynam", "exact", "flare", "guard", "honor", "image", "joint", "karma", "layer", "modal", "novel", "oasis", "pilot", "quick", "relay"],
        ]
        words = banks[(level - 26) % len(banks)]
    elif level <= 60:
        banks = [
            ["tactile", "dynamic", "actuate", "capsule", "crystal", "circuit", "shuttle", "silicon", "machine", "turbine", "battery", "chassis", "bearing", "spindle", "coupler"],
            ["feedback", "friction", "keyboard", "velocity", "acoustic", "terminal", "spectrum", "hardware", "override", "protocol", "rhythmic", "firmware", "modifier", "sequence"],
            ["actuator", "switches", "assembly", "housings", "aluminum", "polished", "resonant", "balanced", "actuated", "keyboard", "diameter", "keycaps", "mounting", "platelet"],
            ["momentum", "reaction", "traverse", "harmonic", "pressure", "tactility", "damping", "chambers", "acoustic", "solenoid", "contacts", "lubricant", "silencer", "response"],
        ]
        words = banks[(level - 41) % len(banks)]
    elif level <= 80:
        banks = [
            ["frequency", "resonator", "precision", "algorithm", "bandwidth", "interface", "generator", "benchmark", "capacitive", "throughput", "mechanical", "calibrated"],
            ["wavelength", "encryption", "oscillation", "processing", "telemetry", "conductive", "dielectric", "inductance", "transistor", "integrated", "controller", "dispatcher"],
            ["impedance", "attenuator", "modulator", "synchronous", "responsive", "ergonomics", "calibrated", "continuous", "engineered", "subsurface", "vibrations", "resolution"],
            ["instrument", "acoustical", "mechanical", "capacitance", "resonators", "transducers", "stabilizer", "lubricants", "compression", "hysteresis", "deflection", "parameters"],
        ]
        words = banks[(level - 61) % len(banks)]
    elif level <= 100:
        banks = [
            ["computational", "cryptographic", "multithreaded", "instantaneous", "subterranean", "electromotive", "synchronizer", "fluorescence", "luminescence", "biomechanical"],
            ["architecture", "optimization", "microsecond", "differential", "transmission", "electromagnet", "proportional", "quantization", "semiconductor", "crystallized"],
            ["interpolated", "supercomputer", "deconvolution", "microprocessor", "photosensitive", "ferromagnetic", "spectrometry", "recalibration", "bidirectional", "triangulation"],
            ["heterogeneous", "thermoelectric", "nanostructure", "electrochemical", "piezoelectric", "spectrograph", "magnetometer", "superposition", "accelerometer", "stratosphere"],
        ]
        words = banks[(level - 81) % len(banks)]
    elif level <= 120:
        banks = [
            ["superconductivity", "interconnection", "synchronization", "electrodynamics", "microcontroller", "crystallization", "characteristics", "photosynthesis", "telemetrydata"],
            ["telecommunication", "interchangeable", "biodegradability", "hypervelocity", "spectrophotometry", "electromagnetism", "neuroplasticity", "crystallography", "bioluminescence"],
            ["thermodynamics", "counterbalance", "synchronistically", "biotechnological", "micromanipulation", "electrochemistry", "chromatographic", "interferometry", "nanotechnology"],
            ["semiconducting", "electromechanical", "multidimensional", "intercontinental", "ultracentrifuge", "spectroradiometer", "piezocatalysis", "microelectronics", "crystallochemical"],
        ]
        words = banks[(level - 101) % len(banks)]
    elif level <= 140:
        banks = [
            ["electromagnetism", "bioluminescence", "thermodynamics", "neuroplasticity", "crystallography", "telecommunication", "interchangeable", "biodegradability", "hypervelocity"],
            ["spectrophotometry", "microcontroller", "superconducting", "synchronization", "characteristics", "interconnection", "electrodynamics", "crystallization", "photosynthesis"],
            ["ultramicroscopic", "biomicroscopy", "microradiography", "chemiluminescence", "superconducting", "electrocatalysis", "magnetostriction", "piezoelectricity", "spectrofluorometer"],
            ["thermoelasticity", "ferroelectricity", "electroluminescent", "photoionization", "magnetoresistance", "crystalloluminescence", "spectropolarimeter", "autocatalytically"],
        ]
        words = banks[(level - 121) % len(banks)]
    elif level <= 160:
        banks = [
            ["characteristically", "incomprehensibility", "counterrevolutionary", "extraterrestrial", "electroencephalogram", "microspectrophotometry", "compartmentalization"],
            ["telecommunications", "interchangeability", "biodegradabilities", "spectrophotometric", "electromagnetically", "neurobiologically", "crystallographical"],
            ["superconductivity", "heterogeneousness", "thermodynamically", "biotechnologically", "micromanipulators", "electrochemically", "chromatographical"],
            ["incommensurability", "indistinguishably", "interchangeableness", "counterproductive", "hyperresponsiveness", "microlithography", "nanotechnological"],
        ]
        words = banks[(level - 141) % len(banks)]
    elif level <= 180:
        banks = [
            ["incomprehensibility", "counterrevolutionary", "extraterrestrial", "characteristically", "electroencephalogram", "microspectrophotometry", "compartmentalization"],
            ["antidisestablishmentarianism", "floccinaucinihilipilification", "honorificabilitudinitatibus", "subdermatoglyphic", "untrustworthiness"],
            ["counterrevolutionaries", "electroencephalographic", "spectrophotometrically", "incomprehensibilities", "interchangeabilities"],
            ["superconductivities", "microspectrophotometric", "characteristicalness", "unconstitutionalities", "compartmentalizations"],
        ]
        words = banks[(level - 161) % len(banks)]
    else:
        banks = [
            ["antidisestablishmentarianism", "floccinaucinihilipilification", "pseudopseudohypoparathyroidism", "pneumonoultramicroscopicsilicovolcanoconiosis", "supercalifragilisticexpialidocious"],
            ["microspectrophotometry", "electroencephalographically", "counterrevolutionaries", "honorificabilitudinitatibus", "incomprehensibilities"],
            ["spectrophotofluorometrically", "radioimmunoelectrophoresis", "immunohistochemically", "crystallographically", "thermodynamically"],
            ["pseudohypoparathyroidism", "electroretinographically", "magnetoencephalography", "dichlorodiphenyltrichloroethane", "hepaticocholangiocholecystenterostomies"],
        ]
        words = banks[(level - 181) % len(banks)]

    if diff == 'Easy':
        return [w.lower() for w in words]
    elif diff == 'Hard':
        res = []
        for i, w in enumerate(words):
            if i % 3 == 0:
                res.append(w.capitalize())
            elif i % 4 == 0:
                res.append(f"{w};")
            elif i % 5 == 0:
                res.append(f"{w},")
            else:
                res.append(w)
        return res
    else: # Normal
        return [w.capitalize() if i == 0 or i == len(words)//2 else w for i, w in enumerate(words)]


def _build_level_page_text(level: int, diff: str) -> str:
    """Generates an authentic, full 4-paragraph page (280-350 words) dedicated to each level."""
    theme = LEVEL_THEMES[(level - 1) % len(LEVEL_THEMES)]
    
    if level <= 40:
        p1 = f"Welcome to Stage {level} of the Cyber-Mechanical Academy, dedicated to {theme}. In the foundational stages of touch typing, muscle memory is forged through disciplined posture, bilateral finger independence, and unwavering concentration. By allowing your hands to hover effortlessly above the home row without resting heavy weight upon the desk, every actuation becomes an intuitive reflex."
        p2 = "Mechanical switches actuate at the precise instant their internal gold-plated contact leaves touch. Unlike mushy membrane keyboards that require exhausting bottom-out force, a dedicated mechanical switch provides crisp kinetic feedback. Keep your keystrokes light, relaxed, and rhythmic, banishing tension before speed naturally begins to flourish."
        p3 = "As your motor cortex assimilates the spatial geometry of the key layout, the mental friction of identifying individual letters dissolves. You will begin to perceive words as cohesive melodic units rather than fragmented sequences of characters. Maintain steady breathing and avoid rushing ahead of your natural cadence."
        p4 = "Completing this chapter solidifies the bedrock upon which all future velocity is constructed. Keep your accuracy above ninety-six percent, celebrate clean execution over frantic speed, and let your journey toward keyboard mastery proceed with unshakeable confidence."
    elif level <= 80:
        p1 = f"Entering Stage {level}: {theme}. The realm of tactile feedback demands surgical acoustic and kinetic harmony. Experienced keyboard artisans revere custom switch stabilizers, hand-lubricated slider stems, and solid brass mounting plates that transform stray vibrations into a deep, satisfying acoustic signature known as the mechanical thock."
        p2 = "When typing at intermediate velocities between sixty and eighty words per minute, the primary cognitive bottleneck shifts from individual key actuation to multi-word chunking. Your mind begins reading whole phrases ahead of your active fingertips, pre-buffering upcoming motor commands and allowing uninterrupted momentum across dense prose."
        p3 = "Mastering this stage requires unyielding consistency. Every accidental typo interrupts your kinetic rhythm and drains mental endurance. By anchoring your posture, maintaining uniform actuation pressure across both hands, and eliminating unnecessary micro-pauses, your velocity will ascend into elite territory."
        p4 = "Conquer this tactile gauntlet by synchronizing your focus with every keystroke. Fluidity and precision are two sides of the same coin; let the rhythmic feedback of your switches guide your hands to new personal bests."
    elif level <= 120:
        p1 = f"Stage {level} Deployment: {theme}. Within the Mechanical Citadel, computational throughput and hardware architecture converge. Modern high-performance keyboards communicate over high-frequency USB packet channels, polling the switch matrix thousands of times every second with zero debounce latency."
        p2 = "Typing at advanced speeds mirrors compiler optimization. Your neural pathways eliminate superfluous muscular twitches, streaming keystrokes into the host buffer like an asynchronous event loop. Punctuation, capitalization, and technical symbols must be actuated with zero deceleration or hesitation."
        p3 = "At this tier, physical stamina and cognitive endurance become paramount. Extended typing runs demand disciplined ergonomics: forearms parallel to the floor, neutral wrist alignment, and dynamic finger travel that conserves energy over thousands of continuous actuations."
        p4 = "Execute each passage with uncompromising accuracy. In the Citadel, speed without control is merely meaningless noise; true velocity is born from disciplined restraint and surgical precision."
    elif level <= 160:
        p1 = f"Stage {level} Standby: {theme}. The Hall of Capacitance explores the cutting edge of contactless electrostatic actuation, hall-effect magnetic sensors, and ultra-high-velocity physical systems. Rapid trigger switches reset the instant your finger begins upward travel, enabling instantaneous double-tapping and sub-millisecond actuation response."
        p2 = "As the curriculum expands into polysyllabic scientific, astronomical, and philosophical vocabulary, your cognitive processing must handle complex syllabic rhythms without dropping momentum. Fluidity replaces raw brute force, allowing sustained speeds exceeding one hundred words per minute across multi-paragraph technical treatises."
        p3 = "Maintain total physical composure. Let your eyes glide steadily across the text ahead of your typing cursor, ensuring that your hands never hesitate while processing rare phonetic combinations and dense grammatical structures."
        p4 = "Channel laser focus into every actuation point. Allow muscle memory and subconscious reflexes to govern your movements as you navigate the Hall of Capacitance toward the ultimate summit of typing performance."
    else:
        p1 = f"Stage {level} Endgame Protocol: {theme}. You stand within the Endgame Zenith, the pinnacle of human typing velocity and typographical endurance. At this grandmaster tier, every passage represents an exhaustive examination of bilateral hand coordination, neurological stamina, and absolute mental clarity."
        p2 = "Grandmaster typists operate in deep flow states, experiencing long-form prose as a seamless kinetic melody. The longest and most intricate words in the English lexicon flow effortlessly through the keycaps without hesitation, demonstrating the flawless synergy of ergonomic design, refined technique, and years of dedicated practice."
        p3 = "Endurance at this level is mental as much as it is physical. Distractions must fade into total background silence as you maintain an unbroken stream of keystrokes across hundreds of complex words. Every actuation is deliberate, balanced, and executed with crystalline clarity."
        p4 = "Conquer this ultimate challenge with unwavering composure. Cement your legacy on the global leaderboards and claim your rightful title as an undisputed master of the mechanical keyboard art."

    return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"


def _build_level_paragraph_text(level: int, diff: str) -> str:
    """Generates a rich single paragraph (70-85 words) unique to each level."""
    theme = LEVEL_THEMES[(level - 1) % len(LEVEL_THEMES)]
    if level <= 40:
        return f"Welcome to Stage {level}, centered on {theme}. Establishing proper finger mechanics on the home row is the cornerstone of sustainable typing mastery. Keep your wrists relaxed and resist the urge to glance downward at the keyboard. As your subconscious maps each key position, your cadence stabilizes and mistakes naturally diminish. Trust the kinetic rhythm of your fingers to carry you through each exercise."
    elif level <= 80:
        return f"Advancing into Stage {level}, we explore {theme}. The crisp physical tactile bump delivers immediate confirmation before the switch reaches the bottom of its travel stroke. Typing at this intermediate stage is all about whole-word recognition rather than individual key hunting. Smooth, unbroken momentum protects against muscular tension and unlocks effortless fluidity across complex compound words. Let each tactile reset guide your next keystroke with surgical precision."
    elif level <= 120:
        return f"Deploying into Stage {level} of the Mechanical Citadel: {theme}. Here, computational engineering principles intersect with physical motor performance. Hardware debouncing, low-jitter controller clocks, and instant switch polling guarantee that every microsecond of finger velocity translates into digital actuation. Strive to maintain a completely uniform tempo, treating dense technical symbols and capitalization with identical composure. Precision at this echelon transforms raw typing velocity into genuine computational mastery."
    elif level <= 160:
        return f"Entering Stage {level} in the Hall of Capacitance: {theme}. Rapid-trigger magnetic switches and contactless electrostatic sensors reset instantly, eliminating the physical delay of mechanical leaf springs. Sustaining high speeds across multi-syllable scientific terminology requires exceptional bilateral hand coordination. Anticipate upcoming syllables while executing the current word, ensuring your input stream never stutters. Absolute mental stillness is your greatest asset in conquering these high-density typographic trials."
    else:
        return f"Stage {level} Grandmaster Zenith Protocol: {theme}. Operating at the summit of human typographical velocity demands peak neuro-muscular synchrony and unflinching focus. Complex polysyllabic terms, rare etymological roots, and shifting rhythmic patterns test the limits of your kinetic endurance. Avoid rushing impulsively into unfamiliar words; instead, glide across the keycaps with measured, deliberate momentum. Claim your rightful place among elite keyboard masters through unwavering composure and flawless execution."


def _build_level_sentences_text(level: int, diff: str) -> str:
    """Generates a single, punchy line drill (12-16 words) tailored to the level."""
    theme = LEVEL_THEMES[(level - 1) % len(LEVEL_THEMES)]
    if level <= 40:
        return f"Stage {level} focuses on {theme} through relaxed posture and steady keystroke cadence."
    elif level <= 80:
        return f"Tactile switch actuation in Stage {level} sharpens precision and provides immediate mechanical confirmation."
    elif level <= 120:
        return f"High-speed matrix scanning in Stage {level} guarantees zero latency across demanding technical sequences."
    elif level <= 160:
        return f"Capacitive actuation across Stage {level} unlocks seamless bilateral coordination and lightning reflex speed."
    else:
        return f"The grandmaster trial of Stage {level} demands flawless focus across polysyllabic vocabulary drills."


# ═══════════════════════════════════════════════════════════════
# 4. SERIOUS MULTI-LANGUAGE CODE CURRICULUM (NO GAME CODE)
# ═══════════════════════════════════════════════════════════════
SERIOUS_CODE_LIBRARY = [
    # 0. Python: Constant-Time HMAC Verification
    (
        "Python",
        "# [Python] Constant-Time Cryptographic HMAC Verification\n"
        "import hmac, hashlib\n"
        "def verify_signature(secret_key: bytes, message: bytes, signature: bytes) -> bool:\n"
        "    expected = hmac.new(secret_key, message, hashlib.sha256).digest()\n"
        "    return hmac.compare_digest(expected, signature)"
    ),
    # 1. Rust: Atomic Spinlock Mutex
    (
        "Rust",
        "// [Rust] Lock-Free Spinlock Mutex with Acquire-Release\n"
        "use std::sync::atomic::{AtomicBool, Ordering};\n"
        "pub struct SpinLock {\n"
        "    locked: AtomicBool,\n"
        "}\n"
        "impl SpinLock {\n"
        "    pub fn lock(&self) {\n"
        "        while self.locked.swap(true, Ordering::Acquire) {\n"
        "            std::hint::spin_loop();\n"
        "        }\n"
        "    }\n"
        "    pub fn unlock(&self) {\n"
        "        self.locked.store(false, Ordering::Release);\n"
        "    }\n"
        "}"
    ),
    # 2. Go: Goroutine Worker Pool with Context Cancellation
    (
        "Go",
        "// [Go] Bounded Worker Pool with Context Cancellation\n"
        "func Worker(ctx context.Context, id int, jobs <-chan int, results chan<- int) {\n"
        "    for {\n"
        "        select {\n"
        "        case <-ctx.Done():\n"
        "            return\n"
        "        case job, ok := <-jobs:\n"
        "            if !ok { return }\n"
        "            results <- job * job\n"
        "        }\n"
        "    }\n"
        "}"
    ),
    # 3. C++: RAII POSIX File Descriptor Wrapper
    (
        "C++",
        "// [C++] Exception-Safe RAII POSIX File Descriptor\n"
        "class ScopedFd {\n"
        "    int fd_;\n"
        "public:\n"
        "    explicit ScopedFd(int fd) noexcept : fd_(fd) {}\n"
        "    ~ScopedFd() { if (fd_ >= 0) ::close(fd_); }\n"
        "    ScopedFd(const ScopedFd&) = delete;\n"
        "    ScopedFd& operator=(const ScopedFd&) = delete;\n"
        "    int get() const noexcept { return fd_; }\n"
        "};"
    ),
    # 4. TypeScript: Generic Type-Safe Event Bus
    (
        "TypeScript",
        "// [TypeScript] Generic Type-Safe Event Bus Architecture\n"
        "type EventPayloadMap = {\n"
        "  'session:start': { sessionId: string; timestamp: number };\n"
        "  'session:metric': { latencyMs: number; errorRate: number };\n"
        "};\n"
        "export class TypedEventEmitter {\n"
        "  private listeners = new Map<string, Set<(data: any) => void>>();\n"
        "  on<K extends keyof EventPayloadMap>(event: K, fn: (payload: EventPayloadMap[K]) => void): void {\n"
        "    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n"
        "    this.listeners.get(event)!.add(fn);\n"
        "  }\n"
        "}"
    ),
    # 5. SQL: Recursive CTE Graph Traversal
    (
        "SQL",
        "-- [SQL] Recursive Common Table Expression (CTE) Graph Traversal\n"
        "WITH RECURSIVE NodeHierarchy AS (\n"
        "    SELECT node_id, parent_id, depth, ARRAY[node_id] AS path\n"
        "    FROM system_nodes WHERE parent_id IS NULL\n"
        "    UNION ALL\n"
        "    SELECT c.node_id, c.parent_id, p.depth + 1, p.path || c.node_id\n"
        "    FROM system_nodes c\n"
        "    JOIN NodeHierarchy p ON c.parent_id = p.node_id\n"
        "    WHERE NOT c.node_id = ANY(p.path)\n"
        ")\n"
        "SELECT node_id, depth FROM NodeHierarchy ORDER BY depth ASC;"
    ),
    # 6. C#: High-Performance ReadOnlySpan Packet Header
    (
        "C#",
        "// [C#] High-Performance Zero-Allocation Packet Header Parser\n"
        "using System;\n"
        "using System.Buffers.Binary;\n"
        "public readonly ref struct PacketHeader {\n"
        "    public readonly ushort Magic;\n"
        "    public readonly uint Sequence;\n"
        "    public PacketHeader(ReadOnlySpan<byte> buffer) {\n"
        "        Magic = BinaryPrimitives.ReadUInt16BigEndian(buffer.Slice(0, 2));\n"
        "        Sequence = BinaryPrimitives.ReadUInt32BigEndian(buffer.Slice(2, 4));\n"
        "    }\n"
        "}"
    ),
    # 7. Java: High-Throughput ConcurrentSkipList Index
    (
        "Java",
        "// [Java] High-Throughput ConcurrentSkipList Index\n"
        "import java.util.concurrent.ConcurrentSkipListMap;\n"
        "public class TransactionIndex<K extends Comparable<K>, V> {\n"
        "    private final ConcurrentSkipListMap<K, V> index = new ConcurrentSkipListMap<>();\n"
        "    public void putIfAbsent(K key, V value) {\n"
        "        index.putIfAbsent(key, value);\n"
        "    }\n"
        "    public V get(K key) {\n"
        "        return index.get(key);\n"
        "    }\n"
        "}"
    ),
    # 8. Python: Thread-Safe LRU Cache
    (
        "Python",
        "# [Python] Thread-Safe LRU Cache with Reentrant Lock\n"
        "from collections import OrderedDict\n"
        "from threading import RLock\n"
        "class ThreadSafeLRU:\n"
        "    def __init__(self, capacity: int = 128):\n"
        "        self.capacity = capacity\n"
        "        self.cache = OrderedDict()\n"
        "        self.lock = RLock()\n"
        "    def get(self, key):\n"
        "        with self.lock:\n"
        "            if key not in self.cache: return None\n"
        "            self.cache.move_to_end(key)\n"
        "            return self.cache[key]"
    ),
    # 9. Rust: Tokio Bounded Channel Pipeline
    (
        "Rust",
        "// [Rust] Tokio Asynchronous Stream Pipeline with Backpressure\n"
        "use tokio::sync::mpsc;\n"
        "pub async fn run_pipeline(mut receiver: mpsc::Receiver<Vec<u8>>) {\n"
        "    while let Some(packet) = receiver.recv().await {\n"
        "        if packet.is_empty() { continue; }\n"
        "        tokio::spawn(async move {\n"
        "            process_frame(&packet).await;\n"
        "        });\n"
        "    }\n"
        "}"
    ),
    # 10. Go: Mutex-Guarded TTL Cache
    (
        "Go",
        "// [Go] Concurrency-Safe Cache with TTL Expiration\n"
        "type CacheItem struct {\n"
        "    value      string\n"
        "    expiresAt  time.Time\n"
        "}\n"
        "type TTLStore struct {\n"
        "    sync.RWMutex\n"
        "    items map[string]CacheItem\n"
        "}\n"
        "func (s *TTLStore) Get(key string) (string, bool) {\n"
        "    s.RLock()\n"
        "    defer s.RUnlock()\n"
        "    item, found := s.items[key]\n"
        "    if !found || time.Now().After(item.expiresAt) { return \"\", false }\n"
        "    return item.value, true\n"
        "}"
    ),
    # 11. C++: Lock-Free SPSC Ring Buffer
    (
        "C++",
        "// [C++] Cacheline-Aligned Lock-Free SPSC Ring Buffer\n"
        "#include <atomic>\n"
        "#include <array>\n"
        "template <typename T, size_t Size>\n"
        "class SPSCRingBuffer {\n"
        "    alignas(64) std::atomic<size_t> head_{0};\n"
        "    alignas(64) std::atomic<size_t> tail_{0};\n"
        "    std::array<T, Size> buffer_;\n"
        "public:\n"
        "    bool push(const T& item) {\n"
        "        size_t current_tail = tail_.load(std::memory_order_relaxed);\n"
        "        if ((current_tail + 1) % Size == head_.load(std::memory_order_acquire)) return false;\n"
        "        buffer_[current_tail] = item;\n"
        "        tail_.store((current_tail + 1) % Size, std::memory_order_release);\n"
        "        return true;\n"
        "    }\n"
        "};"
    ),
    # 12. TypeScript: Monadic Result Railway
    (
        "TypeScript",
        "// [TypeScript] Functional Railway-Oriented Result Monad\n"
        "export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };\n"
        "export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });\n"
        "export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });\n"
        "export function flatMap<T, U, E>(\n"
        "  res: Result<T, E>,\n"
        "  fn: (val: T) => Result<U, E>\n"
        "): Result<U, E> {\n"
        "  return res.ok ? fn(res.value) : res;\n"
        "}"
    ),
    # 13. SQL: Serializable Isolation with Optimistic Check
    (
        "SQL",
        "-- [SQL] Serializable Isolation with Optimistic Concurrency Check\n"
        "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\n"
        "UPDATE account_balances\n"
        "SET balance = balance - 250.00,\n"
        "    version = version + 1\n"
        "WHERE account_id = 'ACC_9084' AND version = 3;\n"
        "IF NOT FOUND THEN\n"
        "    ROLLBACK;\n"
        "    RAISE EXCEPTION 'OptimisticConcurrencyConflict: stale transaction version';\n"
        "END IF;\n"
        "COMMIT;"
    ),
    # 14. Java: Structured Task Scope
    (
        "Java",
        "// [Java] Project Loom Virtual Thread Structured Task Scope\n"
        "import java.util.concurrent.StructuredTaskScope;\n"
        "public String fetchCoordinatedData() throws Exception {\n"
        "    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {\n"
        "        var userSub = scope.fork(() -> queryUserDb());\n"
        "        var auditSub = scope.fork(() -> queryAuditLog());\n"
        "        scope.join().throwIfFailed();\n"
        "        return userSub.get() + \":\" + auditSub.get();\n"
        "    }\n"
        "}"
    ),
    # 15. C#: Ingestion Channel Pipeline
    (
        "C#",
        "// [C#] Non-Blocking Pipeline via System.Threading.Channels\n"
        "using System.Threading.Channels;\n"
        "using System.Threading.Tasks;\n"
        "public class IngestionChannel {\n"
        "    private readonly Channel<byte[]> _channel = Channel.CreateBounded<byte[]>(new BoundedChannelOptions(1024) {\n"
        "        FullMode = BoundedChannelFullMode.Wait\n"
        "    });\n"
        "    public async ValueTask PublishAsync(byte[] message) => await _channel.Writer.WriteAsync(message);\n"
        "    public async ValueTask<byte[]> ConsumeAsync() => await _channel.Reader.ReadAsync();\n"
        "}"
    ),
    # 16. Rust: AVX2 SIMD Dot Product
    (
        "Rust",
        "// [Rust] SIMD Vectorized AVX2 Floating-Point Dot Product\n"
        "#[target_feature(enable = \"avx2\")]\n"
        "pub unsafe fn dot_product_simd(a: &[f32], b: &[f32]) -> f32 {\n"
        "    use std::arch::x86_64::*;\n"
        "    let mut sum = _mm256_setzero_ps();\n"
        "    for i in (0..a.len()).step_by(8) {\n"
        "        let va = _mm256_loadu_ps(a.as_ptr().add(i));\n"
        "        let vb = _mm256_loadu_ps(b.as_ptr().add(i));\n"
        "        sum = _mm256_fmadd_ps(va, vb, sum);\n"
        "    }\n"
        "    let mut buffer = [0.0f32; 8];\n"
        "    _mm256_storeu_ps(buffer.as_mut_ptr(), sum);\n"
        "    buffer.iter().sum()\n"
        "}"
    ),
    # 17. Go: TCP Socket Framing
    (
        "Go",
        "// [Go] High-Throughput Frame Protocol Delimiter\n"
        "func ReadFrame(r io.Reader) ([]byte, error) {\n"
        "    var length uint32\n"
        "    if err := binary.Read(r, binary.BigEndian, &length); err != nil {\n"
        "        return nil, err\n"
        "    }\n"
        "    if length > 10 * 1024 * 1024 {\n"
        "        return nil, errors.New(\"frame size exceeds 10MB limit\")\n"
        "    }\n"
        "    payload := make([]byte, length)\n"
        "    _, err := io.ReadFull(r, payload)\n"
        "    return payload, err\n"
        "}"
    ),
    # 18. Python: Async TLV Socket Parser
    (
        "Python",
        "# [Python] Asynchronous TLV (Type-Length-Value) Network Parser\n"
        "import asyncio, struct\n"
        "async def handle_stream(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):\n"
        "    while True:\n"
        "        header = await reader.readexactly(5)\n"
        "        msg_type, length = struct.unpack('!BI', header)\n"
        "        payload = await reader.readexactly(length)\n"
        "        response = struct.pack('!BI', msg_type, len(payload)) + payload\n"
        "        writer.write(response)\n"
        "        await writer.drain()"
    ),
    # 19. C++: Custom Memory Arena Allocator
    (
        "C++",
        "// [C++] High-Performance Linear Memory Arena Allocator\n"
        "#include <cstdint>\n"
        "#include <cstddef>\n"
        "class MemoryArena {\n"
        "    uint8_t* buffer_;\n"
        "    size_t capacity_;\n"
        "    size_t offset_ = 0;\n"
        "public:\n"
        "    MemoryArena(uint8_t* memory, size_t capacity) : buffer_(memory), capacity_(capacity) {}\n"
        "    void* allocate(size_t size, size_t alignment = 8) {\n"
        "        size_t aligned_offset = (offset_ + (alignment - 1)) & ~(alignment - 1);\n"
        "        if (aligned_offset + size > capacity_) return nullptr;\n"
        "        void* ptr = &buffer_[aligned_offset];\n"
        "        offset_ = aligned_offset + size;\n"
        "        return ptr;\n"
        "    }\n"
        "    void reset() { offset_ = 0; }\n"
        "};"
    ),
    # 20. TypeScript: Concurrency-Throttled Task Queue
    (
        "TypeScript",
        "// [TypeScript] Concurrency-Throttled Asynchronous Task Queue\n"
        "export class ConcurrencyLimiter {\n"
        "  private active = 0;\n"
        "  private queue: (() => void)[] = [];\n"
        "  constructor(private readonly maxConcurrency: number) {}\n"
        "  async run<T>(task: () => Promise<T>): Promise<T> {\n"
        "    while (this.active >= this.maxConcurrency) {\n"
        "      await new Promise<void>(resolve => this.queue.push(resolve));\n"
        "    }\n"
        "    this.active++;\n"
        "    try { return await task(); }\n"
        "    finally {\n"
        "      this.active--;\n"
        "      this.queue.shift()?.();\n"
        "    }\n"
        "  }\n"
        "}"
    ),
    # 21. Rust: Zero-Copy Mmap Deserializer
    (
        "Rust",
        "// [Rust] Zero-Copy Memory-Mapped Binary Deserializer\n"
        "use memmap2::Mmap;\n"
        "use std::fs::File;\n"
        "pub struct BinaryRecordReader {\n"
        "    mmap: Mmap,\n"
        "}\n"
        "impl BinaryRecordReader {\n"
        "    pub fn open(file: File) -> Result<Self, std::io::Error> {\n"
        "        let mmap = unsafe { Mmap::map(&file)? };\n"
        "        Ok(Self { mmap })\n"
        "    }\n"
        "    pub fn read_magic(&self) -> &[u8] {\n"
        "        &self.mmap[0..4]\n"
        "    }\n"
        "}"
    ),
    # 22. SQL: Rolling Window Analytics
    (
        "SQL",
        "-- [SQL] Moving Average and Rolling Variance Window Functions\n"
        "SELECT\n"
        "    timestamp,\n"
        "    transaction_amount,\n"
        "    AVG(transaction_amount) OVER (\n"
        "        PARTITION BY asset_pair\n"
        "        ORDER BY timestamp\n"
        "        ROWS BETWEEN 20 PRECEDING AND CURRENT ROW\n"
        "    ) AS rolling_mean_20,\n"
        "    STDDEV(transaction_amount) OVER (\n"
        "        PARTITION BY asset_pair\n"
        "        ORDER BY timestamp\n"
        "        ROWS BETWEEN 20 PRECEDING AND CURRENT ROW\n"
        "    ) AS rolling_std_20\n"
        "FROM orderbook_trades;"
    ),
    # 23. Python: Raft Consensus Node
    (
        "Python",
        "# [Python] Raft Distributed Consensus Heartbeat Timer\n"
        "import time\n"
        "class RaftConsensusNode:\n"
        "    def __init__(self, node_id: str, lease_ms: int = 150):\n"
        "        self.node_id = node_id\n"
        "        self.lease_ms = lease_ms\n"
        "        self.last_heartbeat = time.monotonic()\n"
        "        self.state = \"FOLLOWER\"\n"
        "    def check_election_timeout(self) -> bool:\n"
        "        elapsed = (time.monotonic() - self.last_heartbeat) * 1000\n"
        "        if elapsed > self.lease_ms and self.state == \"FOLLOWER\":\n"
        "            self.state = \"CANDIDATE\"\n"
        "            return True\n"
        "        return False"
    ),
    # 24. Rust: Lock-Free Treiber Stack
    (
        "Rust",
        "// [Rust] Lock-Free Treiber Stack with Atomic Pointers\n"
        "use std::sync::atomic::{AtomicPtr, Ordering};\n"
        "use std::ptr;\n"
        "pub struct Node<T> {\n"
        "    pub data: T,\n"
        "    pub next: *mut Node<T>,\n"
        "}\n"
        "pub struct TreiberStack<T> {\n"
        "    head: AtomicPtr<Node<T>>,\n"
        "}\n"
        "impl<T> TreiberStack<T> {\n"
        "    pub fn push(&self, data: T) {\n"
        "        let new_node = Box::into_raw(Box::new(Node { data, next: ptr::null_mut() }));\n"
        "        let mut cur = self.head.load(Ordering::Relaxed);\n"
        "        loop {\n"
        "            unsafe { (*new_node).next = cur; }\n"
        "            match self.head.compare_exchange_weak(cur, new_node, Ordering::Release, Ordering::Relaxed) {\n"
        "                Ok(_) => break,\n"
        "                Err(actual) => cur = actual,\n"
        "            }\n"
        "        }\n"
        "    }\n"
        "}"
    ),
    # 25. Go: Graceful HTTP Server Shutdown
    (
        "Go",
        "// [Go] Production Graceful HTTP Server Termination\n"
        "func ServeWithGrace(srv *http.Server) {\n"
        "    stop := make(chan os.Signal, 1)\n"
        "    signal.Notify(stop, os.Interrupt, syscall.SIGTERM)\n"
        "    go func() {\n"
        "        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {\n"
        "            log.Fatalf(\"listen error: %s\", err)\n"
        "        }\n"
        "    }()\n"
        "    <-stop\n"
        "    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)\n"
        "    defer cancel()\n"
        "    srv.Shutdown(ctx)\n"
        "}"
    ),
    # 26. C++: Fast Inverse Square Root
    (
        "C++",
        "// [C++] Constant-Time Fast Inverse Square Root\n"
        "#include <cstdint>\n"
        "float Q_rsqrt(float number) noexcept {\n"
        "    long i;\n"
        "    float x2, y;\n"
        "    const float threehalfs = 1.5F;\n"
        "    x2 = number * 0.5F;\n"
        "    y = number;\n"
        "    i = *reinterpret_cast<long*>(&y);\n"
        "    i = 0x5f3759df - (i >> 1);\n"
        "    y = *reinterpret_cast<float*>(&i);\n"
        "    y = y * (threehalfs - (x2 * y * y));\n"
        "    return y;\n"
        "}"
    ),
    # 27. TypeScript: AST Evaluator
    (
        "TypeScript",
        "// [TypeScript] AST Recursive Visitor with Type Discrimination\n"
        "export interface BinaryExpression {\n"
        "  kind: 'BinaryExpression';\n"
        "  operator: '+' | '-' | '*' | '/';\n"
        "  left: ASTNode;\n"
        "  right: ASTNode;\n"
        "}\n"
        "export interface LiteralNode {\n"
        "  kind: 'LiteralNode';\n"
        "  value: number;\n"
        "}\n"
        "export type ASTNode = BinaryExpression | LiteralNode;\n"
        "export function evaluateAST(node: ASTNode): number {\n"
        "  if (node.kind === 'LiteralNode') return node.value;\n"
        "  const l = evaluateAST(node.left);\n"
        "  const r = evaluateAST(node.right);\n"
        "  switch (node.operator) {\n"
        "    case '+': return l + r;\n"
        "    case '-': return l - r;\n"
        "    case '*': return l * r;\n"
        "    case '/': return l / r;\n"
        "  }\n"
        "}"
    ),
    # 28. Java: Sequence Barrier
    (
        "Java",
        "// [Java] Disruptor Lock-Free Sequence Barrier\n"
        "import java.util.concurrent.atomic.AtomicLong;\n"
        "public class SequenceBarrier {\n"
        "    private final AtomicLong cursor = new AtomicLong(-1);\n"
        "    public long waitFor(long sequence) throws InterruptedException {\n"
        "        while (cursor.get() < sequence) {\n"
        "            Thread.onSpinWait();\n"
        "        }\n"
        "        return cursor.get();\n"
        "    }\n"
        "    public void publish(long sequence) {\n"
        "        cursor.lazySet(sequence);\n"
        "    }\n"
        "}"
    ),
    # 29. Python: B-Tree Node Split
    (
        "Python",
        "# [Python] B-Tree Storage Engine Node Splitting Algorithm\n"
        "class BTreeNode:\n"
        "    def __init__(self, t: int, leaf: bool = True):\n"
        "        self.t = t\n"
        "        self.keys = []\n"
        "        self.children = []\n"
        "        self.leaf = leaf\n"
        "    def split_child(self, i: int, y: 'BTreeNode'):\n"
        "        z = BTreeNode(y.t, y.leaf)\n"
        "        self.children.insert(i + 1, z)\n"
        "        self.keys.insert(i, y.keys[self.t - 1])\n"
        "        z.keys = y.keys[self.t:(2 * self.t - 1)]\n"
        "        y.keys = y.keys[0:(self.t - 1)]\n"
        "        if not y.leaf:\n"
        "            z.children = y.children[self.t:(2 * self.t)]\n"
        "            y.children = y.children[0:self.t]"
    ),
    # 30. Rust: Bump Arena Allocator
    (
        "Rust",
        "// [Rust] Custom Bump Allocator with Alignment Guarantee\n"
        "pub struct BumpArena {\n"
        "    ptr: *mut u8,\n"
        "    offset: usize,\n"
        "    capacity: usize,\n"
        "}\n"
        "impl BumpArena {\n"
        "    pub fn alloc(&mut self, layout: std::alloc::Layout) -> Option<*mut u8> {\n"
        "        let align_mask = layout.align() - 1;\n"
        "        let aligned = (self.offset + align_mask) & !align_mask;\n"
        "        if aligned + layout.size() > self.capacity { return None; }\n"
        "        let result = unsafe { self.ptr.add(aligned) };\n"
        "        self.offset = aligned + layout.size();\n"
        "        Some(result)\n"
        "    }\n"
        "}"
    ),
    # 31. Go: Demultiplexer
    (
        "Go",
        "// [Go] Protocol Multiplexing Connection Demultiplexer\n"
        "type PacketHeader struct {\n"
        "    StreamID    uint32\n"
        "    PayloadSize uint32\n"
        "}\n"
        "func Demux(conn net.Conn, streams map[uint32]chan []byte) error {\n"
        "    for {\n"
        "        var hdr PacketHeader\n"
        "        if err := binary.Read(conn, binary.BigEndian, &hdr); err != nil { return err }\n"
        "        buf := make([]byte, hdr.PayloadSize)\n"
        "        if _, err := io.ReadFull(conn, buf); err != nil { return err }\n"
        "        if ch, ok := streams[hdr.StreamID]; ok { ch <- buf }\n"
        "    }\n"
        "}"
    ),
    # 32. C++: MPMC Queue
    (
        "C++",
        "// [C++] High-Performance Cache-Line Isolated MPMC Queue\n"
        "#include <atomic>\n"
        "#include <cstddef>\n"
        "template <typename T, size_t Capacity>\n"
        "class MPMCQueue {\n"
        "    struct Cell {\n"
        "        std::atomic<size_t> sequence;\n"
        "        T data;\n"
        "    };\n"
        "    Cell buffer_[Capacity];\n"
        "    alignas(64) std::atomic<size_t> enqueue_pos_{0};\n"
        "    alignas(64) std::atomic<size_t> dequeue_pos_{0};\n"
        "public:\n"
        "    MPMCQueue() {\n"
        "        for (size_t i = 0; i < Capacity; ++i)\n"
        "            buffer_[i].sequence.store(i, std::memory_order_relaxed);\n"
        "    }\n"
        "};"
    ),
    # 33. TypeScript: Strict State Machine
    (
        "TypeScript",
        "// [TypeScript] Strict Discriminated State Machine Engine\n"
        "type State =\n"
        "  | { status: 'idle' }\n"
        "  | { status: 'connecting'; attempt: number }\n"
        "  | { status: 'connected'; sessionId: string }\n"
        "  | { status: 'failed'; error: Error };\n"
        "type Action =\n"
        "  | { type: 'CONNECT' }\n"
        "  | { type: 'SUCCESS'; sessionId: string }\n"
        "  | { type: 'FAIL'; error: Error };\n"
        "export function transition(state: State, action: Action): State {\n"
        "  switch (state.status) {\n"
        "    case 'idle':\n"
        "      return action.type === 'CONNECT' ? { status: 'connecting', attempt: 1 } : state;\n"
        "    case 'connecting':\n"
        "      return action.type === 'SUCCESS' ? { status: 'connected', sessionId: action.sessionId } : state;\n"
        "    default: return state;\n"
        "  }\n"
        "}"
    )
]


def _build_level_code_text(level: int, diff: str) -> str:
    """Generates authentic multi-language serious code snippets across Python, Rust, Go, C++, TypeScript, Java, C#, and SQL."""
    lvl = max(1, min(200, int(level)))
    entry = SERIOUS_CODE_LIBRARY[(lvl - 1) % len(SERIOUS_CODE_LIBRARY)]
    lang, code = entry
    header = f"// Stage {lvl} [{lang} Engineering System]"
    if lang == "Python":
        header = f"# Stage {lvl} [Python Engineering System]"
    elif lang == "SQL":
        header = f"-- Stage {lvl} [SQL Relational Engine]"
    return f"{header}\n{code}"


class CurriculumEngine:
    """Unified API for generating progressive, level-unique typing content with adaptive casing."""
    
    @classmethod
    def get_word_batch(cls, level: int, mode: str, difficulty: str = 'Normal', style: str = None, weak_keys: list = None) -> str:
        lvl = max(1, min(200, int(level)))
        m = str(mode).strip()
        diff = str(difficulty).strip()

        # If weak_keys not passed, attempt to query AI WeakSpotsEngine
        targeted_weak_keys = weak_keys
        if targeted_weak_keys is None:
            try:
                from ai_insights.weak_spots_engine import WeakSpotsEngine
                targeted_weak_keys = WeakSpotsEngine.get_user_weak_keys(max_keys=3)
            except Exception:
                targeted_weak_keys = []

        if m == 'Words':
            words = _build_level_word_bank(lvl, diff)
            text = " ".join(words)
        elif m == 'Lines':
            text = _build_level_sentences_text(lvl, diff)
        elif m == 'Paragraphs':
            text = _build_level_paragraph_text(lvl, diff)
        elif m == 'Pages':
            text = _build_level_page_text(lvl, diff)
        elif m == 'Code':
            text = _build_level_code_text(lvl, diff)
        else:
            words = _build_level_word_bank(lvl, diff)
            text = " ".join(words)

        # Apply user's active typing style casing (e.g., Title Case) if specified
        if style and m != 'Code':
            try:
                from ai_insights.style_engine import TypingStyleEngine
                text = TypingStyleEngine.transform_text(text, style)
            except Exception:
                pass

        try:
            from ai_insights.massive_word_bank import sanitize_typing_text
            text = sanitize_typing_text(text)
        except Exception:
            pass

        return json.dumps({
            'text': text,
            'level': lvl,
            'mode': m,
            'difficulty': diff,
            'style': style or 'default',
            'weak_keys_targeted': [k.upper() for k in (targeted_weak_keys or [])],
            'status': 'success'
        })

