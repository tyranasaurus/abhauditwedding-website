export interface SeatingTable {
  number: number
  /** Table center as a percentage of the floor-plan image. */
  x: number
  y: number
  /** Tabletop radius as a percentage of the image width. */
  r: number
}

export const seatingIntro = {
  kicker: 'Sangeet Reception · The Hippodrome',
  title: 'Find your seat',
  blurb:
    'Search for your name, then tap it to light up your table on the floor plan.',
} as const

// Positions are measured against the watercolor floor plan
// (public/art/map/seating-floorplan.webp, 1536×2752) by fitting a circle to
// each painted tabletop's outline, so the highlight ring hugs the table edge.
export const tables: SeatingTable[] = [
  { number: 1, x: 15.95, y: 80.31, r: 5.66 },
  { number: 2, x: 83.9, y: 80.3, r: 5.6 },
  { number: 3, x: 15.94, y: 69.83, r: 5.66 },
  { number: 4, x: 83.93, y: 69.85, r: 5.66 },
  { number: 5, x: 21.93, y: 58.67, r: 5.47 },
  { number: 6, x: 37.7, y: 58.65, r: 5.4 },
  { number: 7, x: 63.07, y: 58.65, r: 5.4 },
  { number: 8, x: 78.71, y: 58.67, r: 4.82 },
  { number: 9, x: 12.46, y: 49.11, r: 5.01 },
  { number: 10, x: 26.33, y: 49.1, r: 4.95 },
  { number: 11, x: 40.39, y: 49.11, r: 5.14 },
  { number: 12, x: 58.65, y: 49.1, r: 5.01 },
  { number: 13, x: 72.7, y: 49.1, r: 5.14 },
  { number: 14, x: 86.66, y: 49.09, r: 5.08 },
  { number: 15, x: 12.75, y: 39.68, r: 5.08 },
  { number: 16, x: 26.54, y: 39.69, r: 4.95 },
  { number: 17, x: 40.52, y: 39.63, r: 5.08 },
  { number: 18, x: 59.12, y: 39.68, r: 5.08 },
  { number: 19, x: 73.03, y: 39.66, r: 5.01 },
  { number: 20, x: 86.81, y: 39.63, r: 4.95 },
]

export interface Guest {
  name: string
  table: number
}

// Seating as provided by Abha & Udit. Each entry below is one table; the key
// is the number painted on the floor plan.
const tableGuests: Record<number, string[]> = {
  1: ['Shirish', 'Kirthika', 'Ira', 'Piyush', 'Reena', 'Alok', 'Nikita', 'Meenakshi', 'Sumeet'],
  2: ['Priya', 'Pooja', 'Anushka', 'Deeksha', 'Sachita', 'Nirvika', 'Shrey', 'Manya', 'Nitya'],
  3: ['Parita', 'Ajay', 'Anjali', 'Yash', 'Ami', 'Hardik', 'Siya', 'Deyan', 'Satish', 'Manda'],
  4: ['Roli', 'Nemi', 'Tinki', 'Snehahish', 'Shaila', 'Nani', 'Nana'],
  5: ['Mona Rekhi', 'Naresh Rekhi', 'Sandeep Bhoot', 'Madhura Bhoot', 'Rhidaya Bhoot', 'Munmaya Mishra', 'Bidu Mishra'],
  6: ['Anju Pansari', 'Martin Mordaunt', 'Nikita Mordaunt', 'Gopi Pansari', 'Asha Pansari'],
  7: ['Hemant Agrawal', 'Madhulata Agrawal', 'Shiv Singhania', 'Babita Singhania', 'Pushpa Sihania', 'Arvind Ranasaria', 'Shivanand Ranasaria', 'Gayatri Ranasaria'],
  8: ['Chaitanya Agrawal', 'Harsh Agrawal', 'Kahini Sapra', 'Meghavi', 'Vaibhav Agarwal', 'Arpit Ranasaria', 'Ronak Agarwal'],
  9: ['Madhavi Pakalapati', 'Rama Pakalapati', 'Hima Krothapalli', 'Kalyan Krothapalli', 'Rashmi Nagpal', 'Rajest Nagpal', 'Smita Chappidi', 'Venkat Kakanuru', 'Parul Dalia', 'Apporva Dalia'],
  10: ['Geetha Sivaprasad', 'Krishnan Gowri', 'Vasanthi Gowri', 'Shanthi Sravanakumar', 'SravanaKumar Karnati', 'Sanjeev Qazi', 'Reema Qazi'],
  11: ['Rukmani Gopalan', 'Sriram Govindrajan', 'Viijayanti Murali', 'Murali Gopalan', 'Sarada Bharadwaj', 'Shankar Bharadwaj', 'Neha Jain', 'Dhiresh Rawal', 'Manju Sarda', 'Pankaj Sarda'],
  12: ['Jignesh Kacharia', 'Vandana Mehta', 'Krishna Meduri', 'Neelakshi Meduri', 'Parag Kacharia', 'Deepa Gangar', 'Vikas Khanna mom', 'Vikas Khanna dad', 'Vikas Khanna', 'Shivani Khanna'],
  13: ['Naveen Sachdeva', 'Seema Kukreja', 'Rajeev Wahi', 'Deepika Wahi', 'Advait Wahi', 'Gopi Sethu'],
  14: ['Ben Landis', 'Cameron Selby', 'Dominique Selby', 'Haley Dalzell', 'Zach Dawson', 'Valentina Kozina', 'Brad Powell', 'Vasu Agrawal', 'Vivek Sridhar'],
  15: ['Tejas Pakalapati', 'Joshika Pakalapati', 'Monisha Krothapalli', 'Akash Krothapalli', 'Adi Dalia', 'Neha Dalia', 'Shreyas Kakanuru', 'Vihaan Rawal', 'Kria Rawal', 'Lea Im'],
  16: ['Annam Khan', 'Hannah Wiseman', 'Cindy Deng', 'Deepak Pallerla', 'Jade Traiger', 'Jeremy Ong', 'Sarah Lu', 'Medha Potluri', 'Vidhart Bhatia'],
  17: ['Suyash', 'Anjali', 'Tej Seth', 'Abhi Sivaprasad', 'Suvansh', 'Nikita', 'Rishav Dutta', 'Cheyenne Kim'],
  18: ['Sabreen Mohammed', 'Shravya', 'Sophia', 'Daniel Mar', 'Ori', 'Anoosh', 'Sukrit', 'Max Slater', 'Joanna Yao'],
  19: ['Akshat Khanna', 'Akshita Khanna', 'Alicia Kacharia', 'Natasha Kacharia', 'Rohin Meduri', 'Sathvik Kakanuru', 'Valentina Ortega', 'Spursh Kacharia', 'Reeteka Kudallur', 'Saransh Kacharia'],
  20: ['Tejas Bharadwaj', 'Sneha Bharadwaj', 'Chrish Thakalath', 'Ananya Murali', 'Abhi Soni', 'Adit Murali', 'Shreyas Murali', 'Dhanya Bharadwaj', 'Anish Bharadwaj', 'Gokul Gowri'],
}

// Flattened for the list and the search box. Names are not unique — two
// different guests share a first name — so the table is part of each key.
export const guests: Guest[] = Object.entries(tableGuests).flatMap(
  ([table, names]) => names.map((name) => ({ name, table: Number(table) })),
)
