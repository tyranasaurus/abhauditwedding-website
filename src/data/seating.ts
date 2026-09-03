export interface SeatingTable {
  number: number
  /** Table center as a percentage of the floor-plan image. */
  x: number
  y: number
  /** Tabletop radius as a percentage of the image width. */
  r: number
}

export const seatingIntro = {
  title: 'Find your seat',
} as const

// Positions are measured against the watercolor floor plan
// (public/art/map/seating-floorplan.webp, 1600×1987) by finding each painted
// tabletop and taking its bounding box's centre and radius, so the highlight
// ring hugs the table edge. The box rather than the centroid: an unevenly
// painted wash drags a centroid toward its darker side, which left table 19
// sitting visibly off its tabletop. They are DERIVED from the artwork, not hand-placed: a
// redraw of the plan invalidates every one of them, so re-measure rather than
// nudge. Numbering runs up the hall — table 0 is the bottom-left pair.

export const tables: SeatingTable[] = [
  { number: 0, x: 15, y: 75.25, r: 4.5 },
  { number: 1, x: 85, y: 75.25, r: 4.56 },
  { number: 2, x: 15.11, y: 59.09, r: 4.41 },
  { number: 3, x: 84.94, y: 59.09, r: 4.44 },
  { number: 4, x: 18.44, y: 44, r: 4.5 },
  { number: 5, x: 32.56, y: 44, r: 4.44 },
  { number: 6, x: 67.5, y: 44, r: 4.41 },
  { number: 7, x: 81.56, y: 44, r: 4.44 },
  { number: 8, x: 12.5, y: 28.92, r: 4.5 },
  { number: 9, x: 25.39, y: 28.92, r: 4.44 },
  { number: 10, x: 38.5, y: 28.96, r: 4.41 },
  { number: 11, x: 61.61, y: 28.96, r: 4.41 },
  { number: 12, x: 74.44, y: 28.92, r: 4.35 },
  { number: 13, x: 87.56, y: 28.96, r: 4.5 },
  { number: 14, x: 12.5, y: 13.79, r: 4.5 },
  { number: 15, x: 25.5, y: 13.83, r: 4.41 },
  { number: 16, x: 38.5, y: 13.97, r: 4.44 },
  { number: 17, x: 61.44, y: 13.79, r: 4.35 },
  { number: 18, x: 73.94, y: 13.97, r: 4.09 },
  { number: 19, x: 87.5, y: 13.88, r: 4.44 },
]

export interface Guest {
  name: string
  table: number
}

