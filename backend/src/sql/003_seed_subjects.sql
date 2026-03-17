INSERT IGNORE INTO subjects (
  id,
  title,
  slug,
  description,
  thumbnail_url,
  is_published
) VALUES
  (
    1,
    'Java Foundations',
    'java-foundations',
    'A beginner-friendly LMS subject that demonstrates strict ordering, progress tracking, and YouTube-backed lessons.',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    TRUE
  ),
  (
    2,
    'Web Platform Basics',
    'web-platform-basics',
    'A short path through HTML, CSS, and browser rendering concepts using the same LMS learning flow.',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    TRUE
  );

INSERT IGNORE INTO sections (id, subject_id, title, order_index) VALUES
  (1, 1, 'Introduction to Java', 1),
  (2, 1, 'Syntax and Flow', 2),
  (3, 2, 'Foundations of the Browser', 1),
  (4, 2, 'Styling and Interaction', 2);

INSERT IGNORE INTO videos (
  id,
  section_id,
  title,
  description,
  youtube_url,
  order_index,
  duration_seconds
) VALUES
  (1, 1, 'What Java Is', 'Set context for the language, runtime, and common use cases.', 'https://www.youtube.com/watch?v=eIrMbAQSU34', 1, 460),
  (2, 1, 'Installing the JDK', 'Walk through setup and confirm your environment is ready.', 'https://www.youtube.com/watch?v=grEKMHGYyns', 2, 520),
  (3, 2, 'Variables and Data Types', 'Understand primitives, references, and naming conventions.', 'https://www.youtube.com/watch?v=2Xe-BbOzHEY', 1, 600),
  (4, 2, 'Conditionals and Loops', 'Practice flow control and build confidence with repetition.', 'https://www.youtube.com/watch?v=xk4_1vDrzzo', 2, 640),
  (5, 3, 'How the Web Works', 'Learn the request-response cycle and the role of the browser.', 'https://www.youtube.com/watch?v=7_LPdttKXPc', 1, 510),
  (6, 3, 'HTML Structure', 'Build a semantic page and understand document structure.', 'https://www.youtube.com/watch?v=qz0aGYrrlhU', 2, 570),
  (7, 4, 'CSS Layout Basics', 'Move from raw HTML to clean, structured interface layouts.', 'https://www.youtube.com/watch?v=1PnVor36_40', 1, 550),
  (8, 4, 'JavaScript in the Browser', 'Connect interactions, state, and DOM updates.', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 2, 720);
