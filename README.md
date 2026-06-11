# Uncanny Valley Survey

An interactive Next.js application designed to study and visualize the **Uncanny Valley effect**—the relationship between a robot's human realism and human preferences regarding their fitness for various everyday tasks.

---

## How the Surveys Work

The application guides participants through a structured two-stage survey flow.

### Stage 1: Realism Rating (Survey 1)
* **Goal**: Assess the perceived physical realism of different robot designs.
* **Flow**: 
  * Participants are presented with random robot images one at a time.
  * For each robot, participants rate its realism on a scale of **1 to 7** with visual markers for reference (where `1 = Industrial robot` accompanied by an industrial robot icon, `4 = Cartoonish/Animatronic` accompanied by a golem robot icon, and `7 = Barely tell it's a robot` accompanied by a human icon).
  * **Industrial Verification Check**: If a participant selects rating `1` for three or more robots, the survey halts and presents a verification modal displaying an industrial robot image (`IndurstrialRobotExample.jpg`) and warning: *"You are marking a lot of robots as industrial looking, do they look like this? Try again"*. Clicking `"Try Again"` resets their Survey 1 answered count to 0, clears their session's Survey 1 ratings from the JSON data storage, and restarts them from question 1.
  * Participants complete exactly **5 valid questions** in this stage.
  * Upon submitting the 5th rating, the system automatically redirects them to **Survey 2**.

### Stage 2: Task Fitness Ranking (Survey 2)
* **Goal**: Map task preferences to different robot designs.
* **Flow**:
  * Participants complete **3 sequential ranking questions** corresponding to three unique everyday scenarios:
    1. *"Which robot would you prefer to serve you food?"*
    2. *"Which robot would you prefer to take care of a sick loved one?"*
    3. *"Which robot would you prefer clean your home?"*
  * For each question, **5 random robots** are selected from the image pool.
  * **Interactive Spectrum UI**: Participants rank the robots from **Best/Most Fit** (highlighted in green on the left) to **Worst/Least Fit** (highlighted in red on the right).
  * **Controls**: Participants can click a robot to auto-fill the next available slot, click **✕** to remove it, or use **drag-and-drop** to place, swap, or reorder items.
  * **Completion**: Once all 3 questions are finished, a confetti celebration falls from the top of the screen as the completed survey modal displays, congratulating the participant and linking them to the Analytics dashboard.

---

## Scoring Methodology

* **Survey 1 (Realism)**: Ratings (1–7) are saved to calculate each robot's average realism score.
* **Survey 2 (Fitness)**: Preferences are scored based on ranking weights:
  * **1st place (Best)** = 5 points
  * **2nd place** = 4 points
  * **3rd place** = 3 points
  * **4th place** = 2 points
  * **5th place (Worst)** = 1 point

---

## Analytics Dashboard

The dashboard provides a premium, interactive overview of the collected research data:

### Demographics Filtering & Exporting
* **Age Range Slider**: A custom double-thumb range slider to isolate and analyze survey response datasets by specific participant ages (e.g. 18 to 80).
* **Age Group Presets**: Quick-select presets for common demographic age cohorts (17 to 24, 25 to 34, 35 to 44, 45 to 54, 55 to 64, 65 or older).
* **Ignore Low-Vote Rankings**: A checkbox option in the task rankings section to hide robots that have fewer than 3 responses, focusing analysis on designs with statistically significant voter representation.
* **Export Data**: A "Download JSON Data" button to export all survey responses for offline analysis.

### 1. Key Insights
* **Most Selected Realism Level**: Identifies which realism pool (1–7) accumulated the most preference points in Survey 2, helping identify if people prefer highly realistic or cartoonish/mechanical robots for tasks.
* **Best Rated Robot Overall**: Shows the robot with the highest average Survey 2 ranking score across all tasks.

### 2. Realism Spectrum & Image Pools (Survey 1)
* Robots are grouped into **7 realism pools** based on their average realism rating.
* On desktop, pools are displayed as tall, thin columns arranged side-by-side to show the visual spectrum.
* Robots within each pool are shown in a clean, overlapping horizontal avatar stack that expands on hover.
* **Interactive Tooltip**: Hovering over any robot avatar opens a card displaying:
  * Large image preview.
  * **Average (Mean)** realism rating.
  * **Total Response** count.
  * **Mode** rating.
  * **Variance** of its ratings.
  * A custom **distribution bar chart** showing the vote frequencies for ratings 1–7.

### 3. Robot Rankings by Task (Survey 2)
* For each of the three tasks, **all robots** are ranked in order of preference and displayed in a horizontally scrollable list (1st place on the far left, lowest on the right).
* **Pool-Based Accents**: Each robot card is accented with a top border in the color of its realism pool (matching the colors of the Realism Spectrum & Image Pools) for easy identification.
* **Statistical Hover Card**: Hovering over a ranked robot displays:
  * **Average Realism Rating**: The robot's overall realism rating from Survey 1.
  * **Mean**: Average preference score (out of 5.0).
  * **Median**: Median preference score.
  * **Mode**: Most frequent preference score.
  * **Score Variance**: Calculated using population variance ($\sigma^2 = \frac{\sum (x - \mu)^2}{N}$) to measure the degree of participant agreement/disagreement.
  * **Rankings Cast**: The total number of rankings/votes cast specifically for this robot in this task.

---

## Architecture & Data Storage

* **Database-Free**: Data is stored locally in the `/data` folder in JSON files (`survey1.json` and `survey2.json`).
* **Self-Healing File System**: The `/data` directory and JSON files are generated automatically. If they are missing or deleted, the application starts with empty datasets and initializes them on the first survey submission.
* **Git Ignored Data**: The local data files are excluded from Git to prevent merge conflicts during deployments/pulls.

---

## How to Run the Project Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   ```