// Seating as provided by Abha & Udit, transcribed from their reception seating
// sheet. Each entry below is one table; the key is the table's own number, and
// the tables are numbered from zero.
//
// The sheet groups guests into columns with working nicknames and maps those
// columns onto table numbers further down. Only the names and the numbers
// belong here — the nicknames are theirs, not the guests', and never ship.
const tableGuests: Record<number, string[]> = {
  0: ['Suvansh Sanjeev', 'Nikita Kedia', 'Sukrit Arora', 'Ori Huang', 'Anoosh Reddy', 'Max Slater', 'Joanna Yao', 'Gokul Gowri', 'Abhi Sivaprasad'],
  1: ['Ben Landis', 'Cameron Selby', 'Dominique Selby', 'Haley Dalzell', 'Zach Dawson', 'Valentina Kozina', 'Brad Powell', 'Vasu Agrawal', 'Vivek Sridhar'],
  2: ['Sabreen Mohammed', 'Shravya Kakulamarri', 'Sophia Tevosyan', 'Daniel Mar', 'Jeremy Ong', 'Sarah Lu', 'Vidhart Bhatia', 'Lea Im', 'Medha Potluri'],
  3: ['Annam Khan', 'Hannah Wiseman', 'Cindy Deng', 'Deepak Pallerla', 'Jade Traiger', 'Ricky Hage'],
  4: ['Akshat Khanna', 'Akshita Khanna', 'Alicia Kacharia', 'Natasha Kacharia', 'Rohin Meduri', 'Spursh Kacharia', 'Reeteka Kudallur', 'Saransh Kacharia'],
  5: ['Chaitanya Agrawal', 'Harsh Agrawal', 'Kahini Sapra', 'Meghavi Singhania', 'Vaibhav Agarwal', 'Arpit Ranasaria', 'Ronak Agarwal'],
  6: ['Priya Rastogi', 'Pooja Rastogi', 'Anushka Jain', 'Deeksha Gupta', 'Sachita Gupta', 'Nirvika Gupta'],
  7: ['Anjali Amin', 'Yash Amin', 'Siya Jani', 'Deyan Jani', 'Rhidaya Bhoot', 'Manya Tayal', 'Shrey Tayal'],
  8: ['Tejas Bharadwaj', 'Sneha Bharadwaj', 'Chrish Thakalath', 'Ananya Murali', 'Abhi Soni', 'Adit Murali', 'Shreyas Srinivasan', 'Dhanya Bharadwaj', 'Anish Bharadwaj'],
  9: ['Sam Bruchhaus', 'Rishav Dutta', 'Cheyenne Kim', 'Tej Seth', 'Suyash Sanjeev', 'Anjali Katta', 'Sathvik Kakanuru', 'Valentina Ortega', 'Shreyas Kakanuru', 'Kathy Cui'],
  10: ['Hemant Agrawal', 'Madhulata Agrawal', 'Shiv Singhania', 'Babita Singhania', 'Pushpa Sihania', 'Arvind Ranasaria', 'Shivanand Ranasaria', 'Gayatri Ranasaria'],
  11: ['Roli Agrawal', 'Nemi Agrawal', 'Nitya Agrawal', 'Harish Gupta', 'Sita Gupta', 'Piyush Rastogi', 'Ira Rastogi', 'Snehahish Kumar', 'Laxmi Agrawal', 'Shaila Kumar'],
  12: ['Reena Jain', 'Alok Jain', 'Nikita Jain', 'Kirthika', 'Shirish Gupta', 'Bidu Mishra', 'Munmaya Mishra', 'Meenakshi Tayal', 'Sumeet Tayal'],
  13: ['Madhura Bhoot', 'Sandeep Bhoot', 'Mona Rekhi', 'Naresh Rekhi', 'Parita Amin', 'Ajay Amin', 'Ami Jani', 'Hardik Jani', 'Satish Jani', 'Manda Jani'],
  14: ['Tejas Pakalapati', 'Joshika Pakalapati', 'Monisha Krothapalli', 'Akash Krothapalli', 'Vihaan Rawal', 'Kria Rawal', 'Advait Wahi', 'Adi Dalia', 'Neha Dalia'],
  15: ['Rukmani Gopalan', 'Sriram Govindrajan', 'Vajayanthi Murali', 'Murali Gopalan', 'Sarada Bharadwaj', 'Shankar Bharadwaj', 'Manju Sarda', 'Pankaj Sarda'],
  16: ['Anju Pansari', 'Martin Mordaunt', 'Nikita Mordaunt', 'Gopi Pansari', 'Asha Pansari', 'Naveen Sachdeva', 'Seema Kukreja', 'Rajeev Wahi', 'Deepika Wahi', 'Gopi Sethu'],
  17: ['Jignesh Kacharia', 'Vandana Mehta', 'Krishna Meduri', 'Neelakshi Meduri', 'Parag Kacharia', 'Deepa Gangar', 'Neelam Ahuja', 'Ravi Ahuja', 'Vikas Khanna', 'Shivani Khanna'],
  18: ['Madhavi Pakalapati', 'Rama Pakalapati', 'Hima Krothapalli', 'Kalyan Krothapalli', 'Rashmi Nagpal', 'Rajesh Nagpal', 'Smita Chappidi', 'Venkat Kakanuru', 'Parul Dalia', 'Apoorva Dalia'],
  19: ['Geetha Sivaprasad', 'Krishnan Gowri', 'Vasanthi Gowri', 'Sanjeev Qazi', 'Reema Qazi', 'Shanthi Sravanakumar', 'SravanaKumar Karnati', 'Neha Jain', 'Dhiresh Rawal'],
}

// Flattened for the list and the search box. Names are not unique — two
// different guests share a first name — so the table is part of each key.
export const guests: Guest[] = Object.entries(tableGuests).flatMap(
  ([table, names]) => names.map((name) => ({ name, table: Number(table) })),
)
