How to Build Your Chrome Extension

Follow these simple steps on your computer (Mac or Windows) to package the dashboard into an installable Chrome Extension.

Prerequisites

Make sure you have Node.js installed on your computer.

Step 1: Create the Project

Open your computer's Terminal (or Command Prompt) and run:

npm create vite@latest ceo-dashboard -- --template react
cd ceo-dashboard


Step 2: Install the Required Packages

Install the UI icons and Tailwind CSS:

npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p


(Note: Configure your tailwind.config.js to scan your React files according to standard Tailwind docs).

Step 3: Add Your Code

Copy the App.jsx code from our chat window and replace the contents of src/App.jsx.

Save the manifest.json and background.js (from above) directly into your project's public/ folder. (You can also add a small 128x128 image named icon.png in this folder to act as your extension icon).

Replace the vite.config.js file in your project's root folder with the custom one provided above.

Step 4: Compile the Extension

Run the build command:

npm run build


This will create a new folder called dist in your project. This dist folder is your final Chrome Extension.

Step 5: Install it in Chrome

Open Google Chrome and go to chrome://extensions/

Turn on Developer mode (toggle in the top right corner).

Click the Load unpacked button in the top left.

Select the dist folder you just created.

Done! The extension icon will now appear in your Chrome toolbar. Clicking it will open your secure, local Executive Command Center.
