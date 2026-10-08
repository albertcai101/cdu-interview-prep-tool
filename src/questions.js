// Situational question bank themed around CDU's mission (service to underserved
// communities, health equity, professionalism, teamwork, ethics, resilience).
export const QUESTIONS = [
  { cat: 'Professionalism & Integrity', q: 'You notice a close teammate has been cutting corners on a shared project and presenting the work as fully complete. The deadline is tomorrow. What do you do?' },
  { cat: 'Professionalism & Integrity', q: 'You realize you made a mistake that no one else has noticed, and it could affect the outcome of your group’s work. How do you handle it?' },
  { cat: 'Professionalism & Integrity', q: 'A supervisor asks you to do something that you believe is not quite right, but not clearly against the rules. What do you do?' },
  { cat: 'Teamwork & Conflict', q: 'You are leading a group where two members strongly disagree and the conflict is slowing the team down. How do you respond?' },
  { cat: 'Teamwork & Conflict', q: 'A teammate is not contributing their share, and the rest of the group is becoming frustrated. What steps would you take?' },
  { cat: 'Teamwork & Conflict', q: 'You receive critical feedback from a mentor that you feel is unfair. How do you respond in the moment, and afterward?' },
  { cat: 'Serving Underserved Communities', q: 'You are volunteering at a community health fair and a community member says they do not trust doctors or clinics. How do you respond?' },
  { cat: 'Serving Underserved Communities', q: 'A patient repeatedly misses follow-up appointments because of transportation and work schedule barriers. As a member of the care team, what would you do?' },
  { cat: 'Serving Underserved Communities', q: 'Your clinic serves a neighborhood where many patients speak a language you do not. A patient is trying to explain a serious symptom. What do you do?' },
  { cat: 'Health Equity & Ethics', q: 'You learn that patients in a nearby community receive noticeably worse care than patients elsewhere in the same system. What would you do with that information?' },
  { cat: 'Health Equity & Ethics', q: 'A patient refuses a treatment that you and the team believe is clearly in their best interest. How do you approach the situation?' },
  { cat: 'Health Equity & Ethics', q: 'A family member asks you to keep a diagnosis from the patient. How do you handle this?' },
  { cat: 'Resilience & Self-Awareness', q: 'You are juggling school, work, and family obligations, and everything comes due in the same week. How do you decide what to prioritize?' },
  { cat: 'Resilience & Self-Awareness', q: 'You fail an important exam or assignment for the first time. What do you do next?' },
  { cat: 'Resilience & Self-Awareness', q: 'You are in a high-pressure situation and begin to feel overwhelmed. How do you keep yourself effective?' },
  { cat: 'Leadership & Initiative', q: 'You see a problem in your community or workplace that nobody seems to be addressing. What do you do?' },
  { cat: 'Leadership & Initiative', q: 'You are asked to lead a project in an area where you have little experience. How do you approach it?' },
  { cat: 'Empathy & Communication', q: 'A frightened patient or family member becomes angry and takes it out on you. How do you respond?' },
  { cat: 'Empathy & Communication', q: 'You need to explain something complex to someone with limited health literacy. How do you make sure they understand?' },
  { cat: 'Empathy & Communication', q: 'A friend confides that they are struggling with their mental health but asks you to tell no one. What do you do?' },
];

export const CATEGORIES = [...new Set(QUESTIONS.map((x) => x.cat))];

export const PRACTICE_QUESTION = {
  cat: 'Practice',
  q: 'This is a practice question. Check that your face is centered and well lit, and that your voice is clear. Then describe, in your own words, what you did last weekend.',
};

export const TIPS = [
  { t: 'Use the prep time to outline, not script', d: 'Jot 3 beats in your head: what the situation really asks, what you would do, and why. Scripted answers sound robotic on camera.' },
  { t: 'Try a STAR-ish structure', d: 'Situation → Task → Action → Result. For hypotheticals: "First I would… Then… Because… The outcome I’m aiming for is…".' },
  { t: 'Name the stakeholders', d: 'Who is affected? Patient, teammate, community, you. Showing you see everyone is the heart of most situational questions.' },
  { t: 'Show your values, not just steps', d: 'Tie your answer to honesty, respect, equity, accountability. Connect to serving underserved communities where it is natural, not forced.' },
  { t: 'Talk to the lens', d: 'Look at the camera, not your own face. Smile at the start and keep your tone conversational.' },
  { t: 'Use most of your time', d: 'Aim to finish your thought in about 80–95% of the time. Stopping at 30 seconds usually means the answer was thin.' },
  { t: 'Don’t restart if you stumble', d: 'There is no re-record. Pause, breathe, and keep going. Recovering gracefully is a good signal.' },
  { t: 'Check your setup', d: 'Camera at eye level, light facing you (not behind), quiet room, plain background, strong Wi-Fi, laptop plugged in.' },
];
