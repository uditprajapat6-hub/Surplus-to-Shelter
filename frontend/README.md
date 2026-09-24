# Surplus-to-Shelter MVP

Welcome to the Surplus-to-Shelter hackathon project! This MVP tackles the **Track A** problem statement from AmiHacks: *Real-Time Food Rescue Routing*.

## 🚀 Getting Started

1. **Prerequisites**: Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
2. **Install Dependencies**: Open your terminal in this folder (`frontend`) and run:
   ```bash
   npm install
   ```
3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
4. **Open in Browser**: The terminal will show a local link (usually `http://localhost:5173`). Click it to view the app!

## 📁 Project Structure (Where to look)

- `src/App.jsx`: **Start here!** This is the main React component. It contains the application state, the donation form, the live dispatch feed, and the impact dashboard. I have added **detailed inline comments** explaining how the React state works and what each section does so you can easily pick up where I left off.
- `src/index.css`: This file contains all the global styling. We are using a premium, dark-mode "glassmorphism" design. If you want to change colors, look for the CSS variables at the very top (`:root`).
- `package.json`: Contains our project scripts and dependencies (like `lucide-react` for icons).

## 💡 What's Next for the Team? (Hackathon Tasks)

Here are some features you can grab and start working on:
1. **Backend API Integration**: In `App.jsx`, find the `handleDonate` function. Currently, it uses a fake `setTimeout` to simulate an API call. You can replace this with a real `fetch` or `axios` call to our backend database.
2. **Interactive Maps**: Integrate Google Maps API or Mapbox in the "Live Matches" tab to visually show the routing distance for drivers.
3. **User Authentication**: Add a login flow so that Donors, Shelters, and Drivers all see different customized views instead of a unified dashboard.

Happy Hacking! 💻 Let's win this!
