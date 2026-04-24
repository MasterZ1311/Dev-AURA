# Aura - Productivity Ecosystem

![Aura Banner](https://via.placeholder.com/1200x300?text=Aura+-+Clarity+for+your+work,+peace+for+your+mind)

Aura is a comprehensive, modern productivity ecosystem designed to bring clarity to your work and peace to your mind. Built with a mobile-first, responsive design, it features a glassmorphism aesthetic and dynamic theming to provide a premium user experience.

## ✨ Features

- **Dashboard**: A centralized hub offering an overview of tasks, high-priority items, daily briefings, and productivity streaks.
- **Tasks & Checklists**: Advanced task management with energy-type categorization, AI-ranked focus tasks, and an integrated procrastination coach.
- **Calendar Integration**: A sleek, functional calendar view to keep track of deadlines and upcoming events.
- **Inbox & Messaging**: Unified communication channels to keep team discussions and notifications in one place.
- **Notes & Knowledge Base**: A quick-capture system for your thoughts and essential information.
- **Group Productivity**: Manage teams, projects, and goals efficiently. Features a 'Quantum Flow' team resonance field for collaborative visualization.
- **Workflows**: Map out and track multi-stage processes and tasks.
- **Admin & Reports**: Comprehensive overview and management of users, system health, and productivity metrics.

## 🚀 Tech Stack

- **Frontend**: React.js
- **Routing**: React Router
- **Styling**: Vanilla CSS with customized CSS Variables for dynamic theming (Clean Light, Synthwave, Cyberpunk, Crimson, Forest, Ocean, Dune, Sakura, Solarized, Dracula, Nord).
- **Icons**: Lucide React
- **Build Tool**: Vite

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd Aura
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🎨 Theming & Customization

Aura supports a wide array of themes that can be toggled by the user. The theming engine relies on CSS variables defined in `src/index.css`. To add a new theme, define a new data-theme block:

```css
[data-theme="YourTheme"] {
  --bg-color: #yourcolor;
  --surface-color: #yourcolor;
  --text-color: #yourcolor;
  /* ... */
}
```

## 📱 Mobile Responsiveness

Aura is built to look great on any device. It features a bottom navigation bar (`BottomNav`) for mobile users and a dedicated floating action button (FAB) for quick task creation that seamlessly hides on larger desktop screens.

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
