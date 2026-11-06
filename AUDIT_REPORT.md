Tolas, ich habe auf GitHub nach weiteren UI/UX-Skills für Codex, Claude Code und andere Coding-Agents gesucht.

Deine bisherige Sammlung ist bereits stark im visuellen Design. Was noch fehlt, sind spezialisierte Skills für Design Engineering, Accessibility, Animation, UX-Audits, Robustheit und Frontend-Performance.
 Die 12 besten Ergänzungen
Priorisiert für deine React-, Next.js- und Developer-Tools-Projekte.
Priorität	Skill und GitHub	Schwerpunkt
Must-have	web-design-guidelines	Über 100 Regeln für UX, Accessibility, Responsive Design und UI-Reviews
Must-have	emil-design-eng	Hochwertige Interaktionen, Animationen und UI-Details
Must-have	better-interface	Ganzheitlicher UI-Audit mit priorisierten Findings
Must-have	better-accessibility	WCAG 2.2, Keyboard-Navigation, Focus und Screenreader
Must-have	break-ui	UI mit extremen Daten, leeren Zuständen und langen Texten prüfen
Must-have	react-best-practices	Rendering, Bundle-Größe und React-/Next.js-Performance
Sehr gut	frontend-design	Individuelle Designs, Typografie und bewusst gewählte visuelle Identität
Sehr gut	better-typography	Schriftgrößen, Zeilenhöhen, Textfluss und Lesbarkeit
Sehr gut	better-layout	Layout, Spacing, responsive Strukturen und RTL
Sehr gut	review-animations	Animationen hinsichtlich Timing, Performance und UX prüfen
Optional	mobile-native	Mobile-Web-UX, Touch-Verhalten und native Anmutung
Optional	webapp-testing	Browserbasierte Prüfung und UI-Tests mit Playwright

Die Skills stammen insbesondere aus den offiziellen Sammlungen von Vercel und Anthropic sowie den Projekten von Emil Kowalski und Jakub Krehel.

GitHub+4

Weitere interessante Skill-Sammlungen









Emil Kowalski — Design Engineering

Meine erste Empfehlung. Enthält auch animate, animation-performance, find-animation-opportunities, prototype und apple-design. Besonders gut für Interfaces, die sich hochwertig anfühlen sollen.












Jakub Krehel — Interface Skills

Spezialisierte Regeln für Typografie, Farben, Layout, Accessibility und UX-Writing. Gut für konsistente, professionelle Produktoberflächen.












UX/UI Agent Skills

Größere Sammlung mit 19 Skills, darunter Design Tokens, Komponenten, UX-Writing, Dashboards, Prototyping und Performance. Vielseitig, aber mit Überschneidungen zu deiner Sammlung.

GitHub













Taste Skill Classics

Ergänzende Stilrichtungen wie high-end-visual-design, minimalist-ui und industrial-brutalist-ui. Praktisch, wenn du verschiedene Designrichtungen ausprobieren möchtest.

GitHub




Meine empfohlene Kombination für dich
Du hast bereits:
- ai-design-skills
- taste-skill / design-taste-frontend
- impeccable
- ui-ux-pro-max
- unslop
design-taste-frontend gehört bereits zu taste-skill und muss nicht separat doppelt installiert werden.

GitHub

Ich würde deine Sammlung so organisieren:
Aufgabe	Skills
Designkonzept	ui-ux-pro-max, frontend-design
Visuelle Qualität	design-taste-frontend, unslop
Design-Audit	impeccable, better-interface
UX und Accessibility	web-design-guidelines, better-accessibility
Animationen	emil-design-eng, review-animations
Layout und Typografie	better-layout, better-typography
React-Performance	react-best-practices
Robustheit und Qualität	break-ui, webapp-testing

Wichtig: Nicht jeden Skill gleichzeitig aktivieren. Je nach Aufgabe reichen normalerweise drei bis fünf spezialisierte Skills.
Installation
Die folgenden Befehle kannst du direkt in deinem Projektverzeichnis ausführen:

# UI/UX Quality
npx skills add vercel-labs/agent-skills --skill web-design-guidelines

# Design Engineering
npx skills add emilkowalski/skills --skill emil-design-eng
npx skills add emilkowalski/skills --skill review-animations
npx skills add emilkowalski/skills --skill break-ui

# Interface Quality
npx skills add jakubkrehel/skills --skill better-interface
npx skills add jakubkrehel/skills --skill better-accessibility
npx skills add jakubkrehel/skills --skill better-typography
npx skills add jakubkrehel/skills --skill better-layout

# Visual Design
npx skills add anthropics/skills --skill frontend-design



Die Befehle sind zur Installation gedacht; ich habe noch nichts in deinem Projekt installiert oder geändert.

Speziell für dein react-devtools-Projekt
Für amariwan/react-devtools würde ich vor allem fünf Anforderungen setzen:
1. Developer-Tool-UX: Hohe Informationsdichte, klare Hierarchie, schnelle Navigation und sinnvolle Shortcuts.
2. Designkonsistenz: Einheitliches Token-System für Farben, Abstände, Typografie, Komponenten und Zustände.
3. Interaktionsqualität: Präzise Hover-, Focus-, Selection- und Transition-Zustände.
4. Robustheit: Große Component Trees, lange Namen, leere Daten und komplexe Graphen sauber darstellen.
5. Visual QA: Jede relevante Ansicht anhand gerenderter Screenshots prüfen.
Meine persönliche Top-3-Ergänzung für dich wäre:

1. web-design-guidelines

Strenger Qualitätsmaßstab für bestehende UI



2. emil-design-eng

Professioneller Feinschliff für Interaktionen



3. better-accessibility

Bedienbarkeit, Tastatursteuerung und Barrierefreiheit



Damit ergänzt du deine bereits starken visuellen Skills um die Eigenschaften, die ein Developer-Tool auf professionellem Niveau ausmachen: Präzision, Geschwindigkeit, Zugänglichkeit und ausgereifte Interaktionen.
