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
    'Find your name below, then hover or tap it to light up your table on the floor plan.',
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

// Placeholder guest list until the real assignments land — every name below is
// invented. Eight seats per table, twenty tables.
const tableGuests: Record<number, string[]> = {
  1: ['Aarav Mehta', 'Anika Mehta', 'Devika Rao', 'Kiran Rao', 'Rohan Bhatt', 'Sanya Bhatt', 'Vikram Iyer', 'Nisha Iyer'],
  2: ['Emily Carter', 'James Carter', 'Olivia Brooks', 'Daniel Brooks', 'Grace Whitman', 'Henry Whitman', 'Chloe Bennett', 'Lucas Bennett'],
  3: ['Priya Nair', 'Arjun Nair', 'Meera Pillai', 'Ashwin Pillai', 'Divya Menon', 'Karthik Menon', 'Lakshmi Varma', 'Suresh Varma'],
  4: ['Sophie Lang', 'Marcus Lang', 'Isabella Reyes', 'Diego Reyes', 'Hannah Cole', 'Ethan Cole', 'Ava Sinclair', 'Noah Sinclair'],
  5: ['Rhea Kapoor', 'Kabir Kapoor', 'Tara Malhotra', 'Dev Malhotra', 'Ishaan Chopra', 'Zara Chopra', 'Aditi Bhalla', 'Nikhil Bhalla'],
  6: ['Maya Krishnan', 'Vivek Krishnan', 'Ananya Reddy', 'Harsha Reddy', 'Sneha Kulkarni', 'Rahul Kulkarni', 'Pooja Deshpande', 'Amit Deshpande'],
  7: ['Lily Hayes', 'Owen Hayes', 'Ruby Dawson', 'Felix Dawson', 'Nora Ellis', 'Miles Ellis', 'Clara Foster', 'Jude Foster'],
  8: ['Simran Gill', 'Manav Gill', 'Jasleen Sandhu', 'Angad Sandhu', 'Kavya Anand', 'Rohit Anand', 'Ritu Saxena', 'Varun Saxena'],
  9: ['Alice Monroe', 'Peter Monroe', 'Diana Wells', 'Frank Wells', 'Elena Vargas', 'Mateo Vargas', 'Sara Holt', 'Leo Holt'],
  10: ['Neha Joshi', 'Sameer Joshi', 'Ira Trivedi', 'Yash Trivedi', 'Shreya Dixit', 'Kunal Dixit', 'Payal Vyas', 'Dhruv Vyas'],
  11: ['Margot Fields', 'Theo Fields', 'June Parker', 'Wesley Parker', 'Iris Coleman', 'Silas Coleman', 'Faye Sutton', 'Reid Sutton'],
  12: ['Aisha Khan', 'Imran Khan', 'Fatima Sheikh', 'Zaid Sheikh', 'Sana Qureshi', 'Omar Qureshi', 'Hira Baig', 'Asad Baig'],
  13: ['Nina Petrov', 'Alexei Petrov', 'Lena Novak', 'Tomas Novak', 'Mira Kovacs', 'Andrei Kovacs', 'Sofia Ivanov', 'Dmitri Ivanov'],
  14: ["Anjali Menezes", "Ryan Menezes", "Tanya D'Souza", "Kevin D'Souza", 'Michelle Pinto', 'Alan Pinto', 'Natasha Fernandes', 'Craig Fernandes'],
  15: ['Harper Quinn', 'Declan Quinn', 'Willow Marsh', 'Callum Marsh', 'Ivy Thornton', 'Rhys Thornton', 'Esme Caldwell', 'Finn Caldwell'],
  16: ['Radhika Sethi', 'Mohit Sethi', 'Bhavna Arora', 'Sahil Arora', 'Kritika Bajaj', 'Tarun Bajaj', 'Shalini Khanna', 'Gaurav Khanna'],
  17: ['Zoe Winters', 'Adam Winters', 'Talia Frost', 'Micah Frost', 'Delia Hart', 'Simon Hart', 'Wren Ashford', 'Cole Ashford'],
  18: ['Deepa Raman', 'Suraj Raman', 'Vidya Srinivas', 'Mohan Srinivas', 'Gita Raghavan', 'Anil Raghavan', 'Uma Chandran', 'Prakash Chandran'],
  19: ['Camille Dubois', 'Julien Dubois', 'Amelie Laurent', 'Marc Laurent', 'Elise Moreau', 'Hugo Moreau', 'Celine Girard', 'Luc Girard'],
  20: ['Kiara Oberoi', 'Aryan Oberoi', 'Ridhima Puri', 'Vihaan Puri', 'Myra Tandon', 'Reyansh Tandon', 'Avni Chadha', 'Shaan Chadha'],
}

export const guests: Guest[] = Object.entries(tableGuests).flatMap(
  ([table, names]) => names.map((name) => ({ name, table: Number(table) })),
)
