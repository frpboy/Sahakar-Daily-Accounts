This is a **UI/UX Design Systems & Color Guidelines** document specifically tailored for your **DOAMS (Daily Outlet Account Management System)**.

Since this is an **internal enterprise tool** and not a public SaaS, the focus is on **high information density, high contrast, and data accuracy** over decorative visuals.

---

# DOAMS: UI/UX & Color Scheme Guidelines

## 1. Core Brand Palette
The foundation of the app is high-contrast minimalist.

| Element | Color Hex | CSS / Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| **Primary (Actions)** | `#000000` | `bg-black` / `text-black` | Buttons, Sidebar Icons, Main Headings. |
| **Background** | `#FFFFFF` | `bg-white` | Page background, card backgrounds. |
| **Borders/Lines** | `#E5E7EB` | `border-gray-200` | Table dividers, input borders, card outlines. |
| **Neutral Text** | `#374151` | `text-gray-700` | Secondary labels, descriptions. |

---

## 2. Contextual Logic Colors (The "Pulse" of the Business)
These colors are used strictly for financial status. Do not use them for decoration.

### **🟢 Success & Profit (Green)**
*   **Hex:** `#10B981` (Emerald 500)
*   **Logic:** 
    *   Net Profit > 0.
    *   Amount Is **Tally** (Calculated Total == Entered Total).
    *   Submission Successful.
*   **Text Rule:** Use bold font for green numbers.

### **🔴 Danger & Loss (Red)**
*   **Hex:** `#EF4444` (Red 500)
*   **Logic:**
    *   Net Profit < 0 (Net Loss).
    *   Amount **Mismatch** (Calculated Total != Entered Total).
    *   Validation Errors (Future dates, empty required fields).
*   **UX Note:** When an "Amount Mismatch" occurs, the background of the mismatch text should be a light red tint (`#FEE2E2`) to catch the eye.

### **🔵 Neutral & Info (Blue)**
*   **Hex:** `#3B82F6` (Blue 500)
*   **Logic:**
    *   General information/Instruction text.
    *   Selected active tabs.
    *   "No Data Available" states.

### **🟡 Warning & Pending (Yellow)**
*   **Hex:** `#F59E0B` (Amber 500)
*   **Logic:**
    *   Pending Verification (Accounting stage).
    *   Low stock warnings.
    *   "Draft" status for entries.

---

## 3. Typography & Data Hierarchy
*   **Primary Font:** Inter or San Francisco (System Sans-serif).
*   **Financial Figures:** Use **Monospaced Fonts** (e.g., `font-mono` in Tailwind) for tables. This ensures decimal points align perfectly, making it easier for accountants to scan vertically.
*   **Currency Symbol:** Always include the `₹` symbol in a slightly lighter gray than the amount to keep focus on the number.

---

## 4. Component Behavior (Enterprise Guidelines)

### **A. Buttons (Black Primary)**
*   **Style:** Sharp or slightly rounded corners (4px).
*   **States:** 
    *   Hover: Dark Gray (`#1F2937`).
    *   Disabled: Light Gray background with white text (Signifies no action available).
*   **Positioning:** Primary actions (Save/Submit) should be on the **bottom right** of forms.

### **B. Data Entry Forms (UX Logic)**
*   **Focus State:** When a user clicks a field, the border should turn **Black** (not blue).
*   **Numpad Optimization:** Ensure numeric inputs use `inputmode="decimal"` for mobile staff.
*   **Auto-Calculations:** The "Payment Total" and "Difference" (Tally logic) should update in **Real-time** as the user types, using the colors defined in Section 2.

### **C. Dashboard Cards**
*   **Layout:** "Top-down" hierarchy. Title first, Big Bold Number second, Contextual change percentage (Green/Red) third.
*   **Empty States:** As seen in your video ("No Outlets Reporting"), use a light gray centered icon to indicate the dashboard is empty for the selected date.

---

## 5. Role-Based View Adjustments

| Role | UI Density | Priority Element |
| :--- | :--- | :--- |
| **Admin** | High | Activity Trail & Global Profit/Loss. |
| **HO Accountant** | Very High | "All Reports" Table with fixed headers (Sticky). |
| **Outlet Manager** | Medium | Single-column form, easy-to-read "Tally" status. |
| **Outlet Accountant** | High | Individual outlet history and "Lock/Verify" status. |

---

## 6. Logic Mapping for Developers
*   **If `amount_difference === 0`:** `text-green-500`, label: "Amount is Tally!".
*   **If `amount_difference !== 0`:** `text-red-500`, label: "Amount Mismatch!".
*   **Profit Card:** `{{ profit < 0 ? 'text-red-500' : 'text-green-500' }}`.

---

### **Visual Checklist based on Video Analysis:**
1.  **Sync Success:** The "Configuration synced successfully" toast should remain green.
2.  **Chart of Accounts:** Group headers should be light gray backgrounds with black bold text.
3.  **Active Status:** "ACTIVE" tags in Account settings should be green background with dark green text (`bg-green-100 text-green-800`).