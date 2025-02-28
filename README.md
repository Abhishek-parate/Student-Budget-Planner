# Team Bit Learners
# Student Budget Planner

A **React Native** app powered by **Supabase**, designed to help students effectively manage their expenses, track income, and stay within their budget.

## Problem-
- Managing finances is a major challenge for students as they struggle to balance their expenses with limited income. 
The rising cost of living, including rent, food, and tuition, makes it difficult for many to meet their financial needs.
- Additionally, unexpected expenses such as medical bills or laptop repairs add to their financial stress. 
Students who work part-time often find it hard to save money while covering their daily expenses. 
Moreover, peer pressure plays a significant role in unnecessary spending on outings and trends, further straining their budgets. 
- As a result, managing finances effectively becomes a continuous challenge for students.

## Solution-
- A Student Budget Planner is a smart tool that helps students manage money effectively by tracking expenses, categorizing spending, and providing bill reminders.
- It encourages better financial habits, such as using student discounts and avoiding unnecessary purchases. 
By setting savings goals and offering smart alerts, it helps students stay financially stable, reduce stress, and focus on their studies.

## Features
- 📊 **Expense Tracking** – Log daily expenses with category tagging.
- 💰 **Income Management** – Track monthly allowances, salaries, or any other sources of income.
- 📉 **Budget Analysis** – Visual charts to monitor spending habits.
- 🔔 **Spending Alerts** – Get notified when expenses exceed set limits.
- 🔐 **Secure & Fast** – Uses Supabase for authentication and data storage.
- 🌙 **Dark Mode Support** – User-friendly dark/light theme options.

## Tech Stack
- **Frontend:** React Native (Expo)
- **Backend:** Supabase (PostgreSQL, Authentication, Realtime DB)
- **State Management:** React Context API / Redux (optional)
- **UI Framework:** React Native Paper / NativeBase

## Installation
### Prerequisites
- Node.js & npm/yarn installed
- Expo CLI installed globally (`npm install -g expo-cli`)
- Supabase project set up

### Steps to Run the App
1. Clone this repository:
   ```sh
   git clone https://github.com/yourusername/student-budget-planner.git
   cd student-budget-planner
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up Supabase environment variables in a `.env` file:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   ```
4. Start the app:
   ```sh
   expo start
   ```


wireframe url
https://app.eraser.io/workspace/EAD5NCn7cDKKolOL24bu?origin=share


## Contributing
1. Fork the repo & clone it locally.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit (`git commit -m "Add new feature"`).
4. Push to your fork (`git push origin feature-branch`).
5. Submit a Pull Request.
