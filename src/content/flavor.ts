/**
 * "Flavor" layered on top of the lessons: real-world openers, client requests for challenges, and
 * pick-your-theme options. Kept separate from the lesson files so the teaching content and its tests stay put.
 *
 * Real-world facts here were checked (see docs/content-authoring.md → "Real-world openers"). Clients are fictional.
 * Rules: no brand mascots or characters, no slang cosplay, no claims we can't back up. Short. Second person.
 */

export type Hook = { headline: string; body: string };
export type Client = { name: string; who: string; message: string };
export type Theme = { label: string; idea: string };
export type Flavor = {
  hook: Hook;
  /** keyed by challenge block id */
  clients?: Record<string, Client>;
  themes?: Record<string, Theme[]>;
};

export const FLAVOR: Record<string, Flavor> = {
  "what-is-3d-printing": {
    hook: {
      headline: "A rocket, a running shoe and a hearing aid walk into a printer…",
      body: "In 2023 a rocket made mostly of 3D-printed parts reached space. Some running shoes have 3D-printed soles. Most custom hearing-aid shells are printed to fit one person's ear. Same idea every time: add material, one layer at a time.",
    },
    clients: { prove: { name: "Priya", who: "runs a board-game café", message: "Our customers keep asking how the 3D-printed game pieces are made. Can you show the layers for something in your room so I can put it on a poster?" } },
    themes: { prove: [{ label: "Gaming", idea: "A controller, a headset stand or a game piece" }, { label: "Sports", idea: "A water bottle, a trophy or a cleat" }, { label: "Food", idea: "A mug, a bowl or a fancy cupcake" }] },
  },
  "print-detective": {
    hook: { headline: "Every failed print is a crime scene.", body: "Stringy webs, a melted-looking bottom, a whole layer that slid sideways. The printer won't tell you what happened — but the plastic leaves clues. Detectives read clues. So will you." },
    clients: { prove: { name: "Detective Ruiz", who: "Print Crimes Unit (totally real, very serious)", message: "We've got a new case. Nobody's talking. Examine the evidence and file your report by end of class." } },
  },
  "navigating-tinkercad": {
    hook: { headline: "Every 3D world you've ever played in was built like this.", body: "Game levels, animated movies, the car in a racing game — someone built them by orbiting, panning and zooming a camera around shapes. That's today. Same moves, your workspace." },
    clients: { prove: { name: "Marco", who: "QA tester at an indie game studio", message: "A player says some objects in our level are floating and some are stuck in the floor. Send me three screenshots that prove which is which." } },
  },
  "moving-objects": {
    hook: { headline: "If you've placed blocks in a sandbox game, you already know X, Y and Z.", body: "Left–right, forward–back, up–down. Games hide the numbers. CAD shows them — and if a part floats even 1 mm above the floor, the printer starts it in mid-air." },
    clients: { prove: { name: "Jae", who: "level designer for a platformer game", message: "I need a prototype of a floating staircase for level 3. Exact heights — the jump timing depends on it!" } },
  },
  "scaling-objects": {
    hook: { headline: "Same file. Keychain size or life-size.", body: "Prop makers for movies and cosplay design a model once, then scale it — tiny to test, huge for the real thing. But double the size and the plastic doesn't just double. Today you find out why." },
    clients: { prove: { name: "Sasha", who: "makes collectible mini figures", message: "Fans want my figure in two sizes: regular and a mini for keychains. Same look, half the size. Can you build both?" } },
    themes: { prove: [{ label: "Robot", idea: "A boxy robot with antenna and arms" }, { label: "Animal", idea: "A cat, a frog or a penguin" }, { label: "Mech", idea: "A walking machine or a tiny spaceship" }] },
  },
  "exact-dimensions": {
    hook: { headline: "Your phone case was designed to the tenth of a millimetre.", body: "Off by 1 mm and the camera hole covers the lens or the buttons don't line up. Real products are built from typed numbers, not dragging until it looks right." },
    clients: { prove: { name: "Tabletop Toys Co.", who: "a game company", message: "Attached is our spec sheet. Every piece has to match exactly or the box won't close. No eyeballing, please!" } },
  },
  "rotating-objects": {
    hook: { headline: "Every skatepark ramp is a tilted rectangle.", body: "Ramps, road signs, phone stands, the angle of your laptop screen — all ordinary shapes turned to the right angle. Pick the axis, then the angle." },
    clients: { prove: { name: "Coach Dana", who: "runs a model-train club", message: "Our tiny town needs a ramp and a railroad-crossing sign. Angles matter — the little cars roll off if it's wrong." } },
  },
  workplanes: {
    hook: { headline: "How do you stick a logo on the side of a sneaker?", body: "Designers don't rotate every tiny detail to match a curved or slanted surface. They move the floor — the workplane — onto that surface and build right on it." },
    clients: { prove: { name: "Amara", who: "architect designing an eco-house", message: "Our client wants a model with a solar panel on the roof, a window and a door. Everything has to sit flat on its surface — no floating panels." } },
  },
  "workspace-rescue": {
    hook: { headline: "Somebody left their project a total mess. Again.", body: "Group projects, shared game files, a teammate's unsaved chaos — every pro has had to clean up someone else's work. No tutorial. You know enough now." },
    clients: { boss: { name: "Leo", who: "your teammate (sorry!)", message: "I may have… broken the shared file. Everything's floating and turned weird. The presentation is tomorrow. Please help." } },
  },
  grouping: {
    hook: { headline: "Look closely: it's just shapes.", body: "A game controller has dozens of parts. A rocket is a cylinder, a cone and some fins. Designers see the simple shapes hiding inside complicated things — then group them into one." },
    clients: { prove: { name: "Ms. Okafor", who: "your class (yes, really)", message: "Each of you gets to design a desk buddy for someone in class. Make it personal — they'll keep it." } },
    themes: { prove: [{ label: "Desk lamp", idea: "A tiny lamp with a base, arm and shade" }, { label: "Trophy", idea: "A trophy for a game, sport or inside joke" }, { label: "Creature", idea: "A robot, monster or pet that guards their pencils" }] },
  },
  holes: {
    hook: { headline: "Most of your phone case is… nothing.", body: "The camera cutout, the charging port, the button gaps — someone designed those empty spaces on purpose. Cups, keychains and pencil holders too. In CAD, you design the nothing." },
    clients: { prove: { name: "Ben", who: "makes cable clips for gamers' desks", message: "My new clip needs a slot for a USB cable to pass through. 12 × 6 mm, dead centre. Can you cut it?" } },
  },
  align: {
    hook: { headline: "Close enough isn't centred.", body: "Every icon on your phone's home screen snaps to an invisible grid. A wheel with its hole 0.5 mm off wobbles. Your eyes can't see 0.5 mm. The Align tool can." },
    clients: { prove: { name: "Captain Mae", who: "runs a lighthouse museum gift shop", message: "Visitors want a lighthouse model with a light hole down the middle. If it's off-centre, the LED won't fit. Please make it perfect!" } },
  },
  duplicate: {
    hook: { headline: "Why don't tables wobble? Copies.", body: "Chair legs, keyboard keys, game pieces — when parts have to match, designers make one perfect part and copy it. A copy is always exactly the same." },
    clients: { prove: { name: "Rosa", who: "builds dioramas for a mini-figure shop", message: "I need a tiny stool for a figurine display. Three legs, all exactly the same, or the figure falls over." } },
  },
  "repeat-duplicate": {
    hook: { headline: "Your keyboard is a perfect pattern.", body: "On a standard keyboard, keys sit 19.05 mm apart, centre to centre — every single one. Speaker grilles, combs and vents work the same way: make one, then repeat the move." },
    clients: { prove: { name: "Kai", who: "builds custom gaming PCs", message: "My new case needs a vent cover. Slots have to be evenly spaced or the airflow is uneven and it looks bad. Plus something cool on it." } },
  },
  mirror: {
    hook: { headline: "Build half. Get the whole thing.", body: "Game controllers, drones, cars, glasses frames — most are symmetric. Designers build one side and mirror it, so both halves match to the millimetre." },
    clients: { prove: { name: "Zoe", who: "sells keychains at a craft fair", message: "My best seller is a symmetric key tag. I need a new design: 50 mm wide, perfectly even, with a ring hole in the middle." } },
    themes: { prove: [{ label: "Wings", idea: "A tag shaped like wings or a butterfly" }, { label: "Shield", idea: "A crest or team shield" }, { label: "Bot face", idea: "A robot face with two matching eyes" }] },
  },
  text: {
    hook: { headline: "Your gamer tag, in plastic.", body: "Name tags, team logos, labels on the side of a controller stand — text is everywhere on printed things. But letters thinner than about 1 mm turn into blobs. Today: text that actually prints." },
    clients: { prove: { name: "Mr. Alvarez", who: "runs the school garden club", message: "Our labels keep fading in the sun. Can you design a plant marker with the name pressed into it so it lasts?" } },
  },
  "boss-nametag": {
    hook: { headline: "Your name, on your backpack, by Friday.", body: "Esports teams, clubs and bands hand out custom keychains all the time. A factory makes thousands from one file — so the file has to match the spec exactly. Today you're the designer." },
    clients: { boss: { name: "Coach Rivera", who: "runs the school esports team", message: "The team needs gamer-tag keychains before the tournament. They hang on a display board, so every tag has to be exactly 50 mm. Make yours the one we copy." } },
    themes: { boss: [{ label: "Gamer tag", idea: "Your gamer tag with a controller or star icon" }, { label: "Team tag", idea: "Your name plus your team or club" }, { label: "Locker tag", idea: "Your initials and locker number" }] },
  },
  ruler: {
    hook: { headline: "'About here' isn't a measurement.", body: "When you mount a TV, the holes have to be exactly where the bracket expects. Screws, buttons and cutouts in real products are placed at exact distances from an edge." },
    clients: { prove: { name: "Nia", who: "designs phone accessories", message: "I'm adding three bits to our fit object for a new product test. Exact distances only — the factory won't guess." } },
  },
  "measuring-real-objects": {
    hook: { headline: "Measure twice. Print once.", body: "Want a stand for your controller, a holder for your earbuds, a mount for your bike light? It's only as good as your measurements. A perfect CAD file built on a bad number is useless." },
    clients: { prove: { name: "Agent Blake", who: "Secret Model Agency", message: "Your mission: describe a mystery object so well that someone who never saw it could build it. This message will not self-destruct." } },
  },
  calipers: {
    hook: { headline: "0.5 mm is the difference between 'fits' and 'doesn't'.", body: "Sneaker customizers, bike mechanics and the people who make spare parts all use calipers. They read to a hundredth of a millimetre — way past what your eyes can do." },
    clients: { prove: { name: "Dr. Shah", who: "museum conservator", message: "We need a replacement part for an old object in our collection. I can't ship it to you — just your measurements. They must be precise." } },
  },
  tolerances: {
    hook: { headline: "Why does an earbud case click shut instead of rattling?", body: "Because someone chose the exact gap. LEGO bricks made today still snap onto bricks from 1958 — that's tolerance done right. A 10 mm peg won't go into a 10 mm printed hole. Today you find out how much gap you need." },
    clients: { prove: { name: "Ms. Kim", who: "art teacher with a pen problem", message: "Pens keep rolling off my desk. Before you design a holder, make a fit gauge so we know which hole size grips a pen just right." } },
  },
  "make-it-fit": {
    hook: { headline: "Don't print the whole thing to test one number.", body: "Engineers on race teams test the one part that matters before printing the full design. A 10-minute test ring beats a 3-hour print that doesn't fit." },
    clients: { prove: { name: "You", who: "your own client this time", message: "Pick something you actually use — a marker, a bolt, a charging cable, a game piece — and design a part that fits it perfectly." } },
    themes: { prove: [{ label: "Desk", idea: "A cable clip, marker cap or charger holder" }, { label: "Gear", idea: "A bike-light mount, headphone hook or controller stand" }, { label: "Build", idea: "A building-brick adapter or a game-piece holder" }] },
  },
  layers: {
    hook: { headline: "Your printer can't print a cube.", body: "It prints about 100 thin pancakes of plastic stacked up. Watch any time-lapse print video: the object grows from the bottom, one slice at a time." },
    clients: { prove: { name: "Jordan", who: "runs the school esports team", message: "We want two-colour name tags for every player. The colour swap has to happen at an exact layer. Can you plan it?" } },
    themes: { prove: [{ label: "Gamer tag", idea: "Your gamer tag or team name" }, { label: "Pet", idea: "A collar tag with a paw print" }, { label: "Locker", idea: "Your name plus an icon you like" }] },
  },
  orientation: {
    hook: { headline: "One hook. Three ways to print it. Only one survives your backpack.", body: "Printed parts are like wood: strong along the grain, weak across it. Engineers decide which way a part lies on the plate before they hit print." },
    clients: { prove: { name: "Riley", who: "streams every night", message: "My headphones are always on the floor. I need a hanger that clamps under my desk — and it can't snap when I yank them off mid-game." } },
  },
  strength: {
    hook: { headline: "Two identical files. Which one holds more?", body: "Race teams and drone builders test printed parts until they break — on purpose. That's how they learn where the weak spot is before it fails for real." },
    clients: { prove: { name: "Marcus", who: "makes gear for climbers", message: "This hook has to print standing up — it won't fit the other way. Make it survive more weight. I'll trust your test numbers." } },
  },
  overhangs: {
    hook: { headline: "Why did your figure's arms droop like wet noodles?", body: "A printer can't draw in mid-air. Each layer needs something underneath. Lean out too far and the hot plastic sags. The magic number is about 45°." },
    clients: { prove: { name: "Ava", who: "decorating her room", message: "I want a Y-shaped coat peg — but my printer has no supports turned on. It has to print clean standing up." } },
  },
  bridging: {
    hook: { headline: "A printer can draw in mid-air… for a little while.", body: "Hold a string at both ends and it barely sags. Plastic does the same: a flat roof held up at both ends can print across empty space — if the gap isn't too long." },
    clients: { prove: { name: "Omar", who: "drowning in charging cables", message: "My desk is a cable spaghetti disaster. I need a block with a tunnel cables slide through — and it has to print with no supports." } },
  },
  supports: {
    hook: { headline: "Supports are like training wheels you snap off.", body: "They let you print ledges on air, but they waste plastic and leave scars. Good designers sneak in angles so the part holds itself up." },
    clients: { prove: { name: "Ms. Patel", who: "runs the front office", message: "I need a pencil cup with a ledge for sticky notes. Last one came out with ugly support scars. Can you design it so it doesn't need any?" } },
  },
  "material-efficiency": {
    hook: { headline: "Bird bones are mostly empty. That's genius.", body: "Many bird bones are hollow inside, with thin supports — strong and light. Printers use the same trick: walls on the outside, a pattern inside. Solid is usually a waste." },
    clients: { prove: { name: "Grace", who: "sells plants at the farmers market", message: "I want to sell printed planters, but the solid ones cost too much plastic to make. Slim it down without making it flimsy?" } },
  },
  "print-failures": {
    hook: { headline: "Welcome to the fail gallery.", body: "Spaghetti monsters. Stringy cobwebs. Layers that slid sideways. Every maker has a drawer of fails. Pros don't avoid failure — they read it." },
    clients: { prove: { name: "Detective Ruiz", who: "Print Crimes Unit, again", message: "Another failed print just came in. No witnesses. Diagnose it and tell me how to stop it happening again." } },
  },
  "cad-er": {
    hook: { headline: "Code blue: the phone stand is crashing.", body: "Five symptoms, one patient. Real product teams do this all the time — a design comes back broken and someone has to find out why and fix it." },
    clients: { prove: { name: "Dr. Chen", who: "chief of CAD surgery", message: "The patient is stable but not happy. Fix all five symptoms and write up what you did. Scrub in." } },
  },
  "product-design": {
    hook: { headline: "The famous peeler that started with one person's problem.", body: "OXO's chunky Good Grips handles began when the founder saw his wife, who had arthritis, struggling to hold a regular peeler. Great products start with someone's frustration — not a cool shape." },
    clients: { prove: { name: "Coach Lee", who: "middle-school track coach", message: "My whistle tangles with my clipboard every single practice and ends up in the dirt. Please help. My whistle is begging you." } },
  },
  "interviewing-a-user": {
    hook: { headline: "People don't always need what they ask for.", body: "Designers who make apps and games watch real people use them — and constantly find surprises. Five minutes of listening can change the whole problem." },
  },
  "writing-constraints": {
    hook: { headline: "Houston, we have a constraint.", body: "On Apollo 13, engineers had to fit a square air filter into a round hole using only what was on the spacecraft. Clear limits made a clear solution. 'Make it small' isn't a limit. '40 mm wide' is." },
  },
  prototype: {
    hook: { headline: "5,127 prototypes.", body: "James Dyson built 5,127 prototypes of his bagless vacuum before one worked well enough. Each one answered one question. Yours should take minutes, not hours." },
  },
  testing: {
    hook: { headline: "'It works' isn't a test result.", body: "Phone makers drop phones over and over and count what breaks. Game studios run playtests and write everything down. A test is only useful if you record what happened." },
  },
  iteration: {
    hook: { headline: "Every game gets a patch.", body: "v1.0 ships, players find problems, v1.1 fixes them. Nobody's first version is the last. Each change should come from something you saw go wrong." },
  },
  "final-capstone": {
    hook: { headline: "This one's for real.", body: "Volunteers around the world 3D-print prosthetic hands for kids, sized to each child. Real person, real problem, printed solution. That's your capstone." },
  },
  "maker-showcase": {
    hook: { headline: "The object is only half the story.", body: "When inventors pitch on TV or launch a crowdfunding video, they don't just show the product — they tell what failed and why version 2 is better. That's what people remember." },
  },
  "mini-design-sprint": {
    hook: { headline: "Game jams build a whole game in 48 hours.", body: "Short deadlines force fast decisions: pick a problem, test the riskiest part, fix it, ship it. One week, one object that works." },
    themes: { prove: [{ label: "Your desk", idea: "Something that fixes a desk or locker annoyance" }, { label: "Your hobby", idea: "Gear for a sport, instrument or game you play" }, { label: "Someone else", idea: "A fix for a friend, family member or teacher" }] },
  },
};

export const flavorFor = (lessonId: string): Flavor | undefined => FLAVOR[lessonId];
