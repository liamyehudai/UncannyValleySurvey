# Uncanny Valley Survey

An interactive Next.js application designed to study and visualize the **Uncanny Valley effect**—the relationship between a robot's human realism and human preferences regarding their fitness for various everyday tasks.

---

## How the Surveys Work

The application guides participants through a structured two-stage survey flow.

### Stage 1: Realism Rating (Survey 1)
* **Goal**: Assess the perceived physical realism of different robot designs.
* **Flow**: 
  * Participants are presented with random robot images one at a time.
  * For each robot, participants rate its realism on a scale of **1 to 7** (where `1 = Not human at all`, `4 = Cartoonish/Animatronic`, and `7 = Barely tell it's a robot`).
  * Participants complete exactly **5 random questions** in this stage.
  * Upon submitting the 5th rating, the system automatically redirects them to **Survey 2**.

### Stage 2: Task Fitness Ranking (Survey 2)
* **Goal**: Map task preferences to different robot designs.
* **Flow**:
  * Participants complete **3 sequential ranking tasks** corresponding to three unique everyday scenarios:
    1. *"Which robot would you prefer to serve you food?"*
    2. *"Which robot would you prefer to take care of a sick loved one?"*
    3. *"Which robot would you prefer clean your home?"*
  * For each task, **5 random robots** are selected from the image pool.
  * **Interactive Spectrum UI**: Participants rank the robots from **Best/Most Fit** (highlighted in green on the left) to **Worst/Least Fit** (highlighted in red on the right).
  * **Controls**: Participants can click a robot to auto-fill the next available slot, click **✕** to remove it, or use **drag-and-drop** to place, swap, or reorder items.
  * **Completion**: Once all 3 tasks are finished, a completion screen congratulates the participant and links them to the Analytics dashboard.

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

### 3. Top 5 Fit Robots by Task (Survey 2)
* For each of the three tasks, the **top 5 performing robots** are displayed left-to-right (1st to 5th place) based on their average ranking score.
* **Statistical Hover Card**: Hovering over a ranked robot displays:
  * **Mean**: Average preference score (out of 5.0).
  * **Median**: Median preference score.
  * **Mode**: Most frequent preference score.
  * **Score Variance**: Calculated using population variance ($\sigma^2 = \frac{\sum (x - \mu)^2}{N}$) to measure the degree of participant agreement/disagreement.

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
